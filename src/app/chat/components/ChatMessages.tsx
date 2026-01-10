"use client";

import React, { useEffect } from "react";
import { Message, User } from "../chatTypesAndHooks";

interface ChatMessagesProps {
  messages: Message[];
  currentUser: User | null;
  allUsers: User[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  loadingMessages: boolean;
}

export default function ChatMessages({
  messages,
  currentUser,
  allUsers,
  containerRef,
  loadingMessages,
}: ChatMessagesProps) {

  const getUser = (uid: string) => allUsers.find((u) => u.uid === uid);

  // ---------------------------------------------------------
  // Username + Arrow rules
  // ---------------------------------------------------------
  const getUsernameAndArrow = (msg: Message) => {
    if (msg.localHelp) return { username: null, arrow: null, color: "#000", prefixLeft: false };

    if (!currentUser) return { username: null, arrow: null, color: "#000", prefixLeft: false };

    const sender = getUser(msg.senderUid || "");
    const recipient = msg.recipientUid ? getUser(msg.recipientUid) : null;

    const senderName = sender?.fullname.split(" ")[0] || "Unknown";
    const recipientName = recipient?.fullname.split(" ")[0] || "Unknown";

    // ----- Anonymous general message -----
    if (msg.anon) {
      return { username: "?", arrow: ":", color: "#888", prefixLeft: true };
    }

    // ----- PMs (KEEP AS-IS) -----
    if (msg.recipientUid) {
      if (msg.senderUid === currentUser.uid) {
        // Your outgoing PM
        return {
          username: recipientName,
          arrow: ">",
          color: recipient?.pinColor || "#000",
          prefixLeft: false, // stays on RIGHT (PM behavior)
        };
      }
      if (msg.recipientUid === currentUser.uid) {
        // Incoming PM
        return {
          username: senderName,
          arrow: "<",
          color: sender?.pinColor || "#000",
          prefixLeft: false, // stays on RIGHT (PM behavior)
        };
      }
    }

    // ----- General messages from other users -----
    if (msg.senderUid !== currentUser.uid) {
      return {
        username: senderName,
        arrow: ":",
        color: sender?.pinColor || "#000",
        prefixLeft: true, // FIX: prefix on LEFT
      };
    }

    // ----- Your own general messages (no prefix) -----
    return { username: null, arrow: null, color: "#000", prefixLeft: false };
  };

  // ---------------------------------------------------------
  // Auto-scroll to bottom
  // ---------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <div ref={containerRef} className="chat-messages">
      {loadingMessages ? (
        <p className="chat-loading">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="chat-empty">No messages yet 👋</p>
      ) : (
        messages.map((msg) => {
          const { username, arrow, color, prefixLeft } = getUsernameAndArrow(msg);
          const isSystemHelp = msg.senderUid === "system-help" || msg.localHelp;

          return (
            <div
              key={msg.id}
              className={`chat-message ${
                msg.senderUid === currentUser?.uid ? "user" : "other"
              } ${msg.recipientUid ? "pm" : ""}`}
            >
              <div className="chat-message-flex">

                {/* --------------- PREFIX LEFT (General + Anon) --------------- */}
                {prefixLeft && username && arrow && (
                  <span className="chat-message-prefix" style={{ color }}>
                    {username}{arrow}&nbsp;
                  </span>
                )}

                {/* ------------------------- MESSAGE TEXT ---------------------- */}
                <span className="chat-message-content">
                  {isSystemHelp
                    ? msg.content.split("\n").map((line, i) => <div key={i}>{line}</div>)
                    : msg.content}
                </span>

                {/* --------------- PREFIX RIGHT (PMs) --------------- */}
                {!prefixLeft && username && arrow && !isSystemHelp && (
                  <>
                    <span className="chat-message-arrow">{arrow}</span>
                    <span className="chat-message-user" style={{ color }}>
                      {username}
                    </span>
                  </>
                )}

              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
