"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Asset, Office, User } from "@/types";

export default function useAssets() {
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
      setUsers(userSnap.docs.map((d) => ({ uid: d.id, fullname: d.data().fullname || "Unnamed" })));
    };
    fetchData();
  }, []);

  const handleAssignUser = async (assetId: string, uid: string) => {
    setUpdating(assetId);
    await updateDoc(doc(db, "assets", assetId), { assignedTo: uid });
    setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, assignedTo: uid } : a)));
    setUpdating(null);
  };

  const handleSetOffice = async (assetId: string, officeId: string) => {
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
