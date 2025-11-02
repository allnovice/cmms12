"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { use } from "react";

type Asset = {
  id: string;
  assetName?: string;
  assignedTo?: string;
  category?: string;
  status?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
};

export default function AssetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // ✅ unwrap the promise
  const [asset, setAsset] = useState<Asset | null>(null);

  useEffect(() => {
  const fetchAsset = async () => {
    const docRef = doc(db, "assets", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Asset;
      setAsset({ ...data, id: snap.id }); // doc.id takes precedence
    }
  };
  fetchAsset();
}, [id]);

  if (!asset) return <p>Loading asset...</p>;

  return (
    <div>
      <h2>{asset.assetName}</h2>
      <p>Category: {asset.category}</p>
      <p>Location: {asset.location}</p>
      <p>Latitude: {asset.latitude}</p>
      <p>Longitude: {asset.longitude}</p>
      <p>Assigned to: {asset.assignedTo}</p>
      <p>Status: {asset.status}</p>
    </div>
  );
}
