"use client";

import { useEffect, useRef, useState } from "react";

interface SignatureCanvasProps {
  signatureUrl?: string;
  onSave: (blob: Blob) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  instructions?: string[];
  maxFileSizeMB?: number;
}

export default function SignatureCanvas({
  signatureUrl,
  onSave,
  canvasWidth = 600,
  canvasHeight = 200,
  instructions = ["Sign within the box", "Start from top-left"],
  maxFileSizeMB = 1,
}: SignatureCanvasProps) {
  const [mode, setMode] = useState<"preview" | "draw">("preview");
  const [previewUrl, setPreviewUrl] = useState(signatureUrl || "");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // Draw instructions + baseline on canvas
  const drawInstructions = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Baseline rectangle
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Instructions
    ctx.fillStyle = "#aaa";
    ctx.font = `${Math.floor(canvas.height / 15)}px sans-serif`;
    instructions.forEach((text, idx) => {
      ctx.fillText(text, 15, 30 + idx * 25);
    });
  };

  useEffect(() => {
    if (mode === "draw") drawInstructions();
  }, [mode]);

  // Mouse/Touch handlers
  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const startDraw = (x: number, y: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    isDrawing.current = true;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (x: number, y: number) => {
    const ctx = getCtx();
    if (!ctx || !isDrawing.current) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    isDrawing.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) =>
    startDraw(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) =>
    draw(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  const handleMouseUp = () => stopDraw();
  const handleMouseLeave = () => stopDraw();

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    startDraw(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    draw(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchEnd = () => stopDraw();

  // Clear canvas
  const clearCanvas = () => drawInstructions();

  // Save signature
  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      onSave(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setMode("preview");
    });
  };

  // Upload PNG
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

      // Convert to blob and call onSave
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => onSave(blob));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {mode === "preview" && (
        <div style={{ textAlign: "center" }}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Signature preview"
              style={{ width: canvasWidth / 2, border: "1px solid #ccc" }}
            />
          ) : (
            <div
              style={{
                width: canvasWidth / 2,
                height: canvasHeight / 2,
                border: "1px solid #ccc",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#aaa",
              }}
            >
              No signature
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setMode("draw")}>Draw / Update</button>
            <input
              type="file"
              accept="image/png"
              onChange={handleUpload}
              style={{ marginLeft: 8 }}
            />
          </div>
        </div>
      )}

      {mode === "draw" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.95)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              border: "1px solid #000",
              touchAction: "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          <div style={{ marginTop: 16 }}>
            <button onClick={clearCanvas}>Clear</button>
            <button onClick={saveCanvas} style={{ marginLeft: 8 }}>
              Save
            </button>
            <button onClick={() => setMode("preview")} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
