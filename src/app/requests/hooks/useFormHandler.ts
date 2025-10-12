// src/app/requests/hooks/useFormHandler.ts
import { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { auth, db } from "@/firebase";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

export function useFormHandler(serverUrl: string) {
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  const handleSelect = async (form: any, readonly = false) => {
    setSelectedForm(form);
    setIsReadOnly(!!readonly);
    setPlaceholders([]);
    setFormValues({});
    setLoading(true);

    try {
      // 🔹 CASE 1: Template (has .url)
      if (form.url) {
        const res = await axios.get(form.url, { responseType: "arraybuffer" });
        const workbook = XLSX.read(res.data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const values: string[] = [];

        XLSX.utils.sheet_to_json(sheet, { header: 1 }).forEach((row: any[]) =>
          row.forEach((cell: any) => {
            if (typeof cell === "string") {
              const matches = cell.match(/{{(.*?)}}/g);
              if (matches) {
                matches.forEach((m) => {
                  const key = m.replace(/[{}]/g, "").trim();
                  if (!values.includes(key)) values.push(key);
                });
              }
            }
          })
        );

        const initialValues: Record<string, string> = {};
        values.forEach((v) => (initialValues[v] = ""));
        setPlaceholders(values);
        setFormValues(initialValues);
      }

      // 🔹 CASE 2: Existing submission (no url, has filledData)
      else if (form.filledData) {
        const keys = Object.keys(form.filledData);
        setPlaceholders(keys);
        setFormValues(form.filledData);
      }

      else {
        throw new Error("Invalid form selection — no URL or data found");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Failed to load form. Check if template URL or submission data exists.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, val: string) =>
    setFormValues((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
  if (!selectedForm || !auth.currentUser) return;
  setLoading(true);

  try {
    const user = auth.currentUser;
    const userName = user.displayName || user.email?.split("@")[0] || "user";

    // 🔹 Determine if any signature field is filled
    const hasSignature = Object.keys(formValues).some(
      (key) => key.toLowerCase().startsWith("signature") && formValues[key]
    );
    const nextStatus = hasSignature ? "approved" : "pending";

    // 🔹 Update existing submission (if editing and still pending)
    if (selectedForm?.id) {
      const ref = doc(db, "form_submissions", selectedForm.id);
      await updateDoc(ref, {
        filledData: formValues,
        status: nextStatus,
        timestamp: serverTimestamp(),
      });
      alert("✅ Document updated");
    }

    // 🔹 New submission
    else {
      const newDoc = await addDoc(collection(db, "form_submissions"), {
        filename: `${selectedForm.filename}_${userName}`,
        filledData: formValues,
        filledBy: userName,
        status: nextStatus,
        timestamp: serverTimestamp(),
      });

      // attach docId and make filename more trackable
      await updateDoc(doc(db, "form_submissions", newDoc.id), {
        docId: newDoc.id,
        filename: `${selectedForm.filename}_${userName}_${newDoc.id}`,
      });

      alert("✅ New document submitted");
    }

    // 🔹 Reset UI
    setSelectedForm(null);
    setFormValues({});
    setPlaceholders([]);
    setIsReadOnly(false);
  } catch (err) {
    console.error(err);
    alert("❌ Failed to submit");
  } finally {
    setLoading(false);
  }
};

  return {
    selectedForm,
    placeholders,
    formValues,
    loading,
    isReadOnly,
    handleSelect,
    handleChange,
    handleSubmit,
    setFormValues,
  };
}
