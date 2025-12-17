"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { use } from "react";
import { useRouter } from "next/navigation";
import AssetPhotoUploader from "../AssetPhotoUploader";

// Extract public_id from Cloudinary URL for deletion
function extractPublicId(url: string) {
  const afterUpload = url.split("/upload/")[1]; // v12345/settings/asset_xxx.jpg
  const parts = afterUpload.split("/"); 
  parts.shift(); // remove version (v12345)
  return parts.join("/").replace(/\.[^/.]+$/, ""); // keeps folder, removes extension
}

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
  photoUrls?: string[];
  [key: string]: any;
};

import { useAuth } from "@/context/AuthContext";

export default function AssetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assignedUser, setAssignedUser] = useState("");

  useEffect(() => {
    const fetchAsset = async () => {
      const docRef = doc(db, "assets", id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as Asset;
        const full = { ...data, id: snap.id };
        setAsset(full);

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

  // DELETE PHOTO FUNCTION
  const handleDeletePhoto = async (url: string) => {
    if (!isAdmin) {
      alert("Admin only: you are not allowed to delete photos.");
      return;
    }

    if (!confirm("Delete this photo?")) return;

    const public_id = extractPublicId(url);

    try {
      const token = await (await import("@/firebase")).auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/deleteAssetPhoto", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ public_id }),
      });
      const data = await res.json();
      if (data.result !== "ok") {
        alert("Failed to delete from Cloudinary");
        return;
      }

      await updateDoc(doc(db, "assets", asset.id), {
        photoUrls: arrayRemove(url),
      });

      setAsset((prev) =>
        prev
          ? { ...prev, photoUrls: prev.photoUrls?.filter((p) => p !== url) }
          : prev
      );
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert("Delete failed: " + err.message);
    }
  };

  // DELETE ASSET FUNCTION
  const handleDeleteAsset = async () => {
    if (!isAdmin) {
      alert("Admin only: you are not allowed to delete assets.");
      return;
    }

    if (asset?.photoUrls && asset.photoUrls.length > 0) {
      alert("Cannot delete asset with photos. Delete photos first.");
      return;
    }

    if (!confirm("Delete this asset?")) return;

    try {
      await deleteDoc(doc(db, "assets", asset.id));
      alert("Asset deleted successfully");
      router.push("/assets"); // redirect to main assets page
    } catch (err: any) {
      console.error("Failed to delete asset:", err);
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px", position: "relative" }}>
      {/* DELETE ASSET BUTTON TOP RIGHT */}
      {isAdmin ? (
        <button
          onClick={handleDeleteAsset}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "red",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Delete Asset
        </button>
      ) : (
        <div style={{ position: "absolute", top: 20, right: 20, color: "#777" }}>Admin only</div>
      )}

      {/* Photo Gallery */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Photos</h3>

        {asset.photoUrls && asset.photoUrls.length > 0 ? (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {asset.photoUrls.map((url, index) => (
              <div key={index} style={{ position: "relative" }}>
                <img
                  src={url}
                  alt="Asset"
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    border: "1px solid #ccc",
                  }}
                />
                {isAdmin ? (
                  <button
                    onClick={() => handleDeletePhoto(url)}
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      background: "red",
                      color: "white",
                      border: "none",
                      padding: "5px 8px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p>No photos uploaded.</p>
        )}

        {isAdmin ? (
          <AssetPhotoUploader
            assetId={asset.id}
            onUploaded={(url) =>
              setAsset((prev) =>
                prev ? { ...prev, photoUrls: [...(prev.photoUrls || []), url] } : prev
              )
            }
          />
        ) : (
          <p style={{ color: "#777" }}>Only admins can upload photos.</p>
        )}
      </div>

      {/* Asset Details */}
      <p><strong>Type:</strong> {asset.typeOfEquipment || "-"}</p>
      <p><strong>Description:</strong> {asset.description || "-"}</p>
      <p><strong>Property Number:</strong> {asset.propertyNumber || "-"}</p>
      <p><strong>Serial Number:</strong> {asset.serialNumber || "-"}</p>
      <p>
        <strong>Acquisition Date:</strong>{" "}
        {asset.acquisitionDate
          ? new Date(asset.acquisitionDate.seconds * 1000).toLocaleDateString()
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
