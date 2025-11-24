"use client";

import { useState, useMemo } from "react";
import "./SubmissionsTable.css";
interface SubmissionsTableProps {
  submissions: any[];
  loading: boolean;
  onSelect: (submission: any) => void;
}

export default function SubmissionsTable({
  submissions,
  loading,
  onSelect,
}: SubmissionsTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"filename" | "filledBy" | "status" | "timestamp">(
    "timestamp"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // --- basic fuzzy match ---
  const fuzzy = (text: string, q: string) =>
    text.toLowerCase().includes(q.toLowerCase());

  // --- search + sort + latest 5 ---
  const filtered = useMemo(() => {
    let rows = submissions.filter((s) => {
      const name = s.filename?.split("_")[0] || "";
      const by = s.filledBy || "";
      return (
        fuzzy(name, search) ||
        fuzzy(by, search) ||
        fuzzy(s.status || "", search)
      );
    });

    rows = rows.sort((a, b) => {
      const A = a[sortField];
      const B = b[sortField];

      let valA = A?.toDate ? A.toDate() : A;
      let valB = B?.toDate ? B.toDate() : B;

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows.slice(0, 5);
  }, [submissions, search, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="subs-container">
      {/* 🔍 Search box */}
      <input
        className="subs-search"
        placeholder="Search submissions…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}
      <div className="subs-table-wrapper">
        <table className="subs-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("filename")}>Filename</th>
              <th onClick={() => toggleSort("filledBy")}>By</th>
              <th onClick={() => toggleSort("status")}>Status</th>
              <th onClick={() => toggleSort("timestamp")}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  No submissions
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} onClick={() => onSelect(s)}>
                  <td>{s.filename.split("_")[0]}</td>
                  <td>{s.filledBy || "?"}</td>
                  <td>{s.status || "pending"}</td>
                  <td>
                    {s.timestamp?.toDate
                      ? s.timestamp.toDate().toLocaleDateString()
                      : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
