"use client";

interface ActionButtonsProps {
  addRow: () => void;
  visibleRow: number;
  maxRow: number;
  loading: boolean;
  generating: boolean;
  isReadOnly: boolean;
  selectedForm: any;
  onGenerate: () => void;
}

export default function ActionButtons({
  addRow,
  visibleRow,
  maxRow,
  loading,
  generating,
  isReadOnly,
  selectedForm,
  onGenerate,
}: ActionButtonsProps) {
  return (
    <div
      style={{
        flexBasis: "100%",
        marginTop: 16,
        display: "flex",
        gap: "8px",
        justifyContent: "center",
      }}
    >
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

      <button type="button" onClick={onGenerate} disabled={loading || generating}>
        {generating ? "Generating..." : "Generate Document"}
      </button>
    </div>
  );
}
