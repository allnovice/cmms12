"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { Timestamp } from "firebase/firestore";

import "./LatestAsset.css"; // <--- CSS here

interface Asset {
  uid: string;
  createdAt: Timestamp;
  article?: string;
  description?: string;
  photoUrls?: string[];
}

export default function LatestAsset() {
  const [latest, setLatest] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const ref = collection(db, "assets");
        const q = query(ref, orderBy("createdAt", "desc"), limit(5));

        const snap = await getDocs(q);

        const items: Asset[] = snap.docs.map((doc) => ({
          uid: doc.id,
          ...(doc.data() as any),
        }));

        setLatest(items);
      } catch (err) {
        console.error("Error fetching latest assets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
  }, []);

  if (loading) return <div>Loading latest assets...</div>;

  return (
    <div className="latest-assets-container">
      <h3 className="title">Latest 5 Assets</h3>

      {/* Horizontal swipe area */}
      <div className="assets-scroll">
        {latest.map((asset) => (
          <div key={asset.uid} className="asset-card">
            <div className="asset-header">{asset.uid}</div>

            <div className="asset-meta">
              <small>
                Created: {asset.createdAt?.toDate().toLocaleString()}
              </small>
              {asset.article && <small>Article: {asset.article}</small>}
              {asset.description && (
                <small>Description: {asset.description}</small>
              )}
            </div>

            {/* Photos (static inside asset) */}
         {Array.isArray(asset.photoUrls) && asset.photoUrls.length > 0 && (
  <div className="photo-grid">
    {asset.photoUrls.map((url, i) => (
      <img key={i} src={url} alt="asset" className="photo" />
    ))}
  </div>
)}
          </div>
        ))}
      </div>
    </div>
  );
}
