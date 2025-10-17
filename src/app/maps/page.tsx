"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import L from "leaflet";
import { FiMapPin } from "react-icons/fi";
import { renderToStaticMarkup } from "react-dom/server";

// ✅ use direct imports for dynamic components
const MapContainer: any = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer: any = dynamic(
  () => import("react-leaflet").then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker: any = dynamic(
  () => import("react-leaflet").then(mod => mod.Marker),
  { ssr: false }
);
const Popup: any = dynamic(
  () => import("react-leaflet").then(mod => mod.Popup),
  { ssr: false }
);

const center: [number, number] = [14.5995, 120.9842];

type Asset = {
  id: string;
  assetName?: string;
  latitude?: number;
  longitude?: number;
  unit?: string;
  status?: string;
  location?: string;
  [key: string]: any;
};

export default function MapViewPage() {
  const [assets, setAssets] = useState<Asset[]>([]);

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
          .map(doc => ({ ...(doc.data() as Asset), id: doc.id }))
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
      {typeof window !== "undefined" && (
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {assets.map(a => (
            <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={customIcon}>
              <Popup>
                <strong>{a.assetName}</strong>
                {a.unit && <div>{a.unit}</div>}
                {a.status && <div>Status: {a.status}</div>}
                {a.location && <div>Location: {a.location}</div>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
