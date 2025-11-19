"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { FiMapPin } from "react-icons/fi";
import "./page.css";

type Asset = {
  id: string;
  article?: string;
  typeOfEquipment?: string;
  acquisitionDate?: any;
  acquisitionValue?: number;
  createdAt?: any;
  description?: string;
  propertyNumber?: number;
  serialNumber?: string;
  assignedTo?: string; // uid
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

type User = {
  uid: string;
  fullname: string;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  // --- Fetch assets + offices + users ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetSnap, officeSnap, userSnap] = await Promise.all([
          getDocs(collection(db, "assets")),
          getDocs(collection(db, "locations")),
          getDocs(collection(db, "users")),
        ]);

        const assetData = assetSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Asset[];

        const officeData = officeSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Office, "id">),
        }));

        const userData = userSnap.docs.map((d) => ({
          uid: d.id,
          fullname: d.data().fullname || "Unnamed",
        })) as User[];

        setAssets(assetData);
        setOffices(officeData);
        setUsers(userData);
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

  // --- Update assigned user ---
  const handleAssignUser = async (assetId: string, uid: string) => {
    setUpdating(assetId);

    try {
      const docRef = doc(db, "assets", assetId);
      await updateDoc(docRef, { assignedTo: uid });

      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId ? { ...a, assignedTo: uid } : a
        )
      );
    } catch (err) {
      console.error("Failed to assign user:", err);
    } finally {
      setUpdating(null);
    }
  };

  // --- View asset on map ---
  const handleLocateAsset = (asset: Asset) => {
    if (asset.latitude && asset.longitude) {
      router.push(
        `/maps?assetId=${asset.id}&lat=${asset.latitude}&lng=${asset.longitude}&name=${encodeURIComponent(
          asset.article || ""
        )}`
      );
    } else {
      router.push(`/maps?assetId=${asset.id}`);
    }
  };

  if (loading) return <p className="loading-text">Loading assets...</p>;

  return (
    <div className="table-wrapper">
      <table className="users-table">
        <thead>
          <tr>
            <th>📍</th>
            <th>Article</th>
            <th>Type</th>
            <th>Description</th>
            <th>Property #</th>
            <th>Serial #</th>
            <th>Acq. Date</th>
            <th>Acq. Value</th>
            <th>Assigned To</th>
            <th>Office</th>
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

              <td>{a.article || "-"}</td>
              <td>{a.typeOfEquipment || "-"}</td>
              <td>{a.description || "-"}</td>
              <td>{a.propertyNumber || "-"}</td>
              <td>{a.serialNumber || "-"}</td>

              <td>
                {a.acquisitionDate
                  ? new Date(a.acquisitionDate.seconds * 1000).toLocaleDateString()
                  : "-"}
              </td>

              <td>{a.acquisitionValue || "-"}</td>

              {/* --- User Dropdown --- */}
              <td>
                <select
                  value={a.assignedTo || ""}
                  onChange={(e) => handleAssignUser(a.id, e.target.value)}
                  disabled={updating === a.id}
                >
                  <option value="">Select User</option>
                  {users.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.fullname}
                    </option>
                  ))}
                </select>
              </td>

              {/* --- Office Dropdown --- */}
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
