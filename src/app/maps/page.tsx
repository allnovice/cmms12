"use client";

import { useEffect, useState, useRef } from "react";
import { collection, doc, getDocs, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/firebase";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Asset = {
  id: string;
  assetName?: string;
  latitude?: number;
  longitude?: number;
  unit?: string;
  status?: string;
  location?: string;
};

type UserPin = {
  uid: string;
  latitude: number;
  longitude: number;
  pinColor?: string;
  timestamp: number;
};

const DEFAULT_CENTER: [number, number] = [120.9842, 14.5995];
const DEFAULT_ZOOM = 12;
const PIN_INTERVAL = 30 * 60 * 1000; // 30 minutes

export default function MapViewPage() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [userPin, setUserPin] = useState<UserPin | null>(null);
  const [allPins, setAllPins] = useState<UserPin[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Initialize Map ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256 },
        },
        layers: [{ id: "osm", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 }],
      },
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl());
  }, []);

  // --- Fetch Assets ---
  useEffect(() => {
    const fetchAssets = async () => {
      const snap = await getDocs(collection(db, "assets"));
      const data = snap.docs
        .map(d => ({ ...(d.data() as Asset), id: d.id }))
        .filter(a => a.latitude && a.longitude);
      setAssets(data);
    };
    fetchAssets();
  }, []);

  // --- Fetch all users pins ---
  useEffect(() => {
    const fetchAllPins = async () => {
      const snap = await getDocs(collection(db, "userPins"));
      const pins: UserPin[] = [];
      for (const docSnap of snap.docs) {
        const data = docSnap.data() as any;
        pins.push({
          uid: data.uid,
          latitude: data.latitude,
          longitude: data.longitude,
          pinColor: data.pinColor || "#00ffff",
          timestamp: data.timestamp?.toMillis() || Date.now(),
        });
      }
      setAllPins(pins);
    };

    fetchAllPins();
  }, []);

  // --- Render markers ---
// --- Render markers ---
useEffect(() => {
  const user = auth.currentUser;
  if (!mapRef.current || !user) return; // ✅ safely exit if no user

  const uid = user.uid; // ✅ TypeScript knows it's non-null now

  // Clear previous markers
  markersRef.current.forEach(m => m.remove());
  markersRef.current = [];

  // --- Render Assets ---
  assets.forEach(a => {
    const el = document.createElement("div");
    el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="red" stroke="#fff" stroke-width="2"/>
    </svg>`;
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([a.longitude!, a.latitude!])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
        <strong>${a.assetName}</strong>
        ${a.unit ? `<div>${a.unit}</div>` : ""}
        ${a.status ? `<div>Status: ${a.status}</div>` : ""}
        ${a.location ? `<div>Location: ${a.location}</div>` : ""}
      `))
      .addTo(mapRef.current!);
    markersRef.current.push(marker);
  });

  // --- Render All Users Pins ---
  allPins.forEach(p => {
    const el = document.createElement("div");
    el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="${p.pinColor || "#0000ff"}" stroke="#fff" stroke-width="2"/>
    </svg>`;
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([p.longitude, p.latitude])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setText(`User: ${p.uid}`))
      .addTo(mapRef.current!);
    markersRef.current.push(marker);
  });

  // --- Recenter on current user’s pin ---
  const myPin = allPins.find(p => p.uid === uid);
  if (myPin) {
    mapRef.current.flyTo({
      center: [myPin.longitude, myPin.latitude],
      zoom: 14,
      essential: true,
    });
  }
}, [assets, allPins]);

// --- Listen to all users pins in real-time ---
useEffect(() => {
  const unsub = onSnapshot(collection(db, "userPins"), snap => {
    const pins: UserPin[] = snap.docs.map(d => {
      const data = d.data() as any;
      return {
        uid: data.uid,
        latitude: data.latitude,
        longitude: data.longitude,
        pinColor: data.pinColor || "#00ffff",
        timestamp: data.timestamp?.toMillis() || Date.now(),
      };
    });
    setAllPins(pins);
  });

  return () => unsub();
}, []);

useEffect(() => {
  const user = auth.currentUser;
  if (!mapRef.current || !user) return;

  const myPin = allPins.find(p => p.uid === user.uid);
  if (myPin) {
    mapRef.current.flyTo({
      center: [myPin.longitude, myPin.latitude],
      zoom: DEFAULT_ZOOM,
      essential: true,
    });
  }
}, [allPins]);

  // --- Auto pin logic ---
  useEffect(() => {
    if (!auth.currentUser || !navigator.geolocation) return;

    const schedulePin = async () => {
      try {
        // Get last pin timestamp
        const snap = await getDoc(doc(db, "userPins", auth.currentUser!.uid));
        const lastTimestamp = snap.exists() ? snap.data()?.timestamp?.toMillis() : 0;
        const now = Date.now();
        const timeSinceLast = now - (lastTimestamp || 0);

        const pinUser = async () => {
          navigator.geolocation.getCurrentPosition(async pos => {
            const { latitude, longitude } = pos.coords;
            const colorSnap = await getDoc(doc(db, "users", auth.currentUser!.uid));
            const color = colorSnap.exists() ? colorSnap.data()?.pinColor || "#ff0000" : "#ff0000";

            const pinData = { uid: auth.currentUser!.uid, latitude, longitude, pinColor: color, timestamp: serverTimestamp() };
            await setDoc(doc(db, "userPins", auth.currentUser!.uid), pinData);
            setUserPin({ ...pinData, timestamp: Date.now() });
            setAllPins(prev => {
              const filtered = prev.filter(p => p.uid !== auth.currentUser!.uid);
              return [...filtered, { ...pinData, timestamp: Date.now() }];
            });
          });
        };

        if (timeSinceLast >= PIN_INTERVAL) {
          // Pin immediately
          pinUser();
          timeoutRef.current = setTimeout(schedulePin, PIN_INTERVAL);
        } else {
          // Schedule next pin after remaining time
          timeoutRef.current = setTimeout(schedulePin, PIN_INTERVAL - timeSinceLast);
        }
      } catch (err) {
        console.error("Auto-pin error:", err);
      }
    };

    schedulePin();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div>
      <div ref={containerRef} style={{ height: "70vh", width: "100%" }} />
    </div>
  );
}
