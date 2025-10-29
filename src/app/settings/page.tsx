"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import SignatureCanvas from "./components/SignatureCanvas";

type UserData = {
  email: string;
  fullname: string;
  designation: string;
  signature?: string;
  address?: string;
  contact?: string;
  employeeNumber?: string;
  division?: string;
};

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [fullname, setFullname] = useState("");
  const [designation, setDesignation] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [division, setDivision] = useState("");
  const [loading, setLoading] = useState(false);
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);

  // --- Fetch current user data ---
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const docRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as UserData;
        setUserData(data);
        setFullname(data.fullname || "");
        setDesignation(data.designation || "");
        setAddress(data.address || "");
        setContact(data.contact || "");
        setEmployeeNumber(data.employeeNumber || "");
        setDivision(data.division || "");
      }
    };
    fetchUser();
  }, []);

  // --- Save all settings ---
  const saveSettings = async () => {
    if (!fullname.trim() || !designation.trim()) {
      alert("Full Name and Designation are required.");
      return;
    }

    if (!auth.currentUser) return;
    setLoading(true);

    try {
      let sigUrl = userData?.signature;

      // Upload new signature if available
      if (signatureBlob) {
        const formData = new FormData();
        formData.append("file", signatureBlob);
        formData.append("uid", auth.currentUser.uid);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        sigUrl = data.secure_url;
      }

      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, {
        fullname,
        designation,
        address,
        contact,
        employeeNumber,
        division,
        signature: sigUrl,
      });

      setUserData((prev) => ({
        ...prev!,
        fullname,
        designation,
        address,
        contact,
        employeeNumber,
        division,
        signature: sigUrl,
      }));

      alert("Settings saved successfully!");
      setSignatureBlob(null); // reset after save
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  if (!userData) return <p>Loading user...</p>;

  return (
    <div className="settings-form">
      <h2>Settings</h2>

      <div>
        <label>Email (read-only)</label>
        <input type="text" value={userData.email} readOnly />
      </div>

      <div>
        <label>Full Name *</label>
        <input
          type="text"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Designation *</label>
        <input
          type="text"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div>
        <label>Contact</label>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>

      <div>
        <label>Employee Number</label>
        <input
          type="text"
          value={employeeNumber}
          onChange={(e) => setEmployeeNumber(e.target.value)}
        />
      </div>

      <div>
        <label>Division</label>
        <input
          type="text"
          value={division}
          onChange={(e) => setDivision(e.target.value)}
        />
      </div>

      <div>
        <label>Signature</label>
        <SignatureCanvas
          signatureUrl={userData.signature}
          onSave={(blob) => setSignatureBlob(blob)}
        />
      </div>

      <button onClick={saveSettings} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
