"use client";

import AssetsTable from "./components/AssetsTable";
import useAssets from "./hooks/useAssets";
import useSorting from "./hooks/useSorting";
import { useSearchParams } from "next/navigation";

export default function AssetsPage() {
  const { assets, offices, users, updating, handleAssignUser, handleSetOffice } = useAssets();
  const { sortedItems, sortConfig, handleSort } = useSorting(assets);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  if (!assets.length) return <p className="loading-text">Loading assets...</p>;

  return (
    <div className="table-wrapper">
      <AssetsTable
        assets={sortedItems}
        highlightId={highlightId}
        sortConfig={sortConfig}
        onSort={handleSort}
        offices={offices}
        users={users}
        updating={updating}
        onAssignUser={handleAssignUser}
        onSetOffice={handleSetOffice}
      />
    </div>
  );
}
