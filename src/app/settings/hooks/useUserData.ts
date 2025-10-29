"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export type UserData = {
  email: string;
  fullname: string;
  designation: string;
  signature?: string;
  address?: string;
  contact?: string;
  employeeNumber?: string;
  division?: string;
};

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const docRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setUserData(snap.data() as UserData);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const updateUserData = async (updates: Partial<UserData>) => {
    if (!auth.currentUser) return;
    const docRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(docRef, updates);
    setUserData((prev) => ({ ...prev!, ...updates }));
  };

  return { userData, setUserData, updateUserData, loading };
}
