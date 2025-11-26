"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { Timestamp } from "firebase/firestore";

interface Asset {
  uid: string;
  createdAt: Timestamp;
  article?: string;
  description?: string;
}

export default function LatestAsset() {
  const [latest, setLatest] = useState<Asset | null>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const ref = collection(db, "assets");

        // Sort by Firestore Timestamp (desc) → newest first
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
        console.error("Error fetching latest asset:", err);
      }
    };

    fetchLatest();
  }, []);

  if (!latest) return <div>Loading latest asset...</div>;

  return (
    <div className="latest-asset">
      <strong>Latest Asset:</strong> {latest.uid} <br />

      <small>
        Created At:{" "}
        {latest.createdAt.toDate().toLocaleString()}
      </small>

      {latest.article && (
        <div>
          <small>Article: {latest.article}</small>
        </div>
      )}

      {latest.description && (
        <div>
          <small>Description: {latest.description}</small>
        </div>
      )}
    </div>
  );
}
