"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { Timestamp } from "firebase/firestore";

import "./LatestUser.css";

interface User {
  uid: string;
  fullname?: string;
  designation?: string;
  division?: string;
  email?: string;
  createdAt: Timestamp;
}

export default function LatestUser() {
  const [latest, setLatest] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const ref = collection(db, "users");

        const q = query(ref, orderBy("createdAt", "desc"), limit(1));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const doc = snap.docs[0];
          setLatest({
            uid: doc.id,
            ...(doc.data() as any),
          });
        }
      } catch (err) {
        console.error("Error fetching latest user:", err);
      }
    };

    fetchUser();
  }, []);

  if (!latest) return <div>Loading latest user...</div>;

  return (
    <div className="latest-user-card">
      <div className="user-header">
        Latest Registered User
      </div>

      <div className="user-field"><strong>Name:</strong> {latest.fullname}</div>
      <div className="user-field"><strong>Designation:</strong> {latest.designation}</div>
      <div className="user-field"><strong>Division:</strong> {latest.division}</div>
      <div className="user-field"><strong>Email:</strong> {latest.email}</div>

      <small className="user-created">
        Added: {latest.createdAt.toDate().toLocaleString()}
      </small>
    </div>
  );
}
