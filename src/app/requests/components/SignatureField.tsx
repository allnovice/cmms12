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

    const now = new Date().toLocaleDateString();

    // Add signature
    handleChange(name, user.signature);

    // Auto-fill name and designation
    handleChange(`name${level}:`, user.fullname);
    handleChange(`designation${level}:`, user.designation);

    // Auto-fill date
    handleChange(`date${level}:`, now);

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
      ) : signed ? (
        <p>Signed by level {level}</p>
      ) : (
        <p>Requires level {level}</p>
      )}
    </div>
  );
}
