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

XLSX.utils.sheet_to_json(sheet, { header: 1 }).forEach((row: unknown) => {
  if (Array.isArray(row)) {
    row.forEach((cell) => {
      if (typeof cell === "string") {
        const matches = cell.match(/{{(.*?)}}/g);
        if (matches) {
          matches.forEach((m) => {
            const key = m.replace(/[{}]/g, "").trim();
            if (!values.includes(key)) values.push(key);
          });
        }
      }
    });
  }
});

        const initialValues: Record<string, string> = {};
        values.forEach((v) => (initialValues[v] = ""));
        setPlaceholders(values);
        setFormValues(initialValues);
      }

      // 🔹 CASE 2: Existing submission (no url, has filledData)
      else if (form.filledData) {
  // try to keep original placeholder order if available
  const orderedKeys =
    form.placeholders && Array.isArray(form.placeholders)
      ? form.placeholders
      : Object.keys(form.filledData);

  setPlaceholders(orderedKeys);
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
    const userUid = user.uid;
    const userLvl = (user as any)?.signatoryLevel || 0;
    const targetSig = `signature${userLvl}`;
    const userSig = (user as any)?.signature || userName;

    // ✅ Must have own signature (by UID inside URL)
    const hasOwnSignature = Object.entries(formValues).some(
      ([key, value]) =>
        key.toLowerCase().startsWith("signature") &&
        typeof value === "string" &&
        value.includes(userUid)
    );

    if (!hasOwnSignature) {
      alert("⚠️ You must add your signature before submitting.");
      setLoading(false);
      return;
    }

    // ✅ Prevent signing if this level is already signed by another user
    if (formValues[targetSig] && formValues[targetSig] !== userSig) {
      alert("⚠️ This document was already signed by another user at your level.");
      setLoading(false);
      return;
    }

    // ✅ Prevent editing if a *lower-level* signature already exists
    const lowerSigned = placeholders
      .filter((p) => /^signature\d*$/i.test(p))
      .some((p) => {
        const lvl = parseInt(p.replace(/\D/g, "")) || 0;
        return lvl < userLvl && !!formValues[p];
      });

    if (lowerSigned) {
      alert("⚠️ You cannot edit or overwrite a document already signed by a lower-level user.");
      setLoading(false);
      return;
    }

    // ✅ Check if all signatures complete
    const allSignaturesComplete = placeholders
      .filter((p) => /^signature\d*$/i.test(p))
      .every((p) => !!formValues[p]);

    const nextStatus = allSignaturesComplete ? "approved" : "pending";

    // 🔹 Update existing submission
    if (selectedForm?.id) {
      const ref = doc(db, "form_submissions", selectedForm.id);
      await updateDoc(ref, {
        filledData: formValues,
        status: nextStatus,
        timestamp: serverTimestamp(),
      });
      alert("✅ Document updated");
    } else {
      // 🔹 New submission
      const newDoc = await addDoc(collection(db, "form_submissions"), {
        filename: `${selectedForm.filename}_${userName}`,
        filledData: formValues,
        placeholders,
        filledBy: userName,
        status: nextStatus,
        timestamp: serverTimestamp(),
      });

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
