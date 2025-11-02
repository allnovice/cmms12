"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import "./SignatureCanvas.css";

interface SignatureCanvasProps {
  signatureUrl?: string;
  onSave: (blob: Blob) => void;
  maxFileSizeMB?: number;
}

export default function SignatureCanvas({
  signatureUrl,
  onSave,
  maxFileSizeMB = 1,
}: SignatureCanvasProps) {
  const [mode, setMode] = useState<"preview" | "draw">("preview");
  const [previewUrl, setPreviewUrl] = useState(signatureUrl || "");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (mode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const width = Math.min(window.innerWidth * 0.9, 800);
      const height = width / 2.5; // make it taller proportionally
      canvas.width = width;
      canvas.height = height;

      const pad = new SignaturePad(canvas, {
        backgroundColor: "white",
        penColor: "black",
        minWidth: 0.8,
        maxWidth: 2.5,
        throttle: 8,
      });

      padRef.current = pad;
      return () => pad.off();
    }
  }, [mode]);

  const saveCanvas = () => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      alert("Please sign before saving.");
      return;
    }

    const dataURL = pad.toDataURL("image/png");
    fetch(dataURL)
      .then((res) => res.blob())
      .then((blob) => {
        onSave(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setMode("preview");
      });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("png")) return alert("Only PNG files allowed");
    if (file.size / 1024 / 1024 > maxFileSizeMB)
      return alert(`File must be < ${maxFileSizeMB} MB`);

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPreviewUrl(url);
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => onSave(blob));
    };
    reader.readAsDataURL(file);
  };

  const clearCanvas = () => padRef.current?.clear();

  return (
  <div>
    {mode === "preview" && (
      <div className="signature-preview">
        {previewUrl ? (
          <img src={previewUrl} alt="Signature preview" />
        ) : (
          <div className="signature-placeholder">No signature</div>
        )}
        <div className="signature-preview-buttons">
          <button onClick={() => setMode("draw")}>Draw / Update</button>
          {/* Removed duplicate <input type="file" /> here */}
        </div>
      </div>
    )}

    {mode === "draw" && (
      <div className="signature-overlay">
        <div className="signature-modal">
          <canvas ref={canvasRef} className="signature-canvas" />
          <div className="signature-buttons">
            <button onClick={clearCanvas}>Clear</button>
            <button onClick={saveCanvas}>Save</button>
            <button onClick={() => setMode("preview")}>Cancel</button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
