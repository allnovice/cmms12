// /app/chat/chatTypesAndHooks.ts
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { rtdb } from "@/firebase";
import { ref as rtdbRef, onValue, push, remove } from "firebase/database";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { db as firestoreDb } from "@/firebase";

export interface Message {
  id: string;
  senderUid?: string;
  recipientUid?: string | null;
  content: string;
  timestamp: number;
  anon?: boolean;
  localHelp?: boolean;
}

export interface User {
  uid: string;
  fullname: string;
  pinColor?: string;
}

export type ChatMode = "general" | "pm" | "anon" | "survey";

// 🔹 Auth hook
export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);
  return currentUser;
};

// 🔹 Users hook
export const useUsers = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
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
  return allUsers;
};

// 🔹 Messages hook
// 🔹 Messages hook (with auto-clean)
export const useChatMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    const refMsgs = rtdbRef(rtdb, "messages");
    const refAnon = rtdbRef(rtdb, "anonmsgs");

    let firstLoad = true;

    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    const TEN_MIN = 10 * 60 * 1000;

    // 🔹 CLEAN + RETURN general/pm messages
    const handleMessages = (snap: any) => {
      const now = Date.now();
      const data = snap.val() || {};
      const list: Message[] = [];

      Object.entries(data).forEach(([id, val]: any) => {
        const ts = val.timestamp || 0;

        if (now - ts > THREE_DAYS) {
          // auto-delete old messages
          remove(rtdbRef(rtdb, `messages/${id}`));
        } else {
          list.push({
            id,
            senderUid: val.senderUid,
            recipientUid: val.recipientUid || null,
            content: val.content,
            timestamp: ts,
          });
        }
      });

      return list;
    };

    // 🔹 CLEAN + RETURN anon messages
    const handleAnon = (snap: any) => {
      const now = Date.now();
      const data = snap.val() || {};
      const list: Message[] = [];

      Object.entries(data).forEach(([id, val]: any) => {
        const ts = val.timestamp || 0;

        if (now - ts > TEN_MIN) {
          remove(rtdbRef(rtdb, `anonmsgs/${id}`));
        } else {
          list.push({
            id,
            content: val.content,
            timestamp: ts,
            anon: true,
          });
        }
      });

      return list;
    };

    // 🔹 Subscribe general/pm
    const unsubMsgs = onValue(refMsgs, (snap) => {
      const generalPM = handleMessages(snap);

      setMessages((prev) => {
        const anon = prev.filter((m) => m.anon);
        const combined = [...anon, ...generalPM].sort((a, b) => a.timestamp - b.timestamp);

        if (firstLoad) setLoadingMessages(false);
        return combined;
      });
    });

    // 🔹 Subscribe anon
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

  return { messages, loadingMessages, setMessages };
};

// 🔹 Autocomplete hook
export const useAutocomplete = (
  input: string,
  currentUser: FirebaseUser | null,
  allUsers: User[]
) => {
  const [suggestions, setSuggestions] = useState<User[]>([]);

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
  }, [input, currentUser, allUsers]);

  return suggestions;
};

// 🔹 export rtdb helpers for page.tsx
export { rtdb, rtdbRef, push, remove };
