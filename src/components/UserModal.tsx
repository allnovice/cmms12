"use client";

import { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";
import "@/app/users/page.css"; // reuse modal styles defined there

type Props = {
  uid?: string;
  user?: any;
  onClose: () => void;
};

export default function UserModal({ uid, user, onClose }: Props) {
  const [data, setData] = useState<any | null>(user || null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const fetchUser = async (id: string) => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (!mounted) return;
        if (snap.exists()) setData({ uid: id, ...(snap.data() as any) });
      } catch (err) {
        console.error("UserModal: fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (!data && uid) fetchUser(uid);
    return () => {
      mounted = false;
    };
  }, [uid, data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!uid && !data) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose}>×</button>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <h3>{data?.fullname || uid || "User"}</h3>
            <div className="modal-row"><strong>Email:</strong> {data?.email || "-"}</div>
            <div className="modal-row"><strong>Contact:</strong> {data?.contact || "-"}</div>
            <div className="modal-row"><strong>Division:</strong> {data?.division || "-"}</div>
            <div className="modal-row"><strong>Designation:</strong> {data?.designation || "-"}</div>
            <div className="modal-row"><strong>Assigned Assets:</strong>
              {data?.assignedAssets && data.assignedAssets.length ? (
                <ul className="assigned-list">
                  {data.assignedAssets.map((id: string) => (
                    <li key={id}><a href={`/assets/${id}`} onClick={(e) => { e.preventDefault(); router.push(`/assets/${id}`); }}>{id}</a></li>
                  ))}
                </ul>
              ) : (
                <span> None</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
