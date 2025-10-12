"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import axios from "axios";
import "./page.css";

const CLOUDINARY_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "settings";
const CLOUDINARY_URL = process.env.NEXT_PUBLIC_CLOUDINARY_URL!;

export default function SettingsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userData, setUserData] = useState<any>(null);
  const [fullname, setFullname] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch current Firebase user and Firestore data
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const docRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setFullname(data.fullname || "");
      }
    };
    fetchUser();
  }, []);

  // Canvas drawing logic
  const isDrawing = useRef(false);
  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = getCtx();
    if (!ctx) return;
    isDrawing.current = true;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = getCtx();
    if (!ctx || !isDrawing.current) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  // Touch support
  const startTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = getCtx();
    if (!ctx) return;
    isDrawing.current = true;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);

    const move = (ev: TouchEvent) => {
      const t = ev.touches[0];
      ctx.lineTo(t.clientX - rect.left, t.clientY - rect.top);
      ctx.stroke();
    };
    const end = () => {
      isDrawing.current = false;
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };

    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
  };

  const clearCanvas = () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const saveSignature = async () => {
  if (!canvasRef.current || !auth.currentUser) return;
  setLoading(true);
  const canvas = canvasRef.current;

  canvas.toBlob(async (blob) => {
    if (!blob) {
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("uid", auth.currentUser!.uid);

    try {
      // ✅ Call your API route, not CLOUDINARY_URL directly
      const res = await axios.post("/api/upload", formData);
      const sigUrl = res.data.secure_url;

      const docRef = doc(db, "users", auth.currentUser!.uid);
      await updateDoc(docRef, { signature: sigUrl, fullname });

      setUserData((prev: any) => ({ ...prev, signature: sigUrl, fullname }));
      alert("Saved signature and fullname!");
    } catch (err) {
      console.error(err);
      alert("Failed to save signature.");
    } finally {
      setLoading(false);
    }
  });
};

  if (!userData) return <p>Loading user...</p>;

  return (
    <div className="settings-form">
  <h2>Settings</h2>

  <div>
    <label>Email (read-only)</label>
    <input type="text" value={userData.email} readOnly />
  </div>

  <div>
    <label>Full Name</label>
    <input type="text" value={fullname} onChange={(e) => setFullname(e.target.value)} />
  </div>

  <div>
    <label>Signature</label>
    <canvas
      ref={canvasRef}
      width={300}
      height={150}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startTouch}
    />
    <div className="settings-actions">
      <button onClick={clearCanvas}>Clear</button>
    </div>
  </div>

  {userData.signature && (
    <div>
      <p>Saved Signature:</p>
      <img src={userData.signature} alt="Signature" className="signature-preview" />
    </div>
  )}

  <button onClick={saveSignature} disabled={loading}>
    {loading ? "Saving..." : "Save"}
  </button>
</div>
  );
}
