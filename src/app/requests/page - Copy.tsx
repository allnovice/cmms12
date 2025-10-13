"use client";

//import { useUserData } from "./hooks/useUserData";
import { useFormHandler } from "./hooks/useFormHandler";
import { useForms } from "./hooks/useForms";
import { useSubmissions } from "./hooks/useSubmissions";
import { useAuth } from "@/context/AuthContext";

export default function RequestsPage() {
  const SERVER_URL = "http://192.168.100.13:3001";
  const { user } = useAuth();
  const forms = SERVER_URL ? useForms(SERVER_URL) : [];
  const { submissions, loading: loadingSubs } = useSubmissions();

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

  // --- Split logic ---
  const handleSelectTemplate = (form: any) => {
    handleSelect(form, false); // normal new fill
  };

  const handleSelectSubmission = (s: any) => {
    handleSelect(
      {
        ...s,
        id: s.id,
        url: null, // prevents Excel load attempt
        filledData: s.filledData,
      },
      s.status !== "pending" // readonly if already approved
    );
  };

const handleGenerate = async () => {
  if (!selectedForm) return;

  // extract original template name up to ".xlsx"
  const idx = selectedForm.filename.indexOf(".xlsx");
  if (idx === -1) return alert("Invalid file name");
  const originalTemplate = selectedForm.filename.slice(0, idx + 5); // include ".xlsx"

  try {
    const res = await fetch(`${SERVER_URL}/fill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: originalTemplate, // send correct template name
        data: formValues,
      }),
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
    console.error("Generate error:", err);
    alert("Failed to generate document");
  }
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
            handleSubmit();
          }}
        >
          <h3>{selectedForm.filename}</h3>
          {placeholders.map((p) => {
            const isSig = /^signature\d*$/i.test(p);
            if (isSig) {
              const lvl = parseInt(p.replace("signature", "")) || 1;
              const canSign = (user?.signatoryLevel || 0) >= lvl;
              const signed = !!formValues[p];
              const addSig = () => {
                if (!user?.signature) return alert("No signature found");
                handleChange(p, user.signature);
                alert(`Signature L${lvl} added`);
              };
              return (
                <div key={p}>
                  <label>{p}</label>
                  {canSign ? (
                    <button type="button" onClick={addSig} disabled={signed || isReadOnly}>
                      {signed ? `Signed (L${lvl})` : `Add Signature (L${lvl})`}
                    </button>
                  ) : (
                    <p>Requires level {lvl}</p>
                  )}
                </div>
              );
            }

            return (
              <div key={p}>
                <label>{p}</label>
                <input
                  value={formValues[p] ?? ""}
                  onChange={(e) => handleChange(p, e.target.value)}
                  readOnly={isReadOnly || (selectedForm?.status && selectedForm.status !== "pending")}
                />
              </div>
            );
          })}

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
              <tr
                key={s.id}
                style={{ cursor: "pointer" }}
                onClick={() => handleSelectSubmission(s)}
              >
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
