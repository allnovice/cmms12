"use client";

import { useEffect, useState } from "react";
import AssetRow from "./AssetRow";
import { Asset, Office, User } from "@/types";
import "../AssetsTable.css";

type Props = {
  assets: Asset[];
  offices: Office[];
  users: User[];
  highlightId?: string | null;
  updating: string | null;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: string) => void;
  onAssignUser: (assetId: string, uid: string) => void;
  onSetOffice: (assetId: string, officeId: string) => void;
};

const ALL_COLUMNS = [
  { key: "article", label: "Article" },
  { key: "typeOfEquipment", label: "Type" },
  { key: "description", label: "Description" },
  { key: "propertyNumber", label: "Property #" },
  { key: "serialNumber", label: "Serial #" },
  { key: "acquisitionDate", label: "Acq. Date" },
  { key: "acquisitionValue", label: "Acq. Value" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "office", label: "Office" },
];

export default function AssetsTable({
  assets,
  offices,
  users,
  highlightId,
  updating,
  sortConfig,
  onSort,
  onAssignUser,
  onSetOffice,
}: Props) {
  const [visibleColumns, setVisibleColumns] = useState<{ [key: string]: boolean }>({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("assetsVisibleColumns");
    if (saved) {
      setVisibleColumns(JSON.parse(saved));
    } else {
      // default all visible
      const defaults: { [key: string]: boolean } = {};
      ALL_COLUMNS.forEach(c => (defaults[c.key] = true));
      setVisibleColumns(defaults);
    }
  }, []);

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
      <table className="users-table">
        <thead>
          <tr>
            <th>📍</th>
            {ALL_COLUMNS.map(c => renderHeader(c.label, c.key))}
          </tr>
        </thead>

        <tbody>
          {assets.map(a => (
            <AssetRow
              key={a.id}
              asset={a}
              offices={offices}
              users={users}
              highlight={highlightId === a.id}
              updating={updating === a.id}
              onAssignUser={onAssignUser}
              onSetOffice={onSetOffice}
              visibleColumns={visibleColumns}
            />
          ))}
        </tbody>
      </table>

      {/* Column Visibility Checkboxes */}
      <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {ALL_COLUMNS.map(c => (
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
