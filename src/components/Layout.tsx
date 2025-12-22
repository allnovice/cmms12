"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import {
  FiHome,
  FiUsers,
  FiBox,
  FiBook,
  FiClipboard,
  FiMapPin,
  FiMessageCircle,
  FiSettings,
  FiBell,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import "@/app/globals.css";
import "./Layout.css";

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
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isLoginPage = pathname === "/login";
  const isDashboardPage = pathname === "/";

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pmNotifications, setPmNotifications] = useState<PmItem[]>([]);

  const fetchFormNotifications = async (user: any, active: { value: boolean }) => {
    if (!user.signatoryLevel || user.signatoryLevel < 2) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERV_URL2}/notifications/${user.signatoryLevel}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (active.value) {
        const filtered = (data.pending || []).filter((f: any) => {
          const lvl = parseInt(f.signatureField.replace("signature", "")) || 1;
          return lvl >= 2 && lvl <= user.signatoryLevel;
        });
        setNotifications(filtered);
      }
    } catch (err: any) {
      console.warn("Form notify error:", err.message);
      if (active.value) setNotifications([]);
    }
  };

  const fetchPmNotifications = async (user: any, active: { value: boolean }) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERV_URL2}/pm-notifications/${user.uid}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (active.value) setPmNotifications(Array.isArray(data.unread) ? data.unread : []);
    } catch (err: any) {
      console.warn("PM notify error:", err.message);
      if (active.value) setPmNotifications([]);
    }
  };

  // ✅ Fetch both on mount + every 30s
  useEffect(() => {
    if (isLoginPage || !user || !process.env.NEXT_PUBLIC_SERV_URL2) return;
    const active = { value: true };

    fetchFormNotifications(user, active);
    fetchPmNotifications(user, active);

    const interval = setInterval(() => {
      fetchFormNotifications(user, active);
      fetchPmNotifications(user, active);
    }, 30000);

    return () => {
      active.value = false;
      clearInterval(interval);
    };
  }, [isLoginPage, user]);

  // ✅ Refresh immediately when returning from /notifications
  useEffect(() => {
    if (isLoginPage || !user) return;
    if (pathname !== "/notifications") {
      const active = { value: true };
      fetchFormNotifications(user, active);
      fetchPmNotifications(user, active);
      return () => {
        active.value = false;
      };
    }
  }, [isLoginPage, pathname, user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  const totalNotifCount = notifications.length + pmNotifications.length;

  const navButtons = [
    { icon: <FiHome />, path: "/" },
    { icon: <FiUsers />, path: "/users" },
    { icon: <FiBox />, path: "/assets" },
    { icon: <FiBook />, path: "/borrowing" },
    { icon: <FiClipboard />, path: "/requests" },
    { icon: <FiMapPin />, path: "/maps" },
    { icon: <FiMessageCircle />, path: "/chat" },
    { icon: <FiSettings />, path: "/settings" },
    { icon: <FiBell />, action: handleNotifications },
    { icon: <FiLogOut />, action: handleLogout },
  ];

  useEffect(() => {
    if (isLoginPage) return;
    if (!loading && !user) router.replace("/login");
  }, [isLoginPage, user, loading, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Redirecting...</p>;

  const cardClassName = isDashboardPage ? "dashboard-card dashboard-card--home" : "dashboard-card";

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
        <div className={cardClassName}>{children}</div>
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
