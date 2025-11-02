"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { FiMapPin } from "react-icons/fi";
import "./page.css";

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

type Office = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight"); // asset to highlight

  // --- Fetch assets + offices ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetSnap, officeSnap] = await Promise.all([
          getDocs(collection(db, "assets")),
          getDocs(collection(db, "locations")),
        ]);

        const assetData = assetSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Asset[];

        const officeData = officeSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Office, "id">),
        }));

        setAssets(assetData);
        setOffices(officeData);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Set office location on asset ---
  const handleSetOffice = async (assetId: string, officeId: string) => {
    const selected = offices.find((o) => o.id === officeId);
    if (!selected) return;

    setUpdating(assetId);

    try {
      const docRef = doc(db, "assets", assetId);
      await updateDoc(docRef, {
        location: selected.name,
        latitude: selected.latitude,
        longitude: selected.longitude,
      });

      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? {
                ...a,
                location: selected.name,
                latitude: selected.latitude,
                longitude: selected.longitude,
              }
            : a
        )
      );
    } catch (err) {
      console.error("Failed to update location:", err);
    } finally {
      setUpdating(null);
    }
  };

  // --- View asset on map ---
  const handleLocateAsset = (asset: Asset) => {
    if (asset.latitude && asset.longitude) {
      router.push(
        `/maps?assetId=${asset.id}&lat=${asset.latitude}&lng=${asset.longitude}&name=${encodeURIComponent(
          asset.assetName || ""
        )}`
      );
    } else {
      router.push(`/maps?assetId=${asset.id}`);
    }
  };

  if (loading) return <p className="loading-text">Loading assets...</p>;

  return (
    <div className="table-wrapper">
      <h2>Assets</h2>
      <table className="users-table">
        <thead>
          <tr>
            <th>📍</th>
            <th>Asset Name</th>
            <th>Assigned To</th>
            <th>Category</th>
            <th>Status</th>
            <th>Office Location</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr
              key={a.id}
              className={a.id === highlightId ? "highlighted" : ""}
            >
              <td className="text-center">
                <button
                  onClick={() => handleLocateAsset(a)}
                  title="Show on map"
                  className="locate-btn"
                >
                  <FiMapPin size={18} />
                </button>
              </td>
              <td>{a.assetName || "-"}</td>
              <td>{a.assignedTo || "-"}</td>
              <td>{a.category || "-"}</td>
              <td>{a.status || "-"}</td>

              {/* Office dropdown */}
              <td>
                <select
                  value={offices.find((o) => o.name === a.location)?.id || ""}
                  onChange={(e) => handleSetOffice(a.id, e.target.value)}
                  disabled={updating === a.id}
                >
                  <option value="">Select Office</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </td>

              <td>
                {updating === a.id ? (
                  <span style={{ color: "gray" }}>Saving...</span>
                ) : (
                  <span style={{ color: "green" }}>✓</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
