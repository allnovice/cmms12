"use client";

import { useState, useRef, useEffect } from "react";
import "./TemplateList.css";

interface TemplateListProps {
  forms: any[];
  onSelect: (form: any) => void;
}

export default function TemplateList({ forms, onSelect }: TemplateListProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [latestOnly, setLatestOnly] = useState(false); // toggle

  const ref = useRef<HTMLDivElement>(null);

  // --- Extract clean display name: "name_vN"
  const cleanName = (filename: string) => {
    return filename.replace("-form.xlsx", "");
  };

  // --- Compute latest version per base name
  const reduceLatestVersions = (allForms: any[]) => {
    const map = new Map<string, any>();

    allForms.forEach((f) => {
      const clean = cleanName(f.filename);
      const baseName = clean.split("_v")[0];
      const version = parseInt(clean.split("_v")[1] || "0", 10);

      const current = map.get(baseName);

      if (!current || version > current.version) {
        map.set(baseName, { ...f, version, display: clean });
      }
    });

    return Array.from(map.values());
  };

  // step 1: add display field to all
  const withDisplay = forms.map((f) => ({
    ...f,
    display: cleanName(f.filename),
  }));

  // step 2: filter based on toggle (latest only / all)
  const toFilter = latestOnly
    ? reduceLatestVersions(withDisplay)
    : withDisplay;

  // step 3: search filter
  const filtered = toFilter.filter((f) =>
    f.display.toLowerCase().includes(query.toLowerCase())
  );

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="template-dropdown-wrapper">
      
      <div className="template-input-wrapper">
        {/* Unified search/select input */}
        <input
          className="template-combined-input"
          placeholder="Search templates..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onClick={() => setOpen(true)}
        />

        {/* Capsule toggle (Latest only ON/OFF) */}
        <div
          className={`capsule-toggle ${latestOnly ? "on" : "off"}`}
          onClick={() => setLatestOnly((v) => !v)}
        >
          <div className="knob"></div>
        </div>
      </div>

      {open && (
        <div className="template-dropdown-panel">
          <div className="template-dropdown-list">
            {filtered.length === 0 && (
              <div className="template-no-results">No results</div>
            )}

            {filtered.map((f) => (
              <div
                key={f.filename}
                className="template-dropdown-item"
                onClick={() => {
                  onSelect(f);
                  setQuery(f.display);
                  setOpen(false);
                }}
              >
                {f.display}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
