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
import { useSearchParams } from "next/navigation";
import "./page.css";
import useSurvey from "./survey/useSurvey";
import { helpText } from "./helpConfig";

export default function ChatPage() {
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

  const {
    surveyActive,
    currentQuestion,
    startSurvey,
    submitAnswer,
  } = useSurvey();

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
    if (!input.trim()) return;

    // Survey mode
    if (surveyActive) {
      await submitAnswer(input);
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
          surveyActive
            ? currentQuestion
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
  </div>
);
}
