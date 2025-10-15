"use client";

import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [server1, setServer1] = useState(false);
  const [server2, setServer2] = useState(false);

  useEffect(() => {
    const checkServer = async (url: string, setStatus: (v: boolean) => void) => {
      try {
        const res = await fetch(url);
        setStatus(res.ok);
      } catch {
        setStatus(false);
      }
    };

    checkServer(`${process.env.NEXT_PUBLIC_SERVER_URL}/`, setServer2);
checkServer(`${process.env.NEXT_PUBLIC_SERV_URL2}/`, setServer1);

}, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Dashboard</h1>

      <div style={{ marginBottom: "1rem" }}>
        <p>
          Server 1 (NotifySrv):{" "}
          <span style={{ color: server1 ? "green" : "red" }}>
            {server1 ? "Online" : "Offline"}
          </span>
        </p>

        <p>
          Server 2 (Req2Srv):{" "}
          <span style={{ color: server2 ? "green" : "red" }}>
            {server2 ? "Online" : "Offline"}
          </span>
        </p>
      </div>

      <main>{children}</main>
    </div>
  );
}