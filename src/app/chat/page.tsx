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
}

type ChatMode = "general" | "pm" | "anon";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true); // ✅ new state
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

  // 🔹 Users
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(firestoreDb, "users"));
      const users: User[] = snap.docs.map((doc) => ({
        uid: doc.id,
        fullname: doc.data().fullname || "",
      }));
      setAllUsers(users);
    };
    fetchUsers();
  }, []);

  // 🔹 Listen all messages (general + PM + anon)
  useEffect(() => {
    const refMsgs = rtdbRef(rtdb, "messages");
    const refAnon = rtdbRef(rtdb, "anonmsgs");

    let firstLoad = true; // ✅ track initial load

    const handleMessages = (snap: any) => {
      const data = snap.val() || {};
      const parsed: Message[] = Object.entries(data).map(([id, val]: any) => ({
        id,
        senderUid: val.senderUid,
        recipientUid: val.recipientUid || null,
        content: val.content,
        timestamp: val.timestamp || 0,
      }));
      return parsed;
    };

    const handleAnon = (snap: any) => {
      const data = snap.val() || {};
      const now = Date.now();
      const TEN_MIN = 10 * 60 * 1000;
      const parsed: Message[] = [];

      Object.entries(data).forEach(([id, val]: any) => {
        if (now - val.timestamp > TEN_MIN) {
          remove(rtdbRef(rtdb, `anonmsgs/${id}`));
        } else {
          parsed.push({ id, content: val.content, timestamp: val.timestamp, anon: true });
        }
      });
      return parsed;
    };

    const unsubMsgs = onValue(refMsgs, (snap) => {
      const generalPM = handleMessages(snap);
      setMessages((prev) => {
        const anon = prev.filter((m) => m.anon);
        const combined = [...anon, ...generalPM].sort((a, b) => a.timestamp - b.timestamp);
        if (firstLoad) setLoadingMessages(false); // ✅ done loading
        return combined;
      });
    });

    const unsubAnon = onValue(refAnon, (snap) => {
      const anon = handleAnon(snap);
      setMessages((prev) => {
        const generalPM = prev.filter((m) => !m.anon);
        const combined = [...generalPM, ...anon].sort((a, b) => a.timestamp - b.timestamp);
        if (firstLoad) setLoadingMessages(false); // ✅ done loading
        return combined;
      });
    });

    return () => {
      unsubMsgs();
      unsubAnon();
    };
  }, []);

  // 🔹 Handle URL /uid param for PM
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

  // 🔹 Autocomplete /pm
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

  const getUserName = (uid: string) => {
    const user = allUsers.find((u) => u.uid === uid);
    return user ? user.fullname.split(" ")[0] : "Unknown";
  };

  const renderPrefix = (msg: Message) => {
    if (msg.anon) return "?: ";
    if (!currentUser) return "";
    const senderName = getUserName(msg.senderUid || "");
    const recipientName = msg.recipientUid ? getUserName(msg.recipientUid) : null;

    if (msg.recipientUid) {
      if (msg.senderUid === currentUser.uid) return `${recipientName} < `;
      else if (msg.recipientUid === currentUser.uid) return `${senderName} > `;
    }

    if (msg.senderUid === currentUser.uid) return "";
    return `${senderName}: `;
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
          <p className="chat-loading">Loading messages...</p> // ✅ added loading
        ) : messages.length === 0 ? (
          <p className="chat-empty">No messages yet 👋</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.senderUid === currentUser?.uid ? "user" : "other"}`}
            >
              <strong>{renderPrefix(msg)}</strong>
              {msg.content}
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
