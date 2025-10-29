"use client";

import SignatureField from "./SignatureField";

interface DynamicFieldsProps {
  user: any;
  placeholders: string[];
  formValues: Record<string, any>;
  isReadOnly: boolean;
  selectedForm: any;
  visibleRow: number;
  handleChange: (field: string, value: string) => void;
}

export default function DynamicFields({
  user,
  placeholders,
  formValues,
  isReadOnly,
  selectedForm,
  visibleRow,
  handleChange,
}: DynamicFieldsProps) {
  return (
    <>
      {placeholders.map((p, i) => {
        if (p === "_break")
          return <div key={`break-${i}`} style={{ flexBasis: "100%", height: 0, margin: "12px 0" }} />;

        // --- Signature fields ---
        if (/^signature\d*$/i.test(p))
          return (
            <SignatureField
              key={p}
              name={p}
              user={user}
              formValues={formValues}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
            />
          );

        // --- Numbered placeholders ---
        const match = p.match(/(\d+)$/);
        const num = match ? parseInt(match[1]) : null;
        if (num && num > visibleRow && !formValues[p]) return null;

        return (
          <div key={p} style={{ margin: "8px", textAlign: "center" }}>
            <label>{p}</label>
            <br />
            <input
              style={{
                width: `${Math.max(p.length + 2, 5)}ch`,
                textAlign: "center",
                padding: "4px",
                border: "1px solid #aaa",
                borderRadius: "4px",
              }}
              value={formValues[p] ?? ""}
              onChange={(e) => handleChange(p, e.target.value)}
              readOnly={isReadOnly || (selectedForm?.status && selectedForm.status !== "pending")}
            />
          </div>
        );
      })}
    </>
  );
}
