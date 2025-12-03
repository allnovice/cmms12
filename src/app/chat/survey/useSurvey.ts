import { useState } from "react";
import { surveyQuestions } from "./surveyConfig";
import { saveSurveyAnswer } from "./saveSurveyAnswer";

export default function useSurvey() {
  const [surveyIndex, setSurveyIndex] = useState(0);
  const [surveyActive, setSurveyActive] = useState(false);

  const startSurvey = () => {
    setSurveyIndex(0);
    setSurveyActive(true);
  };

  const currentQuestion = surveyQuestions[surveyIndex];

  const submitAnswer = async (answer: string) => {
    await saveSurveyAnswer({
      question: currentQuestion,
      answer,
      timestamp: Date.now(),
    });

    if (surveyIndex + 1 < surveyQuestions.length) {
      setSurveyIndex(surveyIndex + 1);
    } else {
      setSurveyActive(false); // done
    }
  };

  return {
    surveyActive,
    currentQuestion,
    startSurvey,
    submitAnswer,
  };
}
