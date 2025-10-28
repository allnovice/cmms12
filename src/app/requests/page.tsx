"use client";

import { useFormHandler } from "./hooks/useFormHandler";
import { useForms } from "./hooks/useForms";
import { useSubmissions } from "./hooks/useSubmissions";
import { useAuth } from "@/context/AuthContext";
import "./RequestsPage.css";
import { useState } from "react";

export default function RequestsPage() {
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
  const { user } = useAuth();
  const forms = useForms(SERVER_URL);
  const { submissions, loading: loadingSubs } = useSubmissions();

  const [visibleRow, setVisibleRow] = useState(1);
  const maxRow = 7;

  const addRow = () => {
    if (visibleRow < maxRow) setVisibleRow(visibleRow + 1);
  };

  const {
    selectedForm,
    placeholders,
    formValues,
    loading,
    isReadOnly,
    handleSelect,
    handleChange,
    handleSubmit,
  } = useFormHandler(SERVER_URL);

  const handleSelectTemplate = (form: any) => handleSelect(form, false);
  const handleSelectSubmission = (s: any) =>
    handleSelect({ ...s, id: s.id, url: null, filledData: s.filledData }, s.status !== "pending");

  const handleGenerate = async () => {
    if (!selectedForm) return;

    const idx = selectedForm.filename.indexOf(".xlsx");
    if (idx === -1) return alert("Invalid file name");
    const originalTemplate = selectedForm.filename.slice(0, idx + 5);

    try {
      const res = await fetch(`${SERVER_URL}/fill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: originalTemplate, data: formValues }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Generate failed:", text);
        return alert("Failed to generate document");
      }

      const result = await res.json();
      const link = document.createElement("a");
      link.href = `${SERVER_URL}${result.url}`;
      link.download = result.url.split("/").pop();
      link.click();
    } catch (err) {
      console.error("Server unreachable or network error:", err);
      alert("Server is down or unreachable. Please try again later.");
    }
  };

  // Check if user has added signature before submit
  const mustSignBeforeSubmit = () => {
    const userLvl = user?.signatoryLevel || 0;
    const targetField = `signature${userLvl}`;
    return placeholders.includes(targetField) && !formValues[targetField];
  };

  // Check sequential completeness of numbered placeholders
  const isNumberedRowsComplete = () => {
  return placeholders
    .filter((p) => /\d+$/.test(p))        // only numbered placeholders
    .filter((p) => {
      const num = parseInt(p.match(/\d+$/)![0]);
      return num <= visibleRow;           // only up to visibleRow
    })
    .every((p) => !!formValues[p]);       // all must be filled
};

  return (
    <div>
      <h2>Templates</h2>
      {forms.map((f) => (
        <div key={f.filename}>
          <span>{f.filename}</span>
          <button onClick={() => handleSelectTemplate(f)}>Select</button>
        </div>
      ))}

      {selectedForm && placeholders.length > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (mustSignBeforeSubmit()) return alert("Please add your signature before submitting.");
            if (!isNumberedRowsComplete()) return alert("Please fill all previous rows before submitting.");
            handleSubmit();
          }}
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", textAlign: "center", marginTop: 20 }}
        >
          <h3 style={{ flexBasis: "100%" }}>{selectedForm.filename}</h3>

          {placeholders.map((p, i) => {
            if (p === "_break")
              return <div key={`break-${i}`} style={{ flexBasis: "100%", height: 0, margin: "12px 0" }} />;

            const isSig = /^signature\d*$/i.test(p);

            if (isSig) {
              const lvl = parseInt(p.replace("signature", "")) || 1;
              const canSign = (user?.signatoryLevel || 0) >= lvl;
              const signed = !!formValues[p];

              return (
                <div key={p} style={{ margin: "8px", textAlign: "center" }}>
                  <label>{`Signature ${lvl}`}</label>
                  <br />
                  {canSign ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!user?.signature) return alert("No signature found");
                        handleChange(p, user.signature);
                        alert(`Signature L${lvl} added`);
                      }}
                      disabled={signed || isReadOnly}
                    >
                      {signed ? `Signed (L${lvl})` : `Add Signature (L${lvl})`}
                    </button>
                  ) : (
                    <p>Requires level {lvl}</p>
                  )}
                </div>
              );
            }

            // Determine placeholder number
            const match = p.match(/(\d+)$/);
            const placeholderNumber = match ? parseInt(match[1]) : null;

            // Show if:
            // 1. Not numbered
            // 2. Within visible rows
            // 3. Already has data (even beyond visibleRow)
            if (placeholderNumber && placeholderNumber > visibleRow && !formValues[p]) return null;

            const width = Math.max(p.length + 2, 5);

            return (
              <div key={p} style={{ display: "inline-block", margin: "8px", textAlign: "center" }}>
                <label>{p}</label>
                <br />
                <input
                  style={{ width: `${width}ch`, textAlign: "center", padding: "4px", border: "1px solid #aaa", borderRadius: "4px" }}
                  value={formValues[p] ?? ""}
                  onChange={(e) => handleChange(p, e.target.value)}
                  readOnly={isReadOnly || (selectedForm?.status && selectedForm.status !== "pending")}
                />
              </div>
            );
          })}

          <div style={{ flexBasis: "100%", marginTop: 16, display: "flex", gap: "8px", justifyContent: "center" }}>
            <button type="button" onClick={addRow} disabled={visibleRow >= maxRow}>
              + Add Row
            </button>
            <button
              type="submit"
              disabled={loading || isReadOnly || (selectedForm?.status && selectedForm.status !== "pending")}
            >
              {isReadOnly || (selectedForm?.status && selectedForm.status !== "pending")
                ? "Locked"
                : loading
                ? "Saving..."
                : "Submit"}
            </button>
            <button type="button" onClick={handleGenerate} disabled={loading}>
              Generate Document
            </button>
          </div>
        </form>
      )}

      <h2>Submissions</h2>
      {loadingSubs ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Filename</th>
              <th>By</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => handleSelectSubmission(s)}>
                <td>{s.filename.split("_")[0]}</td>
                <td>{s.filledBy || "?"}</td>
                <td>{s.status || "pending"}</td>
                <td>{s.timestamp?.toDate ? s.timestamp.toDate().toLocaleString() : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
