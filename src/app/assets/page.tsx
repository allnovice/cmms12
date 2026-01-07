"use client";

import AssetsTable from "./components/AssetsTable";
import useAssets from "./hooks/useAssets";
import useSorting from "./hooks/useSorting";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AssetsPage() {
  const { assets, offices, users, updating, handleAssignUser, handleSetOffice, handleSetStatus, columns } = useAssets();
  const { sortedItems, sortConfig, handleSort } = useSorting(assets);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (!assets.length) return <p className="loading-text">Loading assets...</p>;

  return (
    <div className="assets-page">
      <AssetsTable
        assets={sortedItems}
        columns={columns}
        highlightId={highlightId}
        sortConfig={sortConfig}
        onSort={handleSort}
        offices={offices}
        users={users}
        updating={updating}
        onAssignUser={handleAssignUser}
        onSetOffice={handleSetOffice}
        onSetStatus={handleSetStatus}
        isAdmin={isAdmin}
      />
    </div>
  );
}
