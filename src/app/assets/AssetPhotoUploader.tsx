"use client";

import { useState } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/firebase";

interface AssetPhotoUploaderProps {
  assetId: string;
  onUploaded: (url: string) => void;
}

export default function AssetPhotoUploader({ assetId, onUploaded }: AssetPhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg"].includes(file.type)) {
      alert("Only JPG or JPEG files are allowed.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetId", assetId);

      // include auth token (required for server-side admin check)
      const token = await (await import("@/firebase")).auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/uploadAsset", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      const url = data.secure_url; // <-- important

      // Save to array
      const docRef = doc(db, "assets", assetId);
      await updateDoc(docRef, {
        photoUrls: arrayUnion(url),
      });

      onUploaded(url);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="upload-btn">
      {uploading ? "Uploading..." : "📸 Add Photo"}
      <input type="file" accept="image/jpeg,image/jpg" hidden onChange={handlePick} />
    </label>
  );
}
