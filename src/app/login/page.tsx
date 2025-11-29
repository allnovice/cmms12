"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "@/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [spin, setSpin] = useState(false);

  // 🔥 Company logo URL from Firestore
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
  const fetchLogo = async () => {
    const snap = await getDocs(collection(db, "companyLogo"));
    if (snap.empty) return;

    type LogoDoc = {
      id: string;
      url: string;
      uploadedAt?: any;
    };

    const items: LogoDoc[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    items.sort((a, b) => {
      const ta = a.uploadedAt?.toMillis?.() ?? 0;
      const tb = b.uploadedAt?.toMillis?.() ?? 0;
      return tb - ta;
    });

    setLogoUrl(items[0].url);
  };

  fetchLogo();
}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (forgotMode) {
        await sendPasswordResetEmail(auth, email);
        setMessage("✅ Password reset link sent! Check your inbox.");
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const user = userCred.user;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            createdAt: serverTimestamp(),
            role: "user",
            signatoryLevel: "1",
          });
        }

        router.replace("/");
      }
    } catch (err: any) {
      setError(err.message || (forgotMode ? "Failed to send reset link" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Logo above the login card */}
      {logoUrl && (
        <img
  src={logoUrl}
  alt="Company Logo"
  className={`login-logo ${spin ? "spin" : ""}`}
  onClick={() => setSpin(!spin)}  // tap to spin/unspin
         />
      )}

      <div className="login-card">
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {!forgotMode && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

          {error && <p className="error-text">{error}</p>}
          {message && <p className="reset-message">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : forgotMode ? "Send Link" : "Login"}
          </button>
        </form>

        <button
          type="button"
          className="forgot-btn"
          onClick={() => {
            setForgotMode(!forgotMode);
            setError("");
            setMessage("");
            setPassword("");
          }}
        >
          {forgotMode ? "Back to Login" : "Forgot Password?"}
        </button>
      </div>
    </div>
  );
}
