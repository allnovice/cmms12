"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password toggle
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (forgotMode) {
        // Forgot password: send reset link
        await sendPasswordResetEmail(auth, email);
        setMessage("✅ Password reset link sent! Check your inbox.");
      } else {
        // Login flow
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
      <div className="login-card">
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email input used in both modes */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password only in login mode */}
          {!forgotMode && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

          {/* Error / success messages */}
          {error && <p className="error-text">{error}</p>}
          {message && <p className="reset-message">{message}</p>}

          {/* Main button */}
          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : forgotMode ? "Send Link" : "Login"}
          </button>
        </form>

        {/* Toggle link */}
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
