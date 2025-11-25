"use client";

import { useEffect, useState } from "react";

interface Asset {
  uid: string;
  createdAt: string; // ISO string
  name?: string; // optional, you can add more fields
}

export default function LatestAsset() {
  const [latest, setLatest] = useState<Asset | null>(null);

  useEffect(() => {
    const fetchLatestAsset = async () => {
      try {
        const res = await fetch("/api/assets?sort=desc&limit=1"); // adjust your API
        const data: Asset[] = await res.json();
        if (data.length) setLatest(data[0]);
      } catch (err) {
        console.error("Failed to fetch latest asset:", err);
      }
    };

    fetchLatestAsset();
  }, []);

  if (!latest) return <div>Loading latest asset...</div>;

  return (
    <div className="latest-asset">
      <strong>Latest Asset:</strong> {latest.uid} <br />
      <small>Created At: {new Date(latest.createdAt).toLocaleString()}</small>
    </div>
  );
}
