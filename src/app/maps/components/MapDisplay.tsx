"use client";

import dynamic from "next/dynamic";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { FiMapPin } from "react-icons/fi";

const MapContainer: any = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer: any = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker: any = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup: any = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export type Asset = {
  id: string;
  assetName?: string;
  latitude?: number;
  longitude?: number;
  unit?: string;
  status?: string;
  location?: string;
};

type UserPin = {
  latitude: number;
  longitude: number;
};

interface MapDisplayProps {
  assets: Asset[];
  userPin?: UserPin | null;
  center?: [number, number];
  zoom?: number;
}

export default function MapDisplay({ assets, userPin, center = [14.5995, 120.9842], zoom = 12 }: MapDisplayProps) {
  const assetIcon = L.divIcon({
    html: renderToStaticMarkup(<FiMapPin size={28} color="red" />),
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

  const userIcon = L.divIcon({
    html: renderToStaticMarkup(<FiMapPin size={28} color="blue" />),
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "70vh", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {assets.map(a => (
        <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={assetIcon}>
          <Popup>
            <strong>{a.assetName}</strong>
            {a.unit && <div>{a.unit}</div>}
            {a.status && <div>Status: {a.status}</div>}
            {a.location && <div>Location: {a.location}</div>}
          </Popup>
        </Marker>
      ))}
      {userPin && <Marker position={[userPin.latitude, userPin.longitude]} icon={userIcon}><Popup>Your location</Popup></Marker>}
    </MapContainer>
  );
}
