"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

type User = Record<string, any>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [visibleCols, setVisibleCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(data);

        // collect all unique field names
        const keys = new Set<string>();
        data.forEach((item) => Object.keys(item).forEach((k) => keys.add(k)));
        const cols = Array.from(keys);
        setColumns(cols);
        setVisibleCols(cols); // show all columns
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleColumn = (col: string) => {
    setVisibleCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = a[key] ?? "";
    const valB = b[key] ?? "";
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="p-4">
      {/* Column selector */}
      <div className="mb-4 flex flex-wrap gap-3">
        {columns.map((col) => (
          <label key={col} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={visibleCols.includes(col)}
              onChange={() => handleToggleColumn(col)}
            />
            {col}
          </label>
        ))}
      </div>

      {/* Scrollable table with sticky header */}
      <div
        className="border border-gray-300 rounded"
        style={{ maxHeight: "200px", overflowY: "auto" }} // about 5 rows visible
      >
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {visibleCols.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="border p-2 cursor-pointer hover:bg-gray-200"
                >
                  {col}
                  {sortConfig?.key === col
                    ? sortConfig.direction === "asc"
                      ? " ▲"
                      : " ▼"
                    : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u, i) => (
              <tr key={i}>
                {visibleCols.map((col) => (
                  <td key={col} className="border p-2">
                    {String(u[col] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
