"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getCountFromServer, getDocs, getDoc, doc, query, where } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import UserModal from "../components/UserModal";

// Styles are globally applied via globals.css

const USER_SHOWCASE_LIMIT = 6;

function shuffleArray<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type ServerState = {
  notifications: boolean;
  forms: boolean;
};

function ServerStatusCard() {
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
    <article className="stat-card server-status-card">
      <header>
        <p className="stat-label">Server Status</p>
        <p className="stat-hint">Render-hosted services</p>
      </header>
      <div className="server-status">
        <div className="server-item">
          <span className={`status-dot ${notifications ? "online" : "offline"}`} />
          <span>Notifications</span>
        </div>
        <div className="server-item">
          <span className={`status-dot ${forms ? "online" : "offline"}`} />
          <span>Forms</span>
        </div>
        <p className="server-note">May take a few seconds to wake</p>
      </div>
    </article>
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

type AssetGroup = {
  label: string;
  count: number;
};

const divisionToOffice = (division: string | undefined | null) => {
  const d = (division || "").trim();
  if (!d) return "Unassigned";
  if (d === "Technical Management Service Division" || d === "Office of the Regional Director" || d === "Administrative and Finance Services Division") return "RO";
  if (d === "Quezon Provincial Office") return "QPO";
  if (d === "Rizal Community Service Center") return "rizalCSC";
  if (d === "Catanauan Community Service Center") return "catCSC";
  return d;
};

type InsightKey =
  | "type"
  | "status"
  | "location"
  | "assignment"
  | "usersByOffice"
  | "usersByDesignation"
  | "division";

function AssetInsightsSection() {
  const [insightKey, setInsightKey] = useState<InsightKey>("type");
  const [assetRows, setAssetRows] = useState<any[]>([]);
  const [userRows, setUserRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadGroups = async () => {
      setError(null);
      try {
        const [assetSnap, userSnap] = await Promise.all([
          getDocs(collection(db, "assets")),
          getDocs(collection(db, "users")),
        ]);

        if (alive) {
          setAssetRows(assetSnap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) })));
          setUserRows(userSnap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) })));
        }
      } catch (err) {
        console.error("AssetInsights: failed to load", err);
        if (alive) setError("Unable to load asset breakdown.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadGroups();
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(() => {
    const takeTop = (entries: Record<string, number>) =>
      Object.entries(entries)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    const countBy = <T,>(items: T[], keyFn: (item: T) => string) => {
      const counts: Record<string, number> = {};
      items.forEach((item) => {
        const key = keyFn(item) || "Unspecified";
        counts[key] = (counts[key] || 0) + 1;
      });
      return takeTop(counts);
    };

    switch (insightKey) {
      case "status":
        return countBy(assetRows, (a: any) => (a.status || "Unspecified").toString());
      case "location":
        return countBy(assetRows, (a: any) => (a.location || "Unassigned").toString());
      case "assignment":
        return countBy(assetRows, (a: any) => (a.assignedTo ? "Assigned" : "Unassigned"));
      case "usersByOffice":
        return countBy(userRows, (u: any) => divisionToOffice(u.division));
      case "usersByDesignation":
        return countBy(userRows, (u: any) => (u.designation || "Unspecified").toString());
      case "division":
        return countBy(userRows, (u: any) => (u.division || "Unspecified").toString());
      case "type":
      default:
        return countBy(assetRows, (a: any) => (a.typeOfEquipment || "Unspecified").toString());
    }
  }, [assetRows, userRows, insightKey]);

  const subtitleMap: Record<InsightKey, string> = {
    type: "Grouped by typeOfEquipment",
    status: "Grouped by status",
    location: "Assets grouped by location",
    assignment: "Assigned vs Unassigned",
    usersByOffice: "Employees grouped by office",
    usersByDesignation: "Employees grouped by designation",
    division: "Employees grouped by division",
  };

  const max = Math.max(...groups.map((g) => g.count), 1);

  if (loading) return <div className="insights-note">Loading insight data…</div>;
  if (error) return <div className="insights-note">{error}</div>;
  if (!groups.length) return <div className="insights-note">No data available yet.</div>;

  return (
    <div className="asset-insights">
      <div className="insights-header">
        <div>
          <p className="eyebrow">Insights</p>
          <h3 className="title">Top breakdowns</h3>
        </div>
        <div className="insights-controls">
          <label className="insights-select-label">
            View
            <select
              className="insights-select"
              value={insightKey}
              onChange={(e) => setInsightKey(e.target.value as InsightKey)}
            >
              <option value="type">Equipment type</option>
              <option value="status">Status</option>
              <option value="location">Location (assets)</option>
              <option value="assignment">Assigned vs Unassigned</option>
              <option value="usersByOffice">Employees by office</option>
              <option value="usersByDesignation">Employees by designation</option>
              <option value="division">Employees by division</option>
            </select>
          </label>
        </div>
      </div>
      <p className="insights-note">{subtitleMap[insightKey]}</p>

      <div className="bar-chart" role="img" aria-label="Top asset categories by count">
        {groups.map((g) => (
          <div key={g.label} className="bar-row">
            <span className="bar-label">{g.label}</span>
            <div className="bar-track">
              <div className="bar" style={{ width: `${Math.max((g.count / max) * 100, 6)}%` }} />
            </div>
            <span className="bar-value">{g.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsOverviewSection() {
  const [counts, setCounts] = useState<Record<MetricKey, number>>({ assets: 0, offices: 0, employees: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  const cardActions: Partial<Record<MetricKey, () => void>> = {
    assets: () => router.push("/assets"),
    employees: () => router.push("/users"),
  };

  return (
    <section className="stats-overview" aria-live="polite" aria-label="Dashboard totals">
      <div className="stats-grid">
        <ServerStatusCard />
        {metricEntries.map(([key, cfg]) => (
          <article
            key={key}
            className={`stat-card${cardActions[key] ? " stat-card--clickable" : ""}`}
            onClick={cardActions[key]}
            role={cardActions[key] ? "button" : undefined}
            tabIndex={cardActions[key] ? 0 : undefined}
          >
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
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [photoModal, setPhotoModal] = useState<{ url: string; zoom: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRandomAssets = async () => {
      try {
        const ref = collection(db, "assets");
        const snap = await getDocs(ref);
        const items: AssetRecord[] = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
        const withPhotos = items.filter((asset) => Array.isArray(asset.photoUrls) && asset.photoUrls.length > 0);
        const selectionSource = withPhotos.length ? withPhotos : items;
        // Randomize but keep every asset so the gallery lists them all.
        const randomized = shuffleArray(selectionSource);
        setAssets(randomized);

        const uids = Array.from(new Set(randomized.map((a) => a.assignedTo).filter((x): x is string => !!x)));
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
        console.error("Error fetching showcase assets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRandomAssets();
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

  if (loading) return <div>Loading featured assets...</div>;
  if (!assets.length) return <div>No assets available yet.</div>;

  return (
    <div className="latest-assets-container">
      <div className="assets-header">
        <p className="eyebrow">Asset Gallery</p>
        <h3 className="title">Swipe through random photo-ready assets</h3>
      </div>

      <div className="assets-carousel">
        <div className="assets-scroll">
          {assets.map((asset) => (
            <article key={asset.uid} className="asset-card">
              <header className="asset-card__header">
                <button className="asset-link" onClick={() => router.push(`/assets/${asset.uid}`)}>
                  {asset.description
                    ? (() => {
                        const words = asset.description.split(/\s+/);
                        return words.slice(0, 5).join(" ") + (words.length > 5 ? "…" : "");
                      })()
                    : asset.article || asset.uid}
                </button>
              </header>
              <dl className="asset-meta">
                <div>
                  <dt>Created</dt>
                  <dd>{asset.createdAt?.toDate().toLocaleDateString() || "—"}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{asset.typeOfEquipment || "—"}</dd>
                </div>
                <div>
                  <dt>Assigned</dt>
                  <dd>
                    {asset.assignedTo ? (
                      <button className="user-link" onClick={() => openUser(asset.assignedTo!)}>
                        {userNames[asset.assignedTo!] || asset.assignedTo}
                      </button>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
              {Array.isArray(asset.photoUrls) && asset.photoUrls.length > 0 && (
                <div className="photo-grid">
                  {asset.photoUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="asset"
                      className="photo"
                      onClick={() => setPhotoModal({ url, zoom: 1 })}
                    />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      {selectedUser && <UserModal user={selectedUser} onClose={closeUser} />}
      {photoModal && (
        <div className="modal-overlay" onClick={() => setPhotoModal(null)}>
          <div className="modal asset-photo-modal" onClick={(e) => e.stopPropagation()}>
            <header className="asset-photo-modal__header">
              <div className="asset-photo-modal__controls">
                <button
                  className="asset-photo-btn"
                  onClick={() => setPhotoModal((p) => (p ? { ...p, zoom: Math.min(p.zoom + 0.2, 4) } : p))}
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  className="asset-photo-btn"
                  onClick={() => setPhotoModal((p) => (p ? { ...p, zoom: Math.max(p.zoom - 0.2, 0.6) } : p))}
                  aria-label="Zoom out"
                >
                  −
                </button>
                <button
                  className="asset-photo-btn"
                  onClick={() => setPhotoModal((p) => (p ? { ...p, zoom: 1 } : p))}
                  aria-label="Reset zoom"
                >
                  100%
                </button>
              </div>
              <button className="modal-close" onClick={() => setPhotoModal(null)} aria-label="Close">
                ×
              </button>
            </header>
            <div className="asset-photo-viewport">
              <img
                src={photoModal.url}
                alt="asset full"
                className="asset-photo-full"
                style={{ transform: `scale(${photoModal.zoom})` }}
              />
            </div>
          </div>
        </div>
      )}
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
  const [users, setUsers] = useState<LatestUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [assetModal, setAssetModal] = useState<{ userLabel: string; assets: AssetRecord[] } | null>(null);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const ref = collection(db, "users");
        const snap = await getDocs(ref);
        const list: LatestUserRecord[] = snap.docs.map((docSnap) => ({ uid: docSnap.id, ...(docSnap.data() as any) }));
        const randomized = shuffleArray(list);
        setUsers(randomized.slice(0, USER_SHOWCASE_LIMIT));
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
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

  const viewAssignedAssets = async (uid: string) => {
    setAssetsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "assets"), where("assignedTo", "==", uid)));
      const assetsForUser: AssetRecord[] = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
      const name = users.find((u) => u.uid === uid)?.fullname || "Assigned assets";
      setAssetModal({ userLabel: name, assets: assetsForUser });
    } catch (err) {
      console.error("Error fetching assigned assets:", err);
      alert("Failed to load assigned assets. See console.");
    } finally {
      setAssetsLoading(false);
    }
  };

  const closeUser = () => setSelectedUser(null);

  if (loading) return <div>Loading spotlight users...</div>;
  if (!users.length) return <div>No users available yet.</div>;

  return (
    <div className="latest-user-container">
      <div className="users-header">
        <p className="eyebrow">People Spotlight</p>
        <div className="users-header__row">
          <h3 className="title">Meet spotlighted teammates</h3>        
        </div>
      </div>

      <div className="users-carousel">
        <div className="users-scroll">
          {users.map((user) => (
            <article key={user.uid} className="user-card">
              <header>
                <h4 className="user-card__name">{user.fullname || "Unnamed user"}</h4>
                <p className="user-card__role">{user.designation || "Role pending"}</p>
              </header>
              <dl className="user-card__meta">
                <div>
                  <dt>Division</dt>
                  <dd>{user.division || "—"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user.email || "—"}</dd>
                </div>
              </dl>
              <button
                className="user-card__cta user-card__cta--subtle"
                onClick={() => viewAssignedAssets(user.uid)}
                disabled={assetsLoading}
              >
                {assetsLoading ? "Loading assets..." : "View assigned assets"}
              </button>
            </article>
          ))}
        </div>
      </div>

      {selectedUser && <UserModal user={selectedUser} onClose={closeUser} />}
      {assetModal && (
        <div className="modal-overlay" onClick={() => setAssetModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAssetModal(null)} aria-label="Close">
              ×
            </button>
            <h3 className="modal-title">{assetModal.userLabel}</h3>
            {assetModal.assets.length === 0 ? (
              <p className="modal-note">No assets assigned.</p>
            ) : (
              <ul className="assigned-assets-list">
                {assetModal.assets.map((asset) => (
                  <li key={asset.uid} className="assigned-asset-item">
                    <button className="assigned-asset-button" onClick={() => router.push(`/assets/${asset.uid}`)}>
                      {asset.description || asset.article || asset.uid}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="dashboard-layout">
      <section className="dashboard-block dashboard-block--content" aria-label="Key counts">
        <StatsOverviewSection />
      </section>
      <section className="dashboard-block dashboard-block--content" aria-label="Asset insights">
        <AssetInsightsSection />
      </section>
      <section className="dashboard-block dashboard-block--row" aria-label="Latest activity">
        <div className="dashboard-row">
          <div className="dashboard-row__item">
            <LatestUserSection />
          </div>
          <div className="dashboard-row__item">
            <LatestAssetSection />
          </div>
        </div>
      </section>
    </div>
  );
}
