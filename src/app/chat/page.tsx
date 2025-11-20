"use client";

import { useState, useEffect, useRef } from "react";
import { rtdb } from "@/firebase";
import { ref as rtdbRef, push, onValue, remove } from "firebase/database";
import { collection, getDocs } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { db as firestoreDb } from "@/firebase";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import "./page.css";

interface Message {
  id: string;
  senderUid?: string;
  recipientUid?: string | null;
  content: string;
  timestamp: number;
  anon?: boolean;
}

interface User {
  uid: string;
  fullname: string;
  pinColor?: string;
}

type ChatMode = "general" | "pm" | "anon";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [input, setInput] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [pmTarget, setPmTarget] = useState<User | null>(null);
  const [mode, setMode] = useState<ChatMode>("general");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  // 🔹 Auth
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  // 🔹 Users (now includes pinColor)
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(firestoreDb, "users"));
      const users: User[] = snap.docs.map((doc) => ({
        uid: doc.id,
        fullname: doc.data().fullname || "",
        pinColor: doc.data().pinColor || "#000000",
      }));
      setAllUsers(users);
    };
    fetchUsers();
  }, []);

  // 🔹 Listen all messages
  useEffect(() => {
    const refMsgs = rtdbRef(rtdb, "messages");
    const refAnon = rtdbRef(rtdb, "anonmsgs");

    let firstLoad = true;

    const handleMessages = (snap: any) => {
      const data = snap.val() || {};
      return Object.entries(data).map(([id, val]: any) => ({
        id,
        senderUid: val.senderUid,
        recipientUid: val.recipientUid || null,
        content: val.content,
        timestamp: val.timestamp || 0,
      }));
    };

    const handleAnon = (snap: any) => {
      const data = snap.val() || {};
      const now = Date.now();
      const TEN_MIN = 10 * 60 * 1000;
      const list: Message[] = [];

      Object.entries(data).forEach(([id, val]: any) => {
        if (now - val.timestamp > TEN_MIN) {
          remove(rtdbRef(rtdb, `anonmsgs/${id}`));
        } else {
          list.push({ id, content: val.content, timestamp: val.timestamp, anon: true });
        }
      });

      return list;
    };

    const unsubMsgs = onValue(refMsgs, (snap) => {
      const generalPM = handleMessages(snap);
      setMessages((prev) => {
        const anon = prev.filter((m) => m.anon);
        const combined = [...anon, ...generalPM].sort((a, b) => a.timestamp - b.timestamp);
        if (firstLoad) setLoadingMessages(false);
        return combined;
      });
    });

    const unsubAnon = onValue(refAnon, (snap) => {
      const anon = handleAnon(snap);
      setMessages((prev) => {
        const generalPM = prev.filter((m) => !m.anon);
        const combined = [...generalPM, ...anon].sort((a, b) => a.timestamp - b.timestamp);
        if (firstLoad) setLoadingMessages(false);
        return combined;
      });
    });

    return () => {
      unsubMsgs();
      unsubAnon();
    };
  }, []);

  // 🔹 Handle ?uid= PM
  useEffect(() => {
    const uid = searchParams.get("uid");
    if (!uid || !allUsers.length) return;
    const target = allUsers.find((u) => u.uid === uid);
    if (target) {
      setPmTarget(target);
      setMode("pm");
    }
  }, [searchParams, allUsers]);

  // 🔹 Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // 🔹 Autocomplete
  useEffect(() => {
    if (input.startsWith("/pm ")) {
      const query = input.slice(4).toLowerCase();
      const filtered = allUsers
        .filter((u) => u.uid !== currentUser?.uid)
        .filter((u) => u.fullname.toLowerCase().startsWith(query));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [input, currentUser, allUsers.length]);

  const sendMessage = (recipientUid: string | null = pmTarget?.uid || null) => {
    if (!input.trim()) return;

    if (mode === "anon") {
      push(rtdbRef(rtdb, "anonmsgs"), {
        content: input,
        timestamp: Date.now(),
      });
    } else {
      if (!currentUser) return;
      push(rtdbRef(rtdb, "messages"), {
        content: input,
        senderUid: currentUser.uid,
        recipientUid,
        timestamp: Date.now(),
        ...(recipientUid ? { seen: false } : {}),
      });
    }

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    const trimmed = input.trim();

    if (trimmed === "/g") {
      setPmTarget(null);
      setMode("general");
      setInput("");
      return;
    }
    if (trimmed === "/a") {
      setPmTarget(null);
      setMode("anon");
      setInput("");
      return;
    }
    if (trimmed.startsWith("/pm ") && suggestions.length === 1) {
      setPmTarget(suggestions[0]);
      setMode("pm");
      setInput("");
      return;
    }

    sendMessage();
  };

  const getUser = (uid: string) => allUsers.find((u) => u.uid === uid);

  // 🔹 NEW — colored prefix
  const renderPrefix = (msg: Message) => {
  // Anon messages grey
  if (msg.anon) return <span style={{ color: "#888" }}>?: </span>;

  if (!currentUser) return null;

  const sender = getUser(msg.senderUid || "");
  const recipient = msg.recipientUid ? getUser(msg.recipientUid) : null;

  const senderName = sender?.fullname.split(" ")[0] || "Unknown";
  const recipientName = recipient?.fullname.split(" ")[0] || "Unknown";

  // PM messages — use pinColor, keep symbols
  if (msg.recipientUid) {
    const senderColor = sender?.pinColor || "#000";
    const recipientColor = recipient?.pinColor || "#000";

    if (msg.senderUid === currentUser.uid) {
      return <span style={{ color: recipientColor }}>{recipientName} {"< "}</span>;
    }
    if (msg.recipientUid === currentUser.uid) {
      return <span style={{ color: senderColor }}>{senderName} {" > "}</span>;
    }
  }

  // General chat — no color / prefix
  if (msg.senderUid === currentUser.uid) return null;
  return <span>{senderName}: </span>;
};
  return (
    <div className="chat-box">
      <div className="chat-header">
        {mode === "anon"
          ? "Anonymous Chat"
          : mode === "pm" && pmTarget
          ? `> ${pmTarget.fullname.split(" ")[0]}`
          : "General Chat"}
      </div>

      <div ref={containerRef} className="chat-messages">
        {loadingMessages ? (
          <p className="chat-loading">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="chat-empty">No messages yet 👋</p>
        ) : (
          messages.map((msg) => (
  <div
    key={msg.id}
    className={`chat-message ${
      msg.senderUid === currentUser?.uid ? "user" : "other"
    } ${msg.recipientUid ? "pm" : ""}`} // PM messages get 'pm' class
  >
    <strong>{renderPrefix(msg)}</strong>
    <span>{msg.content}</span>
  </div>
))
        )}
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder={
            mode === "anon"
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
                  setSuggestions([]);
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
