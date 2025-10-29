"use client";

import { useState } from "react";
import DynamicFields from "./DynamicFields";
import ActionButtons from "./ActionButtons";

interface DynamicFormProps {
  user: any;
  selectedForm: any;
  placeholders: string[];
  formValues: Record<string, any>;
  loading: boolean;
  isReadOnly: boolean;
  handleChange: (field: string, value: string) => void;
  handleSubmit: () => void;
  SERVER_URL: string;

  visibleRow: number;
  maxRow: number;
  addRow: () => void;
}

export default function DynamicForm({
  user,
  selectedForm,
  placeholders,
  formValues,
  loading,
  isReadOnly,
  handleChange,
  handleSubmit,
  SERVER_URL,
  visibleRow,
  maxRow,
  addRow,
}: DynamicFormProps) {
  const [generating, setGenerating] = useState(false);

  // --- Validation helpers ---
  const mustSignBeforeSubmit = () => {
    const userLvl = user?.signatoryLevel || 0;
    const targetField = `signature${userLvl}`;
    return placeholders.includes(targetField) && !formValues[targetField];
  };

  const isNumberedRowsComplete = () =>
    placeholders
      .filter((p) => /\d+$/.test(p))
      .filter((p) => {
        const num = parseInt(p.match(/\d+$/)![0]);
        return num <= visibleRow;
      })
      .every((p) => !!formValues[p]);

  // --- Generate filled document ---
  const handleGenerate = async () => {
    if (!selectedForm) return;
    const idx = selectedForm.filename.indexOf(".xlsx");
    if (idx === -1) return alert("Invalid file name");

    const originalTemplate = selectedForm.filename.slice(0, idx + 5);
    setGenerating(true);

    try {
      const res = await fetch(`${SERVER_URL}/fill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: originalTemplate, data: formValues }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Generate failed:", text);
        alert("Failed to generate document");
        return;
      }

      const result = await res.json();
      const link = document.createElement("a");
      link.href = `${SERVER_URL}${result.url}`;
      link.download = result.url.split("/").pop();
      link.click();
    } catch (err) {
      console.error("Server unreachable or network error:", err);
      alert("Server is down or unreachable. Please try again later.");
    } finally {
      setGenerating(false);
    }
  };

  // --- Form submit handler ---
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mustSignBeforeSubmit()) return alert("Please add your signature before submitting.");
    if (!isNumberedRowsComplete()) return alert("Please fill all previous rows before submitting.");
    handleSubmit();
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        textAlign: "center",
        marginTop: 20,
      }}
    >
      <h3 style={{ flexBasis: "100%" }}>{selectedForm.filename}</h3>

      <DynamicFields
        user={user}
        placeholders={placeholders}
        formValues={formValues}
        isReadOnly={isReadOnly}
        selectedForm={selectedForm}
        visibleRow={visibleRow}
        handleChange={handleChange}
      />

      <ActionButtons
        addRow={addRow}
        visibleRow={visibleRow}
        maxRow={maxRow}
        loading={loading}
        generating={generating}
        isReadOnly={isReadOnly}
        selectedForm={selectedForm}
        onGenerate={handleGenerate}
      />
    </form>
  );
}
