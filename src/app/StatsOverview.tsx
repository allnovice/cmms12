"use client";

import { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/firebase";

import "./StatsOverview.css";

type MetricKey = "assets" | "offices" | "employees";

type MetricConfig = {
  label: string;
  collection: string;
  hint: string;
};

type MetricCounts = Record<MetricKey, number>;

const metricConfig: Record<MetricKey, MetricConfig> = {
  assets: {
    label: "Assets",
    collection: "assets",
    hint: "Tracked items",
  },
  offices: {
    label: "Offices",
    collection: "locations",
    hint: "Active sites",
  },
  employees: {
    label: "Employees",
    collection: "users",
    hint: "People onboard",
  },
};

const metricEntries = Object.entries(metricConfig) as [MetricKey, MetricConfig][];

const defaultCounts: MetricCounts = {
  assets: 0,
  offices: 0,
  employees: 0,
};

export default function StatsOverview() {
  const [counts, setCounts] = useState<MetricCounts>(defaultCounts);
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

        if (alive) {
          setCounts(Object.fromEntries(values) as MetricCounts);
        }
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
