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

  // --- New: office locations ---
  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [officeName, setOfficeName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // --- Fetch user ---
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

  // --- Fetch offices ---
  useEffect(() => {
    const fetchOffices = async () => {
      const snap = await getDocs(collection(db, "locations"));
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as OfficeLocation)
      );
      setOffices(data);
    };
    fetchOffices();
  }, []);

  // --- Save user settings ---
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

  // --- Add new office ---
  const saveOffice = async () => {
    if (!officeName || !latitude || !longitude) {
      alert("Please fill all fields.");
      return;
    }
    await addDoc(collection(db, "locations"), {
      name: officeName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    });
    setOfficeName("");
    setLatitude("");
    setLongitude("");

    const snap = await getDocs(collection(db, "locations"));
    const data = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as OfficeLocation)
    );
    setOffices(data);
  };

  // --- Delete office ---
  const deleteOffice = async (id: string) => {
    await deleteDoc(doc(db, "locations", id));
    setOffices((prev) => prev.filter((o) => o.id !== id));
  };

  if (!userData) return <p>Loading user...</p>;

  return (
    <div className="settings-form">
      <h2>Settings</h2>

      {/* ===== USER SETTINGS FORM ===== */}
      <div>
        <label>Email (read-only)</label>
        <input type="text" value={userData.email} readOnly />
      </div>

      <div>
        <label>Full Name *</label>
        <input type="text" value={fullname} onChange={(e) => setFullname(e.target.value)} />
      </div>

      <div>
        <label>Designation *</label>
        <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} />
      </div>

      <div>
        <label>Address</label>
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div>
        <label>Contact</label>
        <input type="text" className="short-input" value={contact} onChange={(e) => setContact(e.target.value)} />
      </div>

      <div>
        <label>Employee Number</label>
        <input type="text" className="short-input" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} />
      </div>

      <div>
        <label>Division</label>
        <input type="text" value={division} onChange={(e) => setDivision(e.target.value)} />
      </div>

      <div>
        <label>Pin Color</label>
        <div className="inline-row">
          <input type="color" className="color-input" value={pinColor} onChange={(e) => setPinColor(e.target.value)} />
          <div className="color-preview">
            <div className="color-swatch" style={{ background: pinColor }} title={pinColor} />
            <span style={{ fontSize: "0.9rem" }}>{pinColor}</span>
          </div>
        </div>
      </div>

      <div>
        <label>Signature</label>
        <SignatureCanvas signatureUrl={userData.signature} onSave={(blob) => setSignatureBlob(blob)} />
        <div className="file-input-wrapper" style={{ marginTop: "0.5rem" }}>
          <label className="file-input-btn">
            Choose file
            <input
              type="file"
              accept="image/png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSignatureBlob(file);
              }}
            />
          </label>
        </div>
      </div>

      <button onClick={saveSettings} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>

      {/* ===== OFFICE LOCATIONS SECTION ===== */}
      <hr style={{ margin: "2rem 0" }} />
      <h2>🏢 Office Locations</h2>

      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Office Name"
          value={officeName}
          onChange={(e) => setOfficeName(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        />
        <input
          type="number"
          step="any"
          placeholder="Latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        />
        <button
          onClick={saveOffice}
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 4,
          }}
        >
          Add Office
        </button>
      </div>

      <h3 style={{ marginTop: "20px" }}>Saved Offices</h3>
      <ul>
        {offices.map((o) => (
          <li key={o.id}>
            <b>{o.name}</b> — {o.latitude}, {o.longitude}{" "}
            <button
              onClick={() => deleteOffice(o.id)}
              style={{ color: "red", marginLeft: 10 }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
