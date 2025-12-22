"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Asset, Office, User } from "@/types";
import LocateButton from "./LocateButton";
import UserSelect from "./UserSelect";
import OfficeSelect from "./OfficeSelect";

type Props = {
  asset: Asset;
  offices: Office[];
  users: User[];
  columns: { key: string; label: string }[];
  highlight: boolean;
  updating: boolean;
  visibleColumns: { [key: string]: boolean };
  onAssignUser: (assetId: string, uid: string) => void;
  onSetOffice: (assetId: string, officeId: string) => void;
  onSetStatus: (assetId: string, status: string) => void;
  isAdmin?: boolean;
};

export default function AssetRow({
  asset,
  offices,
  users,
  columns,
  highlight,
  updating,
  visibleColumns,
  onAssignUser,
  onSetOffice,
  onSetStatus,
  isAdmin,
}: Props) {
  const router = useRouter();
  const STATUS_OPTIONS = [
    { value: "serviceable", label: "Serviceable" },
    { value: "unserviceable", label: "Unserviceable" },
    { value: "disposed", label: "Disposed" },
    { value: "for disposal", label: "For Disposal" },
    { value: "unlocated", label: "Unlocated" },
  ];

  const renderCell = (key: string) => {
    // Special handling for known fields
    if (key === "article") {
      return (
        <td>
          <button className="asset-link" onClick={() => router.push(`/assets/${asset.id}`)}>
            {asset.article || "-"}
          </button>
        </td>
      );
    }

    if (key === "assignedTo") {
      return (
        <td>
          <UserSelect
            value={asset.assignedTo || ""}
            users={users}
            onChange={(uid) => onAssignUser(asset.id, uid)}
            disabled={updating || !isAdmin}
          />
        </td>
      );
    }

    if (key === "location" || key === "office") {
      return (
        <td>
          <OfficeSelect
            value={offices.find((o) => o.name === asset.location)?.id || ""}
            offices={offices}
            onChange={(officeId) => onSetOffice(asset.id, officeId)}
            disabled={updating || !isAdmin}
          />
        </td>
      );
    }

    if (key === "acquisitionDate") {
      return (
        <td>
          {asset.acquisitionDate
            ? new Date(asset.acquisitionDate.seconds * 1000).toLocaleDateString()
            : "-"}
        </td>
      );
    }

    if (key === "status") {
      return (
        <td>
          <select
            className="asset-status-select"
            value={(asset.status as string) || ""}
            onChange={(e) => onSetStatus(asset.id, e.target.value)}
            disabled={updating || !isAdmin}
          >
            <option value="">Select status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </td>
      );
    }

    // Default: stringify primitive values
    const val = (asset as any)[key];
    return <td>{val === undefined || val === null ? "-" : String(val)}</td>;
  };

  return (
    <tr className={highlight ? "highlighted" : ""}>
      <td className="text-center">
        <LocateButton asset={asset} />
      </td>

      {columns.map((c) => (visibleColumns[c.key] ? <React.Fragment key={c.key}>{renderCell(c.key)}</React.Fragment> : null))}
    </tr>
  );
}
