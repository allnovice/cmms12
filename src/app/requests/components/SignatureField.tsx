"use client";

interface SignatureFieldProps {
  name: string; // e.g., "signature1"
  user: {
    fullname: string;
    designation: string;
    signature?: string;
    signatoryLevel?: number;
  };
  formValues: Record<string, any>;
  handleChange: (field: string, value: string) => void;
  isReadOnly: boolean;
}

export default function SignatureField({
  name,
  user,
  formValues,
  handleChange,
  isReadOnly,
}: SignatureFieldProps) {
  const level = parseInt(name.replace("signature", "")) || 1;
  const canSign = Number(user?.signatoryLevel) === level;
  const signed = !!formValues[name];

  const addSignature = () => {
  if (!user?.signature) return alert("No signature found");
  if (signed) return;

  const now = new Date().toLocaleDateString(); // or use toISOString() if preferred

  // 1️⃣ Add signature
  handleChange(name, user.signature);

  // 2️⃣ Auto-fill name and designation for the same level
  const nameField = `name${level}:`;
  const designationField = `designation${level}:`;
  handleChange(nameField, user.fullname);
  handleChange(designationField, user.designation);

  // 3️⃣ Auto-fill date field
  const dateField = `date${level}:`;
  handleChange(dateField, now);

  alert(`Signature L${level} added. Name, designation & date auto-filled.`);
};

  return (
    <div style={{ margin: "8px", textAlign: "center" }}>
      <label>{`Signature ${level}`}</label>
      <br />
      {canSign ? (
        <button
          type="button"
          onClick={addSignature}
          disabled={signed || isReadOnly}
        >
          {signed ? `Signed (L${level})` : `Add Signature (L${level})`}
        </button>
      ) : (
        <p>Requires level {level}</p>
      )}
    </div>
  );
}
