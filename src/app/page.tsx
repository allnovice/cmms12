"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getCountFromServer, getDocs, getDoc, doc, query, orderBy, limit } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import UserModal from "../components/UserModal";

import "./DashboardLayout.css";
import "./ServerStatus.css";
import "./StatsOverview.css";
import "./LatestAsset.css";
import "./LatestUser.css";

type ServerState = {
  notifications: boolean;
  forms: boolean;
};

function ServerStatusSection() {
  const [{ notifications, forms }, setStatus] = useState<ServerState>({ notifications: false, forms: false });

  useEffect(() => {
    const checkServer = async (url: string, key: keyof ServerState) => {
      try {
        const res = await fetch(url);
        setStatus((prev) => ({ ...prev, [key]: res.ok }));
      } catch {
        setStatus((prev) => ({ ...prev, [key]: false }));
      }
    };

    if (process.env.NEXT_PUBLIC_SERV_URL2) {
      checkServer(`${process.env.NEXT_PUBLIC_SERV_URL2}/`, "notifications");
    }
    if (process.env.NEXT_PUBLIC_SERVER_URL) {
      checkServer(`${process.env.NEXT_PUBLIC_SERVER_URL}/`, "forms");
    }
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
      <div className="server-note">Note: Servers running from Render — may take a few seconds to start</div>
    </div>
  );
}

type MetricKey = "assets" | "offices" | "employees";

type MetricConfig = {
  label: string;
  collection: string;
  hint: string;
};

const metricConfig: Record<MetricKey, MetricConfig> = {
  assets: { label: "Assets", collection: "assets", hint: "Tracked items" },
  offices: { label: "Offices", collection: "locations", hint: "Active sites" },
  employees: { label: "Employees", collection: "users", hint: "People onboard" },
};

const metricEntries = Object.entries(metricConfig) as [MetricKey, MetricConfig][];

function StatsOverviewSection() {
  const [counts, setCounts] = useState<Record<MetricKey, number>>({ assets: 0, offices: 0, employees: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadCounts = async () => {
      setError(null);
      try {
        const values = await Promise.all(
          metricEntries.map(async ([key, cfg]) => {
            const snap = await getCountFromServer(collection(db, cfg.collection));
            const total = snap.data().count ?? 0;
            return [key, total] as [MetricKey, number];
          })
        );
        if (alive) setCounts(Object.fromEntries(values) as Record<MetricKey, number>);
      } catch (err) {
        console.error("StatsOverview: failed to fetch counts", err);
        if (alive) setError("Unable to load summary data.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadCounts();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="stats-overview" aria-live="polite" aria-label="Dashboard totals">
      <div className="stats-grid">
        {metricEntries.map(([key, cfg]) => (
          <article key={key} className="stat-card">
            <header>
              <p className="stat-label">{cfg.label}</p>
              <p className="stat-hint">{cfg.hint}</p>
            </header>
            <p className="stat-value">{loading ? "—" : counts[key].toLocaleString()}</p>
          </article>
        ))}
      </div>
      {error && (
        <p role="alert" className="stats-error">
          {error}
        </p>
      )}
    </section>
  );
}

interface AssetRecord {
  uid: string;
  createdAt: Timestamp;
  article?: string;
  description?: string;
  typeOfEquipment?: string;
  assignedTo?: string;
  photoUrls?: string[];
}

function LatestAssetSection() {
  const [latest, setLatest] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const ref = collection(db, "assets");
        const q = query(ref, orderBy("createdAt", "desc"), limit(5));
        const snap = await getDocs(q);
        const items: AssetRecord[] = snap.docs.map((doc) => ({ uid: doc.id, ...(doc.data() as any) }));
        setLatest(items);

        const uids = Array.from(new Set(items.map((a) => a.assignedTo).filter((x): x is string => !!x)));
        const names: Record<string, string> = {};
        await Promise.all(
          uids.map(async (uid) => {
            try {
              const userSnap = await getDoc(doc(db, "users", uid));
              names[uid] = userSnap.exists() ? (userSnap.data() as any).fullname || uid : uid;
            } catch {
              names[uid] = uid;
            }
          })
        );
        setUserNames(names);
      } catch (err) {
        console.error("Error fetching latest assets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
  }, []);

  const openUser = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        alert("User not found");
        return;
      }
      setSelectedUser({ uid, ...(snap.data() as any) });
    } catch (err) {
      console.error("Error fetching user:", err);
      alert("Failed to fetch user. See console.");
    }
  };

  const closeUser = () => setSelectedUser(null);

  if (loading) return <div>Loading latest assets...</div>;

  return (
    <div className="latest-assets-container">
      <h3 className="title">Latest 5 Assets</h3>
      <div className="assets-scroll">
        {latest.map((asset) => (
          <div key={asset.uid} className="asset-card">
            <div className="asset-header">
              <button className="asset-link" onClick={() => router.push(`/assets/${asset.uid}`)}>
                {asset.description
                  ? (() => {
                      const words = asset.description.split(/\s+/);
                      return words.slice(0, 5).join(" ") + (words.length > 5 ? "…" : "");
                    })()
                  : asset.article || asset.uid}
              </button>
            </div>
            <div className="asset-meta">
              <small>Created: {asset.createdAt?.toDate().toLocaleDateString()}</small>
              <small>Type: {asset.typeOfEquipment || "-"}</small>
              <small>
                Assigned: {asset.assignedTo ? (
                  <button className="user-link" onClick={() => openUser(asset.assignedTo!)}>
                    {userNames[asset.assignedTo!] || asset.assignedTo}
                  </button>
                ) : (
                  "-"
                )}
              </small>
            </div>
            {Array.isArray(asset.photoUrls) && asset.photoUrls.length > 0 && (
              <div className="photo-grid">
                {asset.photoUrls.map((url, i) => (
                  <img key={i} src={url} alt="asset" className="photo" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {selectedUser && <UserModal user={selectedUser} onClose={closeUser} />}
    </div>
  );
}

interface LatestUserRecord {
  uid: string;
  fullname?: string;
  designation?: string;
  division?: string;
  email?: string;
  createdAt: Timestamp;
}

function LatestUserSection() {
  const [latest, setLatest] = useState<LatestUserRecord | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const ref = collection(db, "users");
        const q = query(ref, orderBy("createdAt", "desc"), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          setLatest({ uid: docSnap.id, ...(docSnap.data() as any) });
        }
      } catch (err) {
        console.error("Error fetching latest user:", err);
      }
    };

    fetchUser();
  }, []);

  if (!latest) return <div>Loading latest user...</div>;

  return (
    <div className="latest-user-card">
      <div className="user-header">Latest Registered User</div>
      <div className="user-field">
        <strong>Name:</strong> {latest.fullname}
      </div>
      <div className="user-field">
        <strong>Designation:</strong> {latest.designation}
      </div>
      <div className="user-field">
        <strong>Division:</strong> {latest.division}
      </div>
      <div className="user-field">
        <strong>Email:</strong> {latest.email}
      </div>
      <small className="user-created">Added: {latest.createdAt.toDate().toLocaleString()}</small>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="dashboard-layout">
      <section className="dashboard-block" aria-label="Server status">
        <ServerStatusSection />
      </section>
      <section className="dashboard-block" aria-label="Key counts">
        <StatsOverviewSection />
      </section>
      <div className="dashboard-grid" aria-label="Latest activity">
        <section className="dashboard-block" aria-label="Latest assets">
          <LatestAssetSection />
        </section>
        <section className="dashboard-block" aria-label="Latest user">
          <LatestUserSection />
        </section>
      </div>
    </div>
  );
}
