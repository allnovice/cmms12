"use client";

import { useEffect, useState } from "react";
import "./ServerStatus.css";
export default function ServerStatus() {
  const [notifications, setNotifications] = useState(false);
  const [forms, setForms] = useState(false);

  useEffect(() => {
    const checkServer = async (url: string, setStatus: (v: boolean) => void) => {
      try {
        const res = await fetch(url);
        setStatus(res.ok);
      } catch {
        setStatus(false);
      }
    };

    checkServer(`${process.env.NEXT_PUBLIC_SERVER_URL}/`, setNotifications);
    checkServer(`${process.env.NEXT_PUBLIC_SERV_URL2}/`, setForms);
  }, []);

  return (
    <div className="server-status">
  <div className="server-list">
    <div className="server-item">
      <span className={`status-dot ${notifications ? "online" : "offline"}`} />
      <span>Notifications</span>
    </div>
    <div className="server-item">
      <span className={`status-dot ${forms ? "online" : "offline"}`} />
      <span>Forms</span>
    </div>
  </div>
  <div className="server-note">
    Note: Servers running from Render — may take a few seconds to start
  </div>
</div>
  );
}
