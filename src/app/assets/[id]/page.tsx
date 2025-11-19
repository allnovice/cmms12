"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { use } from "react";

type Asset = {
  id: string;
  article?: string;
  typeOfEquipment?: string;
  description?: string;
  propertyNumber?: number;
  serialNumber?: string;
  acquisitionDate?: any;
  acquisitionValue?: number;
  assignedTo?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
};

export default function AssetDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assignedUser, setAssignedUser] = useState<string>("");

  useEffect(() => {
    const fetchAsset = async () => {
      const docRef = doc(db, "assets", id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as Asset;
        const full = { ...data, id: snap.id };
        setAsset(full);

        // Fetch assigned user name if exists
        if (full.assignedTo) {
          const userRef = doc(db, "users", full.assignedTo);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setAssignedUser(userSnap.data().fullname || "-");
          }
        }
      }
    };

    fetchAsset();
  }, [id]);

  if (!asset) return <p>Loading asset...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{asset.article || "Untitled Asset"}</h2>

      <p><strong>Type:</strong> {asset.typeOfEquipment || "-"}</p>
      <p><strong>Description:</strong> {asset.description || "-"}</p>

      <p><strong>Property Number:</strong> {asset.propertyNumber || "-"}</p>
      <p><strong>Serial Number:</strong> {asset.serialNumber || "-"}</p>

      <p>
        <strong>Acquisition Date:</strong>{" "}
        {asset.acquisitionDate
          ? new Date(asset.acquisitionDate.seconds * 1000).toLocaleString()
          : "-"}
      </p>

      <p><strong>Acquisition Value:</strong> {asset.acquisitionValue || "-"}</p>

      <p><strong>Assigned To:</strong> {assignedUser || "-"}</p>

      <p><strong>Office Location:</strong> {asset.location || "-"}</p>

      <p><strong>Latitude:</strong> {asset.latitude || "-"}</p>
      <p><strong>Longitude:</strong> {asset.longitude || "-"}</p>
    </div>
  );
}
