import { useState } from "react";
import { surveyQuestions, SurveyQuestion } from "./surveyConfig";
import { saveSurveyAnswer } from "./saveSurveyAnswer";

type SubmitResult = { ok: true } | { ok: false; error: string };
type NormalizedResult = { valid: true; value: unknown } | { valid: false; error: string };

export default function useSurvey() {
  const [surveyIndex, setSurveyIndex] = useState(0);
  const [surveyActive, setSurveyActive] = useState(false);

  const startSurvey = () => {
    setSurveyIndex(0);
    setSurveyActive(true);
  };

  const currentQuestion = surveyQuestions[surveyIndex] as SurveyQuestion | undefined;

  const normalizeAnswer = (q: SurveyQuestion, raw: string): NormalizedResult => {
    const trimmed = raw.trim();

    if (q.type === "single-choice") {
      const idx = letterToIndex(trimmed);
      const resolvedFromLetter = idx != null ? q.options[idx] : null;
      if (resolvedFromLetter) return { valid: true, value: resolvedFromLetter };

      const resolvedFromText = q.options.find(
        (opt) => opt.toLowerCase() === trimmed.toLowerCase()
      );
      if (resolvedFromText) return { valid: true, value: resolvedFromText };

      return { valid: false, error: "Please pick one of the listed options (a/b/c/...)." };
    }

    if (q.type === "multi-choice") {
      const parts = trimmed.split(/[\,\s]+/).filter(Boolean);
      if (!parts.length)
        return { valid: false, error: "Choose at least one option or separate letters with commas." };

      const invalid: string[] = [];
      const resolved: string[] = [];

      parts.forEach((p) => {
        const idx = letterToIndex(p);
        if (idx != null && q.options[idx]) {
          resolved.push(q.options[idx]);
          return;
        }

        const matched = q.options.find((opt) => opt.toLowerCase() === p.toLowerCase());
        if (matched) {
          resolved.push(matched);
          return;
        }

        invalid.push(p);
      });

      if (invalid.length) {
        return {
          valid: false,
          error: `Invalid choice${invalid.length > 1 ? "s" : ""}: ${invalid.join(", ")}. Use the provided letters/a,b,...`,
        };
      }

      return { valid: true, value: resolved };
    }

    if (q.type === "scale") {
      const num = Number(trimmed);
      if (!isNaN(num) && num >= q.scale.min && num <= q.scale.max) {
        return { valid: true, value: num };
      }
      return { valid: false, error: `Enter a number between ${q.scale.min}-${q.scale.max}.` };
    }

    // text
    return { valid: true, value: trimmed };
  };

  const letterToIndex = (value: string): number | null => {
    const v = value.trim().toLowerCase();
    if (v.length === 1 && v >= "a" && v <= "z") return v.charCodeAt(0) - 97;
    return null;
  };

  const submitAnswer = async (answer: string): Promise<SubmitResult> => {
    if (!currentQuestion) return { ok: false, error: "No active question." };

    const trimmed = answer.trim();

    // Allow skip/empty on improvements
    const isImprovements = currentQuestion.id === "improvements";
    const isEmpty = trimmed.length === 0;
    if (isImprovements && isEmpty) {
      await saveSurveyAnswer({
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        type: currentQuestion.type,
        answer: "",
        rawInput: answer,
        skipped: true,
        timestamp: Date.now(),
      });

      advanceSurvey();
      return { ok: true };
    }

    const normalized = normalizeAnswer(currentQuestion, answer);
    if (!normalized.valid) {
      return { ok: false, error: normalized.error || "Please choose a valid option." };
    }

    await saveSurveyAnswer({
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      type: currentQuestion.type,
      answer: normalized.value,
      rawInput: answer,
      skipped: false,
      timestamp: Date.now(),
    });

    advanceSurvey();
    return { ok: true };
  };

  const advanceSurvey = () => {
    if (surveyIndex + 1 < surveyQuestions.length) {
      setSurveyIndex(surveyIndex + 1);
    } else {
      setSurveyActive(false);
    }
  };

  return {
    surveyActive,
    currentQuestion,
    startSurvey,
    submitAnswer,
  };
}
