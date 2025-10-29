"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Asset, UserPin } from "./types";

interface Props {
  assets: Asset[];
  userPin: UserPin | null;
  center: [number, number];
  zoom: number;
}

export default function MapContainer({ assets, userPin, center, zoom }: Props) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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
      center,
      zoom,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl());
  }, [center, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Asset markers (red)
    assets.forEach(a => {
      const el = document.createElement("div");
      el.style.background = "red";
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";

      const marker = new maplibregl.Marker(el)
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

    // User pin marker (dynamic color)
    if (userPin) {
      const el = document.createElement("div");
      el.style.background = userPin.pinColor || "#0000ff"; // <- user color
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";

      const marker = new maplibregl.Marker(el)
        .setLngLat([userPin.longitude, userPin.latitude])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText("Your location"))
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    }
  }, [assets, userPin]);

  return <div ref={containerRef} style={{ height: "70vh", width: "100%" }} />;
}
