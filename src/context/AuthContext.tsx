"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext<any>(null);
export const useAuth = () => useContext(AuthContext);

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", currentUser.uid);

      // 🔥 REAL-TIME listener for user profile updates
      const unsubUser = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            ...snap.data(),
          });
        } else {
          // fallback: minimal auth user
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
          });
        }

        setLoading(false);
      });

      return () => unsubUser();
    });

    return () => unsubAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
