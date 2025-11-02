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

interface PmItem {
  content: string;
  senderUid: string;
  timestamp: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pmNotifications, setPmNotifications] = useState<PmItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) return;
    if (!process.env.NEXT_PUBLIC_SERV_URL2) {
      console.warn("NEXT_PUBLIC_SERV_URL2 missing");
      return;
    }

    let active = true;

    // Fetch pending form notifications
    const fetchFormNotifications = async () => {
      if (!user.signatoryLevel) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERV_URL2}/notifications/${user.signatoryLevel}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (active) setNotifications(Array.isArray(data.pending) ? data.pending : []);
      } catch (err: any) {
        console.warn("Form notify error:", err.message);
        if (active) setNotifications([]);
      }
    };

    // Fetch private message notifications
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

    // Initial + interval polling
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

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  const handleFormClick = (notif: NotificationItem) => {
    router.push("/requests");
  };

  const handlePmClick = (pm: PmItem) => {
  router.push(`/chat?uid=${pm.senderUid}`);
};

  return (
    <div className="notifications-page">
      <h2>Notifications</h2>

      {/* ===== Pending Signatures ===== */}
      <section>
        <h3>Pending Signatures</h3>
        {notifications.length === 0 ? (
          <p>No pending forms.</p>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li
                key={n.docId + n.signatureField}
                onClick={() => handleFormClick(n)}
                style={{
                  cursor: "pointer",
                  padding: "8px",
                  borderBottom: "1px solid #ccc",
                }}
              >
                <strong>{n.filename}</strong> requires{" "}
                <strong>{n.signatureField}</strong> signature
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Filled by: {n.filledBy} |{" "}
                  {new Date(n.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== Private Messages ===== */}
      <section style={{ marginTop: "20px" }}>
        <h3>Private Messages</h3>
        {pmNotifications.length === 0 ? (
          <p>No new messages.</p>
        ) : (
          <ul>
            {pmNotifications.map((pm, idx) => (
              <li
                key={idx}
                onClick={() => handlePmClick(pm)}
                style={{
                  cursor: "pointer",
                  padding: "8px",
                  borderBottom: "1px solid #ccc",
                }}
              >
                <strong>New message</strong> from {pm.senderUid}
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {pm.content.length > 50
                    ? pm.content.slice(0, 50) + "..."
                    : pm.content}
                  <br />
                  {new Date(pm.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
