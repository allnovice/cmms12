"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import L from "leaflet";
import { FiMapPin } from "react-icons/fi";
import { renderToStaticMarkup } from "react-dom/server";

// Dynamic Leaflet components
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

export default function MapViewPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const center = { lat: 14.5995, lng: 120.9842 };

  // Create a divIcon with React Icon
  const customIcon = L.divIcon({
    html: renderToStaticMarkup(<FiMapPin size={28} color="red" />),
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const snapshot = await getDocs(collection(db, "assets"));
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(a => a.latitude && a.longitude);
        setAssets(data);
      } catch (err) {
        console.error("Error fetching assets:", err);
      }
    };
    fetchAssets();
  }, []);

  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {assets.map(a => (
          <Marker key={a.id} position={[a.latitude, a.longitude]} icon={customIcon}>
            <Popup>
              <strong>{a.assetName}</strong>
              {a.unit && <div>{a.unit}</div>}
              {a.status && <div>Status: {a.status}</div>}
              {a.location && <div>Location: {a.location}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
