"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { FiHome, FiUsers, FiBox, FiClipboard, FiSettings, FiLogOut } from "react-icons/fi";
import "@/app/globals.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const navButtons = [
    { icon: <FiHome />, path: "/" },
    { icon: <FiUsers />, path: "/users" },
    { icon: <FiBox />, path: "/assets" },
    { icon: <FiClipboard />, path: "/requests" },
    { icon: <FiSettings />, path: "/settings" },
    { icon: <FiLogOut />, action: handleLogout },
  ];

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  return (
    <div className="layout-container">
      <header className="layout-header">
        <div className="header-icons">
          {navButtons.map((btn, idx) => (
            <button
              key={idx}
              className="nav-icon"
              onClick={() => (btn.path ? router.push(btn.path) : btn.action?.())}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </header>

      <main className="layout-main">
        <div className="dashboard-card">
          {children}
        </div>
      </main>
    </div>
  );
}
