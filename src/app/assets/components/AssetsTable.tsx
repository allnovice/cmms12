"use client";

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
  const renderHeader = (label: string, key: string) => (
    <th
      style={{ cursor: "pointer" }}
      onClick={() => onSort(key)}
    >
      {label} {sortConfig?.key === key ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
    </th>
  );

  return (
    <table className="users-table">
      <thead>
        <tr>
          <th>📍</th>
          {renderHeader("Article", "article")}
          {renderHeader("Type", "typeOfEquipment")}
          {renderHeader("Description", "description")}
          {renderHeader("Property #", "propertyNumber")}
          {renderHeader("Serial #", "serialNumber")}
          {renderHeader("Acq. Date", "acquisitionDate")}
          {renderHeader("Acq. Value", "acquisitionValue")}
          <th>Assigned To</th>
          <th>Office</th>
        </tr>
      </thead>

      <tbody>
        {assets.map((a) => (
          <AssetRow
            key={a.id}
            asset={a}
            offices={offices}
            users={users}
            highlight={highlightId === a.id}
            updating={updating === a.id}
            onAssignUser={onAssignUser}
            onSetOffice={onSetOffice}
          />
        ))}
      </tbody>
    </table>
  );
}
