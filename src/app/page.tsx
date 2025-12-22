"use client";

import { useEffect, useRef, useState } from "react";
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

const ASSET_SHOWCASE_LIMIT = 8;
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
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRandomAssets = async () => {
      try {
        const ref = collection(db, "assets");
        const q = query(ref, orderBy("createdAt", "desc"), limit(25));
        const snap = await getDocs(q);
        const items: AssetRecord[] = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
        const withPhotos = items.filter((asset) => Array.isArray(asset.photoUrls) && asset.photoUrls.length > 0);
        const selectionSource = withPhotos.length ? withPhotos : items;
        const showcase = shuffleArray(selectionSource).slice(0, ASSET_SHOWCASE_LIMIT);
        setAssets(showcase);

        const uids = Array.from(new Set(showcase.map((a) => a.assignedTo).filter((x): x is string => !!x)));
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

  useEffect(() => {
    const handleScrollState = () => {
      const node = scrollRef.current;
      if (!node) return;
      const { scrollLeft, scrollWidth, clientWidth } = node;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    };

    handleScrollState();
    const node = scrollRef.current;
    if (!node) return;
    node.addEventListener("scroll", handleScrollState, { passive: true });
    return () => node.removeEventListener("scroll", handleScrollState);
  }, [assets]);

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
        <button
          className="carousel-nav carousel-nav--left"
          onClick={() => scrollByCards("left")}
          disabled={!canScrollLeft}
          aria-label="Scroll assets left"
        >
          ‹
        </button>
        <div className="assets-scroll" ref={scrollRef}>
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
                    <img key={i} src={url} alt="asset" className="photo" />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
        <button
          className="carousel-nav carousel-nav--right"
          onClick={() => scrollByCards("right")}
          disabled={!canScrollRight}
          aria-label="Scroll assets right"
        >
          ›
        </button>
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
  const [users, setUsers] = useState<LatestUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cardWidthRef = useRef(0);
  const scrollToIndex = (targetIndex: number, behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined") return;
    const node = scrollRef.current;
    if (!node) return;

    let width = cardWidthRef.current;
    if (!width) {
      const firstCard = node.querySelector<HTMLElement>(".user-card");
      if (firstCard) {
        const styles = window.getComputedStyle(node);
        const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
        width = firstCard.offsetWidth + gap;
        cardWidthRef.current = width;
      } else {
        width = node.clientWidth;
      }
    }

    node.scrollTo({ left: width * targetIndex, behavior });
  };

  const handleNavigate = (direction: "left" | "right") => {
    if (!users.length) return;
    setActiveIndex((prev) => {
      const total = users.length;
      const next = direction === "right" ? (prev + 1) % total : (prev - 1 + total) % total;
      scrollToIndex(next);
      return next;
    });
  };

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

  useEffect(() => {
    if (!users.length || typeof window === "undefined") return;

    const measure = () => {
      const node = scrollRef.current;
      if (!node) return;
      const firstCard = node.querySelector<HTMLElement>(".user-card");
      if (!firstCard) return;
      const styles = window.getComputedStyle(node);
      const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
      cardWidthRef.current = firstCard.offsetWidth + gap;
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [users]);

  useEffect(() => {
    if (!users.length || typeof window === "undefined") return;
    const node = scrollRef.current;
    if (!node) return;

    let raf: number | null = null;
    const handleScroll = () => {
      if (!cardWidthRef.current || !users.length) return;
      if (raf) window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const idx = Math.round(node.scrollLeft / cardWidthRef.current);
        const normalized = ((idx % users.length) + users.length) % users.length;
        setActiveIndex(normalized);
      });
    };

    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      node.removeEventListener("scroll", handleScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [users]);

  useEffect(() => {
    if (!users.length) return;
    scrollToIndex(0, "auto");
    setActiveIndex(0);
  }, [users]);

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

  if (loading) return <div>Loading spotlight users...</div>;
  if (!users.length) return <div>No users available yet.</div>;

  return (
    <div className="latest-user-container">
      <div className="users-header">
        <p className="eyebrow">People Spotlight</p>
        <div className="users-header__row">
          <h3 className="title">Meet spotlighted teammates</h3>
          <div className="users-controls">
            <button className="carousel-nav" onClick={() => handleNavigate("left")} aria-label="Show previous teammate">
              ‹
            </button>
            <button className="carousel-nav" onClick={() => handleNavigate("right")} aria-label="Show next teammate">
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="users-carousel">
        <button
          className="carousel-nav carousel-nav--left"
          onClick={() => handleNavigate("left")}
          aria-label="Scroll users left"
        >
          ‹
        </button>
        <div className="users-scroll" ref={scrollRef}>
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
                <div>
                  <dt>Added</dt>
                  <dd>{user.createdAt?.toDate().toLocaleDateString() || "—"}</dd>
                </div>
              </dl>
              <button className="user-card__cta" onClick={() => openUser(user.uid)}>
                View profile
              </button>
            </article>
          ))}
        </div>
        <button
          className="carousel-nav carousel-nav--right"
          onClick={() => handleNavigate("right")}
          aria-label="Scroll users right"
        >
          ›
        </button>
      </div>

      {selectedUser && <UserModal user={selectedUser} onClose={closeUser} />}
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
