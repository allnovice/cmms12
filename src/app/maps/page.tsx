"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/firebase";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useSearchParams, useRouter } from "next/navigation";

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

type Office = {
  name: string;
  latitude: number;
  longitude: number;
};

const DEFAULT_CENTER: [number, number] = [120.9842, 14.5995];
const DEFAULT_ZOOM = 12;
const PIN_INTERVAL = 30 * 60 * 1000; // 30 minutes

export default function MapViewPage() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [allPins, setAllPins] = useState<UserPin[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const didFlyRef = useRef(false); // ✅ Prevents double fly

  // --- Detect system theme ---
  const prefersDark = useRef(window.matchMedia("(prefers-color-scheme: dark)").matches);

  const stylePopup = (el: HTMLElement) => {
    el.style.backgroundColor = prefersDark.current ? "#1e1e1e" : "#fff";
    el.style.color = prefersDark.current ? "#fff" : "#000";
    el.style.padding = "8px";
    el.style.borderRadius = "6px";
    el.style.boxShadow = prefersDark.current
      ? "0 2px 8px rgba(0,0,0,0.9)"
      : "0 2px 8px rgba(0,0,0,0.3)";
    el.style.fontFamily = "sans-serif";
    el.style.fontSize = "14px";
  };

  // Listen to theme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      prefersDark.current = e.matches;
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  // --- Initialize map ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
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

  // --- Fetch assets ---
  useEffect(() => {
    const fetchAssets = async () => {
      const snap = await getDocs(collection(db, "assets"));
      const data = snap.docs
        .map((d) => ({ ...(d.data() as Asset), id: d.id }))
        .filter((a) => a.latitude && a.longitude);
      setAssets(data);
    };
    fetchAssets();
  }, []);

  // --- Fetch office locations ---
  useEffect(() => {
    const fetchOffices = async () => {
      const snap = await getDocs(collection(db, "locations"));
      const data = snap.docs
        .map((d) => ({ ...(d.data() as Office), id: d.id }))
        .filter((o) => o.latitude != null && o.longitude != null);
      setOffices(data);
    };
    fetchOffices();
  }, []);

  // --- Listen to all user pins ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "userPins"), (snap) => {
      const pins: UserPin[] = snap.docs.map((d) => {
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

  // --- Render markers ---
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // --- Office markers with asset popups ---
    offices.forEach((office) => {
      const officeAssets = assets.filter((a) => a.location === office.name);

      const popupEl = document.createElement("div");
      popupEl.style.minWidth = "150px";

      const title = document.createElement("strong");
      title.textContent = office.name;
      popupEl.appendChild(title);
      popupEl.appendChild(document.createElement("br"));

      if (officeAssets.length) {
        officeAssets.forEach((a) => {
          const div = document.createElement("div");
          div.style.marginTop = "4px";

          const link = document.createElement("a");
link.href = `/assets?highlight=${a.id}`;
link.textContent = `📦 ${a.assetName || "(Unnamed)"}`;
link.className = "popup-asset-link";

// Optional: prevent default behavior if you want client-side navigation with Next.js router
link.addEventListener("click", (e) => {
  e.preventDefault();
  router.push(`/assets?highlight=${a.id}`);
});

          // Fly to asset on click
          link.addEventListener("click", (e) => {

  e.preventDefault();

  router.push(`/assets/${a.id}`); // navigate to asset page

});


          div.appendChild(link);
          popupEl.appendChild(div);
        });
      } else {
        const em = document.createElement("em");
        em.textContent = "No assets";
        popupEl.appendChild(em);
      }

      stylePopup(popupEl);

      const marker = new maplibregl.Marker({ color: "#0078ff" })
        .setLngLat([office.longitude, office.latitude])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setDOMContent(popupEl))
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // --- Individual asset markers (assets without office) ---
    assets
      .filter((a) => !a.location)
      .forEach((a) => {
        const el = document.createElement("div");
        el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="red" stroke="#fff" stroke-width="2"/>
        </svg>`;
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([a.longitude!, a.latitude!])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(`
              <strong>${a.assetName}</strong>
              ${a.unit ? `<div>${a.unit}</div>` : ""}
              ${a.status ? `<div>Status: ${a.status}</div>` : ""}
            `)
          )
          .addTo(mapRef.current!);
        markersRef.current.push(marker);
      });

    // --- User pins with first name and themed popup ---
    allPins.forEach(async (p) => {
      const el = document.createElement("div");
      el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="${p.pinColor || "#0000ff"}" stroke="#fff" stroke-width="2"/>
      </svg>`;

      const marker = new maplibregl.Marker({ element: el }).setLngLat([
        p.longitude,
        p.latitude,
      ]);

      // fetch user's fullname
      const userSnap = await getDoc(doc(db, "users", p.uid));
      let firstName = p.uid;
      if (userSnap.exists()) {
        const fullname = userSnap.data()?.fullname;
        if (fullname) firstName = fullname.split(" ")[0];
      }

      const popupEl = document.createElement("div");
      popupEl.textContent = `User: ${firstName}`;
      stylePopup(popupEl);

      marker.setPopup(new maplibregl.Popup({ offset: 25 }).setDOMContent(popupEl));

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [assets, offices, allPins]);

  // --- Fly to asset if URL has lat/lng ---
  useEffect(() => {
    if (!mapRef.current || didFlyRef.current) return;

    const lat = searchParams.get("lat") || searchParams.get("assetLat");
    const lng = searchParams.get("lng") || searchParams.get("assetLng");

    if (lat && lng) {
      mapRef.current.flyTo({
        center: [parseFloat(lng), parseFloat(lat)],
        zoom: 15,
        essential: true,
      });
      didFlyRef.current = true;
    }
  }, [searchParams]);

  // --- Fly to current user if no asset params ---
  useEffect(() => {
    if (!mapRef.current) return;

    const hasAssetParams =
      (searchParams.get("lat") || searchParams.get("assetLat")) &&
      (searchParams.get("lng") || searchParams.get("assetLng"));
    const hasUserParam = !!searchParams.get("userId");
    if (hasAssetParams || hasUserParam) return;

    const user = auth.currentUser;
    if (!user) return;

    const myPin = allPins.find((p) => p.uid === user.uid);
    if (myPin && !didFlyRef.current) {
      mapRef.current.flyTo({
        center: [myPin.longitude, myPin.latitude],
        zoom: DEFAULT_ZOOM,
        essential: true,
      });
      didFlyRef.current = true;
    }
  }, [allPins, searchParams]);

  // --- Auto-pin logic ---
  useEffect(() => {
    if (!auth.currentUser || !navigator.geolocation) return;

    const schedulePin = async () => {
      try {
        const snap = await getDoc(doc(db, "userPins", auth.currentUser!.uid));
        const lastTimestamp = snap.exists()
          ? snap.data()?.timestamp?.toMillis()
          : 0;
        const now = Date.now();
        const timeSinceLast = now - (lastTimestamp || 0);

        const pinUser = async () => {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            const colorSnap = await getDoc(
              doc(db, "users", auth.currentUser!.uid)
            );
            const color = colorSnap.exists()
              ? colorSnap.data()?.pinColor || "#ff0000"
              : "#ff0000";

            const pinData = {
              uid: auth.currentUser!.uid,
              latitude,
              longitude,
              pinColor: color,
              timestamp: serverTimestamp(),
            };
            await setDoc(doc(db, "userPins", auth.currentUser!.uid), pinData);
          });
        };

        if (timeSinceLast >= PIN_INTERVAL) {
          pinUser();
          timeoutRef.current = setTimeout(schedulePin, PIN_INTERVAL);
        } else {
          timeoutRef.current = setTimeout(
            schedulePin,
            PIN_INTERVAL - timeSinceLast
      );
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

return <div ref={containerRef} style={{ height: "70vh", width: "100%" }} />;
}
