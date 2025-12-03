import React, { useEffect } from "react"; // add useEffect here
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

  const getUsernameAndArrow = (msg: Message) => {
    if (!currentUser) return { username: null, arrow: null, color: "#000" };
    const sender = getUser(msg.senderUid || "");
    const recipient = msg.recipientUid ? getUser(msg.recipientUid) : null;

    const senderName = sender?.fullname.split(" ")[0] || "Unknown";
    const recipientName = recipient?.fullname.split(" ")[0] || "Unknown";

    if (msg.anon) return { username: "?", arrow: ":", color: "#888" };

    if (msg.recipientUid) {
      if (msg.senderUid === currentUser.uid) {
        return { username: recipientName, arrow: ">", color: recipient?.pinColor || "#000" };
      }
      if (msg.recipientUid === currentUser.uid) {
        return { username: senderName, arrow: "<", color: sender?.pinColor || "#000" };
      }
    }

    if (msg.senderUid !== currentUser.uid) {
      return { username: senderName, arrow: ":", color: sender?.pinColor || "#000" };
    }

    return { username: null, arrow: null, color: "#000" };
  };

  // 🔹 Auto-scroll effect
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  return (
    <div ref={containerRef} className="chat-messages">
      {loadingMessages ? (
        <p className="chat-loading">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="chat-empty">No messages yet 👋</p>
      ) : (
        messages.map((msg) => {
          const { username, arrow, color } = getUsernameAndArrow(msg);
          const isSystemHelp = msg.senderUid === "system-help";

          return (
            <div
              key={msg.id}
              className={`chat-message ${
                msg.senderUid === currentUser?.uid ? "user" : "other"
              } ${msg.recipientUid ? "pm" : ""}`}
            >
              <div className="chat-message-flex">
                <span className="chat-message-content">
                  {isSystemHelp
                    ? msg.content.split("\n").map((line, i) => <div key={i}>{line}</div>)
                    : msg.content}
                </span>

                {!isSystemHelp && username && arrow && (
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
