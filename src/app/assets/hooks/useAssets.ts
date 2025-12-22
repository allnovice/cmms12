"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/firebase";
import { Asset, Office, User } from "@/types";

import { useAuth } from '@/context/AuthContext';

export default function useAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [columns, setColumns] = useState<{ key: string; label: string }[]>([]);

  const prettify = (k: string) =>
    k
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (c) => c.toUpperCase());

  useEffect(() => {
    const fetchData = async () => {
      const [assetSnap, officeSnap, userSnap] = await Promise.all([
        getDocs(collection(db, "assets")),
        getDocs(collection(db, "locations")),
        getDocs(collection(db, "users")),
      ]);

      const assetsData = assetSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Asset));
      setAssets(assetsData);
      setOffices(officeSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Office)));
      setUsers(userSnap.docs.map((d) => ({ uid: d.id, fullname: d.data().fullname || "Unnamed", assignedAssets: (d.data() as any).assignedAssets || [] })));

      // derive columns dynamically from asset fields (fallback if no explicit schema exists)
      const keysSet = new Set<string>();
      assetsData.forEach(a => {
        Object.keys(a).forEach(k => {
          if (k === 'id' || k === 'photoUrls') return; // skip internal
          keysSet.add(k);
        });
      });

      const keys = Array.from(keysSet);
      const preferred = [
        'article',
        'typeOfEquipment',
        'description',
        'propertyNumber',
        'serialNumber',
        'acquisitionDate',
        'acquisitionValue',
        'assignedTo',
        'location',
      ];

      const ordered = keys.sort((a, b) => {
        const ia = preferred.indexOf(a);
        const ib = preferred.indexOf(b);
        if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        return a.localeCompare(b);
      });

      // If there's an explicit columns config in Firestore, use that instead
      try {
        const cfgRef = doc(db, "meta", "assetColumns");
        const cfgSnap = await getDoc(cfgRef);
        if (cfgSnap.exists()) {
          const cfg = cfgSnap.data();
          const cols = (cfg.columns || []).map((c: any) => (typeof c === "string" ? { key: c, label: prettify(c) } : { key: c.key, label: c.label || prettify(c.key) }));
          if (cols.length > 0) {
            setColumns(cols);
          } else {
            setColumns(ordered.map((k) => ({ key: k, label: prettify(k) })));
          }
        } else {
          setColumns(ordered.map((k) => ({ key: k, label: prettify(k) })));
        }
      } catch (err) {
        setColumns(ordered.map((k) => ({ key: k, label: prettify(k) })));
      }

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

  const handleSetStatus = async (assetId: string, status: string) => {
    if (user?.role !== "admin") {
      alert("Only admins can change an asset's status.");
      return;
    }

    setUpdating(assetId);
    await updateDoc(doc(db, "assets", assetId), { status });
    setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, status } : a)));
    setUpdating(null);
  };

  return { assets, offices, users, updating, handleAssignUser, handleSetOffice, handleSetStatus, columns };
}
