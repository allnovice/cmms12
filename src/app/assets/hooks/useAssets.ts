"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/firebase";
import { Asset, Office, User } from "@/types";

import { useAuth } from '@/context/AuthContext';

export default function useAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [assetSnap, officeSnap, userSnap] = await Promise.all([
        getDocs(collection(db, "assets")),
        getDocs(collection(db, "locations")),
        getDocs(collection(db, "users")),
      ]);

      setAssets(assetSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Asset)));
      setOffices(officeSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Office)));
      setUsers(userSnap.docs.map((d) => ({ uid: d.id, fullname: d.data().fullname || "Unnamed", assignedAssets: (d.data() as any).assignedAssets || [] })));
    };
    fetchData();
  }, []);

  const handleAssignUser = async (assetId: string, uid: string) => {
    if (user?.role !== "admin") {
      alert("Only admins can assign users to assets.");
      return;
    }

    setUpdating(assetId);
    const asset = assets.find((a) => a.id === assetId);
    const previousUid = asset?.assignedTo;

    // update asset doc
    await updateDoc(doc(db, "assets", assetId), { assignedTo: uid });

    // update users: remove from previous user and add to new user
    if (previousUid && previousUid !== uid) {
      await updateDoc(doc(db, "users", previousUid), { assignedAssets: arrayRemove(assetId) });
    }
    if (uid) {
      await updateDoc(doc(db, "users", uid), { assignedAssets: arrayUnion(assetId) });
    }

    // update local state
    setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, assignedTo: uid } : a)));
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          return { ...u, assignedAssets: Array.from(new Set([...(u.assignedAssets || []), assetId])) } as typeof u;
        }
        if (previousUid && u.uid === previousUid) {
          return { ...u, assignedAssets: (u.assignedAssets || []).filter((id) => id !== assetId) } as typeof u;
        }
        return u;
      })
    );

    setUpdating(null);
  };

  const handleSetOffice = async (assetId: string, officeId: string) => {
    if (user?.role !== "admin") {
      alert("Only admins can change an asset's office.");
      return;
    }

    const selected = offices.find((o) => o.id === officeId);
    if (!selected) return;
    setUpdating(assetId);
    await updateDoc(doc(db, "assets", assetId), {
      location: selected.name,
      latitude: selected.latitude,
      longitude: selected.longitude,
    });
    setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, ...selected } : a)));
    setUpdating(null);
  };

  return { assets, offices, users, updating, handleAssignUser, handleSetOffice };
}
