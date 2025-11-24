// src/app/requests/hooks/useFormHandler.ts
import { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { auth, db } from "@/firebase";
import {
  getDocs,
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext"; // optional if you want fallback inside hook

export function useFormHandler(serverUrl: string, user: any) {
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
    if (form.url) {
      // 🔹 Fetch XLSX template
      const res = await axios.get(form.url, { responseType: "arraybuffer" });
      const workbook = XLSX.read(res.data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const values: string[] = [];

      // Extract placeholders
      XLSX.utils.sheet_to_json(sheet, { header: 1 }).forEach((row: unknown) => {
        if (Array.isArray(row)) {
          row.forEach((cell) => {
            if (typeof cell === "string") {
              const matches = cell.match(/{{(.*?)}}/g);
              if (matches) {
                matches.forEach((m) => {
                  const key = m.replace(/[{}]/g, "").trim();
                  if (key === "_break" || !values.includes(key)) values.push(key);
                });
              }
            }
          });
        }
      });

      // 🔹 Fetch all users from Firestore
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as any) }));

      // 🔹 Get current logged-in user info
      const currentUser = users.find(u => u.uid === user?.uid);
      const currentLevel = currentUser ? parseInt(currentUser.signatoryLevel, 10) : 0;
      const currentFullname = currentUser?.fullname || "";

      // 🔹 Initialize form values
      const initialValues: Record<string, string> = {};
for (const v of values) {
  const nameMatch = v.match(/^name(\d+):$/);
  const desigMatch = v.match(/^designation(\d+):$/);

  if (nameMatch) {
    const level = parseInt(nameMatch[1], 10);
    // Only auto-fill if placeholder matches current user's level
    initialValues[v] = level === currentLevel ? currentFullname : "";
  } else if (desigMatch) {
    const level = parseInt(desigMatch[1], 10);
    // Auto-fill designation for current user's level
    initialValues[v] = level === currentLevel ? currentUser?.designation || "" : "";
  } else {
    initialValues[v] = "";
  }
}
      setPlaceholders(values);
      setFormValues(initialValues);
    }

    // 🔹 Existing submission
    else if (form.filledData) {
      const orderedKeys =
        form.placeholders && Array.isArray(form.placeholders)
          ? form.placeholders
          : Object.keys(form.filledData);

      setPlaceholders(orderedKeys);
      setFormValues(form.filledData);
    } else {
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
      const userName = user?.displayName || user.email?.split("@")[0] || "user";
      const userUid = user.uid;
      const userLvl = parseInt(user?.signatoryLevel || 0, 10);
      const targetSig = `signature${userLvl}`;
      const userSig = (user as any)?.signature || userName;

      // Must have own signature
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

      // Prevent signing if this level is already signed by another user
      if (formValues[targetSig] && formValues[targetSig] !== userSig) {
        alert("⚠️ This document was already signed by another user at your level.");
        setLoading(false);
        return;
      }

      // Check if all signatures complete
      const allSignaturesComplete = placeholders
        .filter((p) => /^signature\d*$/i.test(p))
        .every((p) => !!formValues[p]);

      const nextStatus = allSignaturesComplete ? "approved" : "pending";

      if (selectedForm?.id) {
        const ref = doc(db, "form_submissions", selectedForm.id);
        await updateDoc(ref, {
          filledData: formValues,
          status: nextStatus,
          timestamp: serverTimestamp(),
        });
        alert("✅ Document updated");
      } else {
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
