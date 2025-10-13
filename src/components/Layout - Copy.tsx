"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { FiHome, FiUsers, FiBox, FiClipboard, FiSettings, FiBell, FiLogOut } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import "@/app/globals.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch notifications for the user's signatoryLevel
  useEffect(() => {
    if (!user?.signatoryLevel || user.signatoryLevel < 2) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`http://localhost:3002/notifications/${user.signatoryLevel}`);
        const data = await res.json();
        // Filter notifications that match the user's level
        const filtered = (data.pending || []).filter((f: any) => {
          const lvl = parseInt(f.signatureField.replace("signature", "")) || 1;
          return lvl >= 2 && lvl <= user.signatoryLevel;
        });
        setNotifications(filtered);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  const navButtons = [
    { icon: <FiHome />, path: "/" },
    { icon: <FiUsers />, path: "/users" },
    { icon: <FiBox />, path: "/assets" },
    { icon: <FiClipboard />, path: "/requests" },
    { icon: <FiSettings />, path: "/settings" },
    { icon: <FiBell />, action: handleNotifications }, // notification icon
    { icon: <FiLogOut />, action: handleLogout },
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Redirecting...</p>;


  return (
    <div className="layout-container">
      <header className="layout-header">
        <div className="header-icons" style={{ position: "relative" }}>
          {navButtons.map((btn, idx) => (
            <button
              key={idx}
              className="nav-icon"
              onClick={() => (btn.path ? router.push(btn.path) : btn.action?.())}
              style={{ position: "relative" }}
            >
              {btn.icon}
              {btn.icon.type === FiBell && notifications.length > 0 && (
                <span className="notif-badge">{notifications.length}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="layout-main">
        <div className="dashboard-card">{children}</div>
      </main>

      <style jsx>{`
        .notif-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: red;
          color: white;
          font-size: 10px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
