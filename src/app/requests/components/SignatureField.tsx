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
  const canSign = (user?.signatoryLevel || 0) >= level;
  const signed = !!formValues[name];

  const addSignature = () => {
    if (!user?.signature) return alert("No signature found");
    if (signed) return;

    // 1️⃣ Add signature
    handleChange(name, user.signature);

    // 2️⃣ Auto-fill name and designation for the same level
    const nameField = `name${level}l`;
    const designationField = `designation${level}l`;

    handleChange(nameField, user.fullname);
    handleChange(designationField, user.designation);

    alert(`Signature L${level} added. Name & designation auto-filled.`);
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
