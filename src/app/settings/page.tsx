"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import SignatureCanvas from "./components/SignatureCanvas";
import "./page.css";

type UserData = {
  email: string;
  fullname: string;
  designation: string;
  signature?: string;
  address?: string;
  contact?: string;
  employeeNumber?: string;
  division?: string;
  pinColor?: string;
};

type OfficeLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [fullname, setFullname] = useState("");
  const [designation, setDesignation] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [division, setDivision] = useState("");
  const [pinColor, setPinColor] = useState("#0000ff");
  const [loading, setLoading] = useState(false);
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);
  
  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [officeName, setOfficeName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [divisionsOptions, setDivisionsOptions] = useState<string[]>([]);
  const [designationsOptions, setDesignationsOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchDivisions = async () => {
      const docRef = doc(db, "divisions", "allOptions");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setDivisionsOptions(data.options || []);
      }
    };
    fetchDivisions();
  }, []);

  useEffect(() => {
    const fetchDesignations = async () => {
      const docRef = doc(db, "designations", "allOptions");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setDesignationsOptions(data.options || []);
      }
    };
    fetchDesignations();
  }, []);

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
        setPinColor(data.pinColor || "#0000ff");
      }
    };
    fetchUser();
  }, []);

  const saveSettings = async () => {
    if (!fullname.trim() || !designation.trim()) {
      alert("Full Name and Designation are required.");
      return;
    }
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      let sigUrl = userData?.signature;

      if (signatureBlob) {
        const formData = new FormData();
        formData.append("file", signatureBlob);
        formData.append("uid", auth.currentUser.uid);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
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
        pinColor,
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
        pinColor,
      }));

      alert("Settings saved successfully!");
      setSignatureBlob(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  if (!userData) return <p>Loading user...</p>;

  return (
  <div>
    <div>{userData.email}</div>

    <div>
      <input
        type="text"
        placeholder="Full Name *"
        value={fullname}
        onChange={(e) => setFullname(e.target.value)}
      />
    </div>

    <div>
      <select value={designation} onChange={(e) => setDesignation(e.target.value)}>
        <option value="">Select Designation</option>
        {designationsOptions.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>

    <div>
      <input
        type="text"
        placeholder="Employee Number"
        value={employeeNumber}
        onChange={(e) => setEmployeeNumber(e.target.value)}
      />
    </div>

    <div>
      <select value={division} onChange={(e) => setDivision(e.target.value)}>
        <option value="">Select Division</option>
        {divisionsOptions.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>

    <div>
      <input
        type="color"
        value={pinColor}
        onChange={(e) => setPinColor(e.target.value)}
      />
    </div>

    <div>
      <SignatureCanvas
  signatureUrl={userData.signature}
  onSave={(blob) => setSignatureBlob(blob)}
/>
    </div>

    

    <button onClick={saveSettings} disabled={loading} style={{ marginTop: "1rem" }}>
      {loading ? "Saving..." : "Save"}
    </button>
  </div>
);
}
