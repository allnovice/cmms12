"use client";

import { useState, useEffect, useRef } from "react";
import { FiSend } from "react-icons/fi";
import { rtdb } from "@/firebase";
import { ref as rtdbRef, push, onValue } from "firebase/database";
import { collection, getDocs } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { db as firestoreDb } from "@/firebase";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface Message {
  id: string;
  senderUid: string;
  recipientUid: string | null;
  content: string;
  timestamp: number;
}

interface User {
  uid: string;
  fullname: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [pmTarget, setPmTarget] = useState<User | null>(null);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  // Firebase Auth
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  // Fetch users for autocomplete
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(firestoreDb, "users"));
      const users: User[] = snap.docs.map(doc => ({
        uid: doc.id,
        fullname: doc.data().fullname || "",
      }));
      setAllUsers(users);
    };
    fetchUsers();
  }, []);

  // Listen for messages
  useEffect(() => {
    const messagesRef = rtdbRef(rtdb, "messages");
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed: Message[] = Object.entries(data).map(([id, val]: any) => ({
        id,
        senderUid: val.senderUid,
        recipientUid: val.recipientUid || null,
        content: val.content,
        timestamp: val.timestamp || 0,
      }));
      parsed.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(parsed);
    });
    return () => unsubscribe();
  }, []);

useEffect(() => {
  const uid = searchParams.get("uid");
  if (!uid || !allUsers.length) return;
  const target = allUsers.find((u) => u.uid === uid);
  if (target) setPmTarget(target);
}, [searchParams, allUsers]);

 // ✅ Mark PMs as seen when viewing that chat
useEffect(() => {
  if (!currentUser?.uid || !pmTarget?.uid) return;

  fetch(`${process.env.NEXT_PUBLIC_SERV_URL2}/pm-seen/${currentUser.uid}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderUid: pmTarget.uid }),
  }).catch((err) => console.warn("Failed to mark PMs seen:", err));
}, [pmTarget, currentUser]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Autocomplete for /pm
  useEffect(() => {
  if (input.startsWith("/pm ")) {
    const query = input.slice(4).toLowerCase();
    const filtered = allUsers
      .filter(u => u.uid !== currentUser?.uid)
      .filter(u => u.fullname.toLowerCase().startsWith(query));
    setSuggestions(filtered);
  } else {
    setSuggestions([]);
  }
}, [input, currentUser, allUsers.length]); // safer: depend on length, not whole array

  const sendMessage = (recipientUid: string | null = pmTarget?.uid || null) => {
    if (!input.trim() || !currentUser) return;

    const messagesRef = rtdbRef(rtdb, "messages");
    push(messagesRef, {
      content: input,
      senderUid: currentUser.uid,
      recipientUid: recipientUid,
      timestamp: Date.now(),
      ...(recipientUid ? { seen: false } : {}) // <-- add
    });

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // handle /g command
      if (input.trim() === "/g") {
        setPmTarget(null);
        setInput("");
        return;
      }

      // handle /pm selection if suggestion exists
      if (input.startsWith("/pm ") && suggestions.length === 1) {
        setPmTarget(suggestions[0]);
        setInput("");
        return;
      }

      sendMessage();
    }
  };

  const getSenderName = (uid: string) => {
    if (!currentUser) return "Unknown";
    if (uid === currentUser.uid) return "You";
    const user = allUsers.find(u => u.uid === uid);
    return user ? user.fullname.split(" ")[0] : "Unknown";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "400px", border: "1px solid #ddd", borderRadius: "8px", padding: "12px" }}>
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
        {pmTarget ? `Private chat with ${pmTarget.fullname.split(" ")[0]}` : "General Chat"}
      </div>

      {/* Messages container */}
      <div ref={containerRef} style={{ flex: 1, overflowY: "auto", padding: "8px", background: "#fafafa", borderRadius: "6px" }}>
        {messages.length === 0 && <p style={{ textAlign: "center", color: "#888" }}>No messages yet 👋</p>}
        {messages
          .filter(msg => msg.recipientUid === null || msg.senderUid === currentUser?.uid || msg.recipientUid === currentUser?.uid)
          .map(msg => {
            const isPm = msg.recipientUid !== null;
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.senderUid === currentUser?.uid ? "flex-end" : "flex-start",
                  background: isPm ? "#ffe4b5" : "#e1e1e1",
                  color: "#000",
                  padding: "6px 10px",
                  borderRadius: "12px",
                  marginBottom: "6px",
                  maxWidth: "70%",
                  wordBreak: "break-word"
                }}
              >
                <strong>{getSenderName(msg.senderUid)}{isPm ? " (PM)" : ""}:</strong> {msg.content}
              </div>
            );
          })}
      </div>

      {/* Input area */}
      <div style={{ display: "flex", gap: "6px", marginTop: "8px", position: "relative" }}>
        <input
          type="text"
          placeholder={pmTarget ? `Message ${pmTarget.fullname.split(" ")[0]}` : "Type a message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          style={{ flex: 1, padding: "6px 10px", borderRadius: "12px", border: "1px solid #ccc", outline: "none" }}
        />
        <button onClick={() => sendMessage()} style={{ background: "#0070f3", color: "#fff", border: "none", borderRadius: "12px", padding: "0 12px", cursor: "pointer" }}>
          <FiSend size={18} />
        </button>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "36px", left: 0, background: "#fff", border: "1px solid #ccc", borderRadius: "6px", width: "100%", zIndex: 100 }}>
            {suggestions.map(s => (
              <div
                key={s.uid}
                style={{ padding: "4px 8px", cursor: "pointer" }}
                onClick={() => { setPmTarget(s); setInput(""); setSuggestions([]); }}
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
