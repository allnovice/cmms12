"use client";

import { useState, useMemo } from "react";
import { Asset } from "@/types";

type SortConfig = { key: string; direction: "asc" | "desc" };

export default function useSorting(items: Asset[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;
    return [...items].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [items, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };

  return { sortedItems, sortConfig, handleSort };
}
