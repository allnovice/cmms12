import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export function useUserData() {
  const [userData, setUserData] = useState<{ signature?: string; signatoryLevel?: number } | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchUserData = async () => {
      const ref = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setUserData(snap.data() as any);
    };
    fetchUserData();
  }, [auth.currentUser]);

  return userData;
}
