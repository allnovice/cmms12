"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import {
  FiHome,
  FiUsers,
  FiBox,
  FiClipboard,
  FiMapPin,
  FiMessageCircle,
  FiSettings,
  FiBell,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import "@/app/globals.css";

interface NotificationItem {
  docId: string;
  filename: string;
  filledBy: string;
  timestamp: string;
  signatureField: string;
}

interface PmItem {
  content: string;
  senderUid: string;
  timestamp: number;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pmNotifications, setPmNotifications] = useState<PmItem[]>([]);

  // ✅ Fetch both form and PM notifications
  useEffect(() => {
    if (!user) return;
    if (!process.env.NEXT_PUBLIC_SERV_URL2) {
      console.warn("NEXT_PUBLIC_SERV_URL2 missing");
      return;
    }

    let active = true;

    const fetchFormNotifications = async () => {
      if (!user.signatoryLevel || user.signatoryLevel < 2) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERV_URL2}/notifications/${user.signatoryLevel}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (active) {
          const filtered = (data.pending || []).filter((f: any) => {
            const lvl = parseInt(f.signatureField.replace("signature", "")) || 1;
            return lvl >= 2 && lvl <= user.signatoryLevel;
          });
          setNotifications(filtered);
        }
      } catch (err: any) {
        console.warn("Form notify error:", err.message);
        if (active) setNotifications([]);
      }
    };

    const fetchPmNotifications = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERV_URL2}/pm-notifications/${user.uid}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (active) setPmNotifications(Array.isArray(data.unread) ? data.unread : []);
      } catch (err: any) {
        console.warn("PM notify error:", err.message);
        if (active) setPmNotifications([]);
      }
    };

    // Initial + Interval refresh
    fetchFormNotifications();
    fetchPmNotifications();
    const interval = setInterval(() => {
      fetchFormNotifications();
      fetchPmNotifications();
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  // ✅ Combine both counts for badge
  const totalNotifCount = notifications.length + pmNotifications.length;

  const navButtons = [
    { icon: <FiHome />, path: "/" },
    { icon: <FiUsers />, path: "/users" },
    { icon: <FiBox />, path: "/assets" },
    { icon: <FiClipboard />, path: "/requests" },
    { icon: <FiMapPin />, path: "/maps" },
    { icon: <FiMessageCircle />, path: "/chat" },
    { icon: <FiSettings />, path: "/settings" },
    { icon: <FiBell />, action: handleNotifications },
    { icon: <FiLogOut />, action: handleLogout },
  ];

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
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
              onClick={() =>
                btn.path ? router.push(btn.path) : btn.action?.()
              }
              style={{ position: "relative" }}
            >
              {btn.icon}
              {btn.icon.type === FiBell && totalNotifCount > 0 && (
                <span className="notif-badge">{totalNotifCount}</span>
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
