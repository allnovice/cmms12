"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { Timestamp } from "firebase/firestore";

import "./LatestAsset.css"; // <--- CSS here
import UserModal from "../components/UserModal";

interface Asset {
  uid: string;
  createdAt: Timestamp;
  article?: string;
  description?: string;
  typeOfEquipment?: string;
  assignedTo?: string;
  photoUrls?: string[];
}

export default function LatestAsset() {
  const [latest, setLatest] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const router = useRouter();

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

        // fetch assigned user names for display
        const uids = Array.from(new Set(items.map((a) => a.assignedTo).filter((x): x is string => !!x)));
        const names: Record<string, string> = {};
        await Promise.all(
          uids.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "users", uid));
              if (snap.exists()) names[uid] = (snap.data() as any).fullname || uid;
              else names[uid] = uid;
            } catch {
              names[uid] = uid;
            }
          })
        );
        setUserNames(names);
      } catch (err) {
        console.error("Error fetching latest assets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
  }, []);

  // Open user modal
  const openUser = async (uid: string) => {
    console.log("LatestAsset.openUser", uid);
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        console.warn("User not found", uid);
        return alert("User not found");
      }
      const data = snap.data() as any;
      console.log("LatestAsset.openUser fetched", data);
      setSelectedUser({ uid, ...data });
    } catch (err) {
      console.error("Error fetching user:", err);
      alert("Failed to fetch user. See console.");
    }
  };

  const closeUser = () => setSelectedUser(null);

  if (loading) return <div>Loading latest assets...</div>;

  return (
    <div className="latest-assets-container">
      <h3 className="title">Latest 5 Assets</h3>

      {/* Horizontal swipe area */}
      <div className="assets-scroll">
        {latest.map((asset) => (
          <div key={asset.uid} className="asset-card">
            <div className="asset-header">
              <button className="asset-link" onClick={() => router.push(`/assets/${asset.uid}`)}>
                {asset.description
                  ? (() => {
                      const words = asset.description.split(/\s+/);
                      return words.slice(0, 5).join(" ") + (words.length > 5 ? "…" : "");
                    })()
                  : asset.article || asset.uid}
              </button>
            </div>

            <div className="asset-meta">
              <small>Created: {asset.createdAt?.toDate().toLocaleDateString()}</small>
              <small>Type: {asset.typeOfEquipment || "-"}</small>
              <small>
                Assigned: {asset.assignedTo ? (
                  <button className="user-link" onClick={() => openUser(asset.assignedTo!)}>
                    {userNames[asset.assignedTo!] || asset.assignedTo}
                  </button>
                ) : "-"}
              </small>
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

      {/* User modal */}
      {selectedUser && <UserModal user={selectedUser} onClose={closeUser} />}
    </div>
  );
}
