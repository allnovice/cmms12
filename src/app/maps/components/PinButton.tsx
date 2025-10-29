"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function PinButton({ onUpdate }: { onUpdate: (lat: number, lng: number) => void }) {
  const [loading, setLoading] = useState(false);
  const [lastPinTime, setLastPinTime] = useState<number>(0);

  useEffect(() => {
    const fetchPin = async () => {
      if (!auth.currentUser) return;
      const snap = await getDoc(doc(db, "userPins", auth.currentUser.uid));
      if (snap.exists()) setLastPinTime(snap.data().timestamp?.toMillis() || 0);
    };
    fetchPin();
  }, []);

  const handlePin = () => {
    if (!auth.currentUser) return alert("Not logged in");

    const now = Date.now();
    if (lastPinTime && now - lastPinTime < 30 * 60 * 1000) {
      const mins = Math.ceil((30 * 60 * 1000 - (now - lastPinTime)) / 60000);
      return alert(`You can pin again in ${mins} minutes`);
    }

    if (!navigator.geolocation) return alert("Geolocation not supported");
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        try {
          await setDoc(doc(db, "userPins", auth.currentUser!.uid), {
            uid: auth.currentUser!.uid,
            latitude,
            longitude,
            timestamp: serverTimestamp(),
          });
          setLastPinTime(Date.now());
          onUpdate(latitude, longitude);
          alert("Location pinned!");
        } catch (err) {
          console.error(err);
          alert("Failed to pin location");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        alert("Failed to get location");
        setLoading(false);
      }
    );
  };

  return (
    <div style={{ textAlign: "center", marginTop: 10 }}>
      <button onClick={handlePin} disabled={loading}>
        {loading ? "Pinning..." : "Pin My Location"}
      </button>
    </div>
  );
}
