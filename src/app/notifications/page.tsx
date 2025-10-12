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

  // Fetch notifications when user is available
  useEffect(() => {
    if (!user?.signatoryLevel) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`http://localhost:3002/notifications/${user.signatoryLevel}`);
        const data = await res.json();
        setNotifications(data.pending || []);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  const handleClick = (notif: NotificationItem) => {
    // Navigate to requests page, optionally pass docId to highlight the form
    router.push(`/requests`);
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
              style={{ cursor: "pointer", padding: "8px", borderBottom: "1px solid #ccc" }}
            >
              <strong>{n.filename}</strong> requires <strong>{n.signatureField}</strong> signature
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