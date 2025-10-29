"use client";

import { useEffect, useState, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/firebase";

const DEFAULT_CENTER: [number, number] = [120.9842, 14.5995]; // [lng, lat] for MapLibre
const DEFAULT_ZOOM = 12;

export type Asset = {
  id: string;
  assetName?: string;
  latitude?: number;
  longitude?: number;
  unit?: string;
  status?: string;
  location?: string;
};

export default function MapViewPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [userPin, setUserPin] = useState<{ latitude: number; longitude: number; timestamp: number } | null>(null);
  const [allLatestPins, setAllLatestPins] = useState<{ uid: string; latitude: number; longitude: number }[]>([]);
  const [loadingPin, setLoadingPin] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || typeof window === "undefined") return;
    if (mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl());
  }, []);

  // Fetch assets
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const snapshot = await getDocs(collection(db, "assets"));
        const data = snapshot.docs
          .map(doc => ({ ...(doc.data() as Asset), id: doc.id }))
          .filter(a => a.latitude && a.longitude);
        setAssets(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAssets();
  }, []);

  // Fetch user's latest pin
  useEffect(() => {
    const fetchUserPin = async () => {
      if (!auth.currentUser) return;
      const snap = await getDoc(doc(db, "userPins", auth.currentUser.uid));
      if (snap.exists()) {
        const data = snap.data() as any;
        setUserPin({ latitude: data.latitude, longitude: data.longitude, timestamp: data.timestamp?.toMillis() || 0 });
      }
    };
    fetchUserPin();
  }, []);

  // Fetch all users' latest pins
  useEffect(() => {
    const fetchAllLatestPins = async () => {
      try {
        const snapshot = await getDocs(collection(db, "allUsersPins"));
        const pins: any[] = snapshot.docs.map(doc => doc.data());

        // Reduce to latest per user
        const latestMap: Record<string, typeof pins[0]> = {};
        pins.forEach(p => {
          const ts = p.timestamp?.toMillis ? p.timestamp.toMillis() : 0;
          if (!latestMap[p.uid] || ts > (latestMap[p.uid].timestamp?.toMillis() || 0)) {
            latestMap[p.uid] = p;
          }
        });

        setAllLatestPins(
          Object.values(latestMap).map(p => ({
            uid: p.uid,
            latitude: p.latitude,
            longitude: p.longitude,
          }))
        );
      } catch (err) {
        console.error(err);
      }
    };
    fetchAllLatestPins();
  }, []);

  // Render markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Assets
    assets.forEach(a => {
      const el = document.createElement("div");
      el.style.background = "red";
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";

      const marker = new maplibregl.Marker(el)
        .setLngLat([a.longitude!, a.latitude!])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <strong>${a.assetName}</strong>
            ${a.unit ? `<div>${a.unit}</div>` : ""}
            ${a.status ? `<div>Status: ${a.status}</div>` : ""}
            ${a.location ? `<div>Location: ${a.location}</div>` : ""}
          `)
        )
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // User pin
    if (userPin) {
      const el = document.createElement("div");
      el.style.background = "blue";
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";

      const marker = new maplibregl.Marker(el)
        .setLngLat([userPin.longitude, userPin.latitude])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText("Your location"))
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    }

    // All users' latest pins
    allLatestPins.forEach(p => {
      const el = document.createElement("div");
      el.style.background = "blue";
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";

      const marker = new maplibregl.Marker(el)
        .setLngLat([p.longitude, p.latitude])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText(`User: ${p.uid}`))
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [assets, userPin, allLatestPins]);

  // Pin location handler
  const handlePinLocation = () => {
    if (!auth.currentUser) return alert("Not logged in");

    if (userPin) {
      const now = Date.now();
      const diff = now - userPin.timestamp;
      const min30 = 30 * 60 * 1000;
      if (diff < min30) {
        const minsLeft = Math.ceil((min30 - diff) / 60000);
        return alert(`You can pin again in ${minsLeft} minutes`);
      }
    }

    if (!navigator.geolocation) return alert("Geolocation not supported");

    setLoadingPin(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        try {
          // Save in user's latest pin
          await setDoc(doc(db, "userPins", auth.currentUser!.uid), {
            uid: auth.currentUser!.uid,
            latitude,
            longitude,
            timestamp: serverTimestamp(),
          });

          // Save in allUsersPins history
          await setDoc(doc(collection(db, "allUsersPins")), {
            uid: auth.currentUser!.uid,
            latitude,
            longitude,
            timestamp: serverTimestamp(),
          });

          setUserPin({ latitude, longitude, timestamp: Date.now() });
          alert("Your location has been pinned!");
        } catch (err) {
          console.error(err);
          alert("Failed to pin location");
        } finally {
          setLoadingPin(false);
        }
      },
      err => {
        console.error(err);
        alert("Failed to get location");
        setLoadingPin(false);
      }
    );
  };

  return (
    <div>
      <div ref={mapContainer} style={{ height: "70vh", width: "100%" }} />
      <div style={{ marginTop: 10, textAlign: "center" }}>
        <button onClick={handlePinLocation} disabled={loadingPin}>
          {loadingPin ? "Pinning..." : "Pin My Location"}
        </button>
      </div>
    </div>
  );
}
