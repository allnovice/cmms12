// /app/chat/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessages from "./components/ChatMessages";
import {
  useAuth,
  useUsers,
  useChatMessages,
  useAutocomplete,
  User,
  rtdb,
  rtdbRef,
  push,
} from "./chatTypesAndHooks";
import { get } from "firebase/database";
import { useSearchParams } from "next/navigation";
import "./page.css";
import useSurvey from "./survey/useSurvey";
import { helpText } from "./helpConfig";
import ChatNotes from "./components/ChatNotes";

export default function ChatPage() {
  const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const currentUserFirebase = useAuth();
  const allUsers = useUsers();
  const { messages, loadingMessages, setMessages } = useChatMessages();

  const [input, setInput] = useState("");
  const [pmTarget, setPmTarget] = useState<User | null>(null);
  const [mode, setMode] = useState("general");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();

  const suggestions = useAutocomplete(input, currentUserFirebase, allUsers);
  const currentUser =
    allUsers.find((u) => u.uid === currentUserFirebase?.uid) || null;

  const { surveyActive, currentQuestion, startSurvey, submitAnswer } = useSurvey();

  // 🔹 Handle ?uid= PM
  useEffect(() => {
    const uid = searchParams.get("uid");
    if (!uid || pmTarget || !allUsers.length) return;

    const target = allUsers.find((u) => u.uid === uid);
    if (target) {
      setPmTarget(target);
      setMode("pm");
    }
  }, [searchParams, pmTarget, allUsers]);

  // 🔹 SEND MESSAGE HANDLER
  const sendMessage = async (recipientUid: string | null = pmTarget?.uid || null) => {
    const trimmed = input.trim();
    const allowEmptySurveySkip = surveyActive && currentQuestion?.id === "improvements" && trimmed.length === 0;
    if (!trimmed && !allowEmptySurveySkip) return;

    // Survey mode
    if (surveyActive) {
      const result = await submitAnswer(input);
      if (!result.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: "survey-error-" + Date.now(),
            content: result.error,
            timestamp: Date.now(),
            senderUid: "system-survey",
            localHelp: true,
          },
        ]);
        return;
      }

      setInput("");
      return;
    }

    // Anonymous mode
    if (mode === "anon") {
      push(rtdbRef(rtdb, "anonmsgs"), {
        content: input,
        timestamp: Date.now(),
      });
    } else {
      if (!currentUserFirebase) return;

      push(rtdbRef(rtdb, "messages"), {
        content: input,
        senderUid: currentUserFirebase.uid,
        recipientUid,
        timestamp: Date.now(),
        ...(recipientUid ? { seen: false } : {}),
      });
    }

    setInput("");
  };

  const renderSurveyHelper = () => {
    if (!surveyActive || !currentQuestion) return null;

    if (currentQuestion.type === "single-choice" || currentQuestion.type === "multi-choice") {
      return (
        <div className="survey-helper">
          <div className="survey-helper__label">
            {currentQuestion.type === "single-choice" ? "Choose one (a/b/c...)" : "Choose one or more (a,b,...)"}
          </div>
          <div className="survey-helper__options">
            {currentQuestion.options.map((opt, idx) => {
              const letter = String.fromCharCode(97 + idx);
              return (
                <span key={opt} className="survey-helper__option">{`(${letter}) ${opt}`}</span>
              );
            })}
          </div>
        </div>
      );
    }

    if (currentQuestion.type === "scale") {
      return (
        <div className="survey-helper">
          <div className="survey-helper__label">Enter a number {currentQuestion.scale.min}-{currentQuestion.scale.max}</div>
          {currentQuestion.scale.labels && (
            <div className="survey-helper__options">
              {Object.entries(currentQuestion.scale.labels).map(([k, v]) => (
                <span key={k} className="survey-helper__option">{`${k}: ${v}`}</span>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const exportSurveyAnswers = async () => {
    try {
      const snap = await get(rtdbRef(rtdb, "survey/answers"));
      const data = snap.val();

      if (!data) {
        setMessages((prev) => [
          ...prev,
          {
            id: "survey-export-empty-" + Date.now(),
            content: "No survey answers to export yet.",
            timestamp: Date.now(),
            senderUid: "system-survey",
            localHelp: true,
          },
        ]);
        return;
      }

      const rows = Object.entries<any>(data)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      const headers = ["id", "timestamp", "questionId", "question", "type", "answer", "rawInput", "skipped"];
      const serialize = (val: any) => {
        if (Array.isArray(val)) return val.join("; ");
        if (typeof val === "object" && val !== null) return JSON.stringify(val);
        return val === undefined || val === null ? "" : String(val);
      };
      const csvEscape = (val: any) => {
        const s = serialize(val);
        if (/[",\n]/.test(s)) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };

      const csv = [
        headers.join(","),
        ...rows.map((r) =>
          [
            r.id,
            r.timestamp ? new Date(r.timestamp).toISOString() : "",
            r.questionId,
            r.question,
            r.type,
            r.answer,
            r.rawInput,
            r.skipped,
          ]
            .map(csvEscape)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `survey-answers-${Date.now()}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setMessages((prev) => [
        ...prev,
        {
          id: "survey-export-done-" + Date.now(),
          content: `Exported ${rows.length} survey answers to CSV (download started).`,
          timestamp: Date.now(),
          senderUid: "system-survey",
          localHelp: true,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: "survey-export-error-" + Date.now(),
          content: `Survey export failed: ${err?.message || err}`,
          timestamp: Date.now(),
          senderUid: "system-survey",
          localHelp: true,
        },
      ]);
    }
  };

  // 🔹 KEY PRESS HANDLER
  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const trimmed = input.trim();

    // /help
    if (trimmed === "/help") {
      // remove old help
      setMessages((prev) => prev.filter((m) => !m.localHelp));

      // add new help
      setMessages((prev) => [
        ...prev,
        {
          id: "help-" + Date.now(),
          content: "Available Commands:\n" + helpText,
          timestamp: Date.now(),
          senderUid: "system-help",
          localHelp: true,
        },
      ]);

      setInput("");
      return;
    }

    // /survey
    if (trimmed === "/survey") {
      startSurvey();
      setInput("");
      return;
    }

    // /survey-export
    if (trimmed === "/survey-export") {
      const isAdmin = currentUserFirebase && ADMIN_UIDS.includes(currentUserFirebase.uid);
      if (!isAdmin) {
        setMessages((prev) => [
          ...prev,
          {
            id: "survey-export-deny-" + Date.now(),
            content: "Survey export is restricted to admins.",
            timestamp: Date.now(),
            senderUid: "system-survey",
            localHelp: true,
          },
        ]);
        setInput("");
        return;
      }

      await exportSurveyAnswers();
      setInput("");
      return;
    }

    // /g (general)
    if (trimmed === "/g") {
      setPmTarget(null);
      setMode("general");
      setInput("");
      return;
    }

    // /a (anon)
    if (trimmed === "/a") {
      setPmTarget(null);
      setMode("anon");
      setInput("");
      return;
    }

    // /pm <user>
    if (trimmed.startsWith("/pm ") && suggestions.length === 1) {
      setPmTarget(suggestions[0]);
      setMode("pm");
      setInput("");
      return;
    }

    // Normal send
    await sendMessage();
  };

  return (
  <div className="chat-box">   {/* FIXED HEIGHT WRAPPER */}
    <div className="chat-header">
      {surveyActive
        ? "Survey Mode"
        : mode === "anon"
        ? "Anonymous Chat"
        : mode === "pm" && pmTarget
        ? `> ${pmTarget.fullname.split(" ")[0]}`
        : "General Chat"}
    </div>

    <ChatMessages
      messages={messages}
      currentUser={currentUser}
      allUsers={allUsers}
      containerRef={containerRef}
      loadingMessages={loadingMessages}
    />

    <div className="chat-input-area">
      <input
        type="text"
        className="chat-input"
        placeholder={
          surveyActive && currentQuestion
            ? currentQuestion.question
            : mode === "anon"
            ? "Send anonymous message..."
            : pmTarget
            ? `Message ${pmTarget.fullname.split(" ")[0]}`
            : "Type a message..."
        }
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
      />

      {suggestions.length > 0 && (
        <div className="chat-suggestions">
          {suggestions.map((s) => (
            <div
              key={s.uid}
              className="chat-suggestion-item"
              onClick={() => {
                setPmTarget(s);
                setMode("pm");
                setInput("");
              }}
            >
              {s.fullname}
            </div>
          ))}
        </div>
      )}
    </div>
    {renderSurveyHelper()}

    <ChatNotes />
  </div>

);
}
