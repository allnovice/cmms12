"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface NotificationItem {
  docId: string;
  filename: string;
  filledBy: string;
  timestamp: string;
  signatureField: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user?.signatoryLevel) return;
    if (!process.env.NEXT_PUBLIC_SERV_URL2) {
      console.warn("NEXT_PUBLIC_SERV_URL2 missing");
      return;
    }

    let active = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERV_URL2}/notifications/${user.signatoryLevel}`,
          { signal: AbortSignal.timeout(5000) } // optional timeout
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (active) setNotifications(Array.isArray(data.pending) ? data.pending : []);
      } catch (err: any) {
        console.warn("Server unreachable or error:", err.message);
        if (active) setNotifications([]); // keep UI stable
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  const handleClick = (notif: NotificationItem) => {
    router.push("/requests");
  };

  return (
    <div className="notifications-page">
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <p>No new notifications.</p>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li
              key={n.docId + n.signatureField}
              onClick={() => handleClick(n)}
              style={{
                cursor: "pointer",
                padding: "8px",
                borderBottom: "1px solid #ccc",
              }}
            >
              <strong>{n.filename}</strong> requires{" "}
              <strong>{n.signatureField}</strong> signature
              <div style={{ fontSize: "12px", color: "#666" }}>
                Filled by: {n.filledBy} | {new Date(n.timestamp).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}