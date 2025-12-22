"use client";

import { useEffect, useState } from "react";
import AssetRow from "./AssetRow";
import { Asset, Office, User } from "@/types";

type Props = {
  assets: Asset[];
  offices: Office[];
  users: User[];
  columns: { key: string; label: string }[];
  highlightId?: string | null;
  updating: string | null;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: string) => void;
  onAssignUser: (assetId: string, uid: string) => void;
  onSetOffice: (assetId: string, officeId: string) => void;
  onSetStatus: (assetId: string, status: string) => void;
  isAdmin?: boolean;
};

export default function AssetsTable({
  assets,
  offices,
  users,
  columns,
  highlightId,
  updating,
  sortConfig,
  onSort,
  onAssignUser,
  onSetOffice,
  onSetStatus,
  isAdmin,
}: Props) {
  const [visibleColumns, setVisibleColumns] = useState<{ [key: string]: boolean }>({});

  // Load from localStorage or use columns when they become available
  useEffect(() => {
    if (!columns || columns.length === 0) return;
    const saved = localStorage.getItem("assetsVisibleColumns");
    if (saved) {
      setVisibleColumns(JSON.parse(saved));
    } else {
      // default all visible
      const defaults: { [key: string]: boolean } = {};
      columns.forEach((c) => (defaults[c.key] = true));
      setVisibleColumns(defaults);
    }
  }, [columns]);

  // Toggle column visibility
  const handleToggleColumn = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    localStorage.setItem("assetsVisibleColumns", JSON.stringify(updated));
  };

  const renderHeader = (label: string, key: string) =>
    visibleColumns[key] ? (
      <th style={{ cursor: "pointer" }} onClick={() => onSort(key)} key={key}>
        {label} {sortConfig?.key === key ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
      </th>
    ) : null;

  return (
    <>
      <table className="assets-table">
        <thead>
          <tr>
            <th>📍</th>
            {columns.map((c) => renderHeader(c.label, c.key))}
          </tr>
        </thead>

        <tbody>
          {assets.map((a) => (
            <AssetRow
              key={a.id}
              asset={a}
              offices={offices}
              users={users}
              columns={columns}
              highlight={highlightId === a.id}
              updating={updating === a.id}
              onAssignUser={onAssignUser}
              onSetOffice={onSetOffice}
              onSetStatus={onSetStatus}
              visibleColumns={visibleColumns}
              isAdmin={isAdmin}
            />
          ))}
        </tbody>
      </table>

      {/* Column Visibility Checkboxes */}
      <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {columns.map((c) => (
          <label key={c.key} style={{ fontSize: "0.9rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={!!visibleColumns[c.key]}
              onChange={() => handleToggleColumn(c.key)}
              style={{ marginRight: "4px" }}
            />
            {c.label}
          </label>
        ))}
      </div>
    </>
  );
}
