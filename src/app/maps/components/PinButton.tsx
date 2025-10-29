"use client";

import { useState } from "react";
import { auth, db } from "@/firebase";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { UserPin } from "./types";

interface Props {
  userPin: UserPin | null;
  onUpdate: (pin: UserPin) => void;
}

export default function PinButton({ userPin, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePin = () => {
    if (!auth.currentUser) return alert("Not logged in");

    const now = Date.now();
    if (userPin) {
      const diff = now - userPin.timestamp;
      if (diff < 30 * 60 * 1000) {
        const minsLeft = Math.ceil((30 * 60 * 1000 - diff) / 60000);
        return alert(`You can pin again in ${minsLeft} minutes`);
      }
    }

    if (!navigator.geolocation) return alert("Geolocation not supported");

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        try {
          const pinData = { uid: auth.currentUser!.uid, latitude, longitude, timestamp: serverTimestamp() };
          await setDoc(doc(db, "userPins", auth.currentUser!.uid), pinData);
          await setDoc(doc(collection(db, "allUsersPins")), pinData);
          onUpdate({ ...pinData, timestamp: Date.now() });
          alert("Your location has been pinned!");
        } catch (err) {
          console.error(err);
          alert("Failed to pin location");
        } finally {
          setLoading(false);
        }
      },
      err => {
        console.error(err);
        alert("Failed to get location");
        setLoading(false);
      }
    );
  };

  return (
    <div style={{ marginTop: 10, textAlign: "center" }}>
      <button onClick={handlePin} disabled={loading}>
        {loading ? "Pinning..." : "Pin My Location"}
      </button>
    </div>
  );
}
