"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/firebase";
import { useRouter } from "next/navigation";
import { FiMapPin } from "react-icons/fi";
import "./page.css";

type User = {
  id: string;
  fullname?: string;
  employeeNumber?: string;
  division?: string;
  designation?: string;
  contact?: string;
  email?: string;
  role?: string;
  signatoryLevel?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [signatoryLevels, setSignatoryLevels] = useState<string[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // Track which user is saving
  const router = useRouter();

  // Fetch current user's role
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setCurrentUserRole(snap.data().role || null);
    };
    fetchCurrentUser();
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const data = snapshot.docs.map(d => ({
          id: d.id,
          fullname: d.data().fullname,
          employeeNumber: d.data().employeeNumber,
          division: d.data().division,
          designation: d.data().designation,
          contact: d.data().contact,
          email: d.data().email,
          role: d.data().role,
          signatoryLevel: d.data().signatoryLevel,
        }));
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch roles dropdown
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesSnap = await getDoc(doc(db, "roles", "allOptions"));
        if (rolesSnap.exists()) setRoles(rolesSnap.data().options || []);
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    };
    fetchRoles();
  }, []);

  // Fetch signatory levels dropdown
  useEffect(() => {
    const fetchSignLevels = async () => {
      try {
        const sigSnap = await getDoc(doc(db, "signatoryLevel", "allOptions"));
        if (sigSnap.exists()) setSignatoryLevels(sigSnap.data().options || []);
      } catch (err) {
        console.error("Error fetching signatory levels:", err);
      }
    };
    fetchSignLevels();
  }, []);

  // Locate user on map
  const handleLocateUser = async (uid: string, fullname?: string) => {
    try {
      const pinDoc = await getDoc(doc(db, "userPins", uid));
      if (!pinDoc.exists()) {
        alert("No location found for this user.");
        return;
      }
      const data = pinDoc.data();
      const firstName = fullname?.split(" ")[0] || "User";
      router.push(
        `/maps?userId=${uid}&lat=${data.latitude}&lng=${data.longitude}&name=${encodeURIComponent(firstName)}`
      );
    } catch (err) {
      console.error("Error locating user:", err);
    }
  };

  // Update user role or signatory level
  const handleChange = async (uid: string, field: "role" | "signatoryLevel", value: string) => {
    if (currentUserRole !== "admin") return; // Only admin can edit
    setSaving(uid); // Start saving state
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, { [field]: value });
      setUsers(prev => prev.map(u => (u.id === uid ? { ...u, [field]: value } : u)));

      // Refresh current user's role if they edited their own
      const user = auth.currentUser;
      if (user && user.uid === uid && field === "role") {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setCurrentUserRole(snap.data().role || null);
      }
    } catch (err) {
      console.error(`Error updating ${field} for user ${uid}:`, err);
      alert("Failed to update. Check console.");
    } finally {
      setSaving(null); // Done saving
    }
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="table-wrapper">
      <table className="users-table">
        <thead>
          <tr>
            <th className="text-center">📍</th>
            <th>Full Name</th>
            <th>Employee #</th>
            <th>Division</th>
            <th>Designation</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Role</th>
            <th>Signatory Level</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td className="text-center">
                <button onClick={() => handleLocateUser(u.id, u.fullname)} title="Show on map" className="locate-btn">
                  <FiMapPin size={18} />
                </button>
              </td>
              <td>{u.fullname ?? "-"}</td>
              <td>{u.employeeNumber ?? "-"}</td>
              <td>{u.division ?? "-"}</td>
              <td>{u.designation ?? "-"}</td>
              <td>{u.contact ?? "-"}</td>
              <td>{u.email ?? "-"}</td>
              <td>
                {currentUserRole === "admin" ? (
                  saving === u.id ? (
                    <span className="saving-text">Saving...</span>
                  ) : (
                    <select value={u.role || ""} onChange={(e) => handleChange(u.id, "role", e.target.value)}>
                      <option value="">--Select Role--</option>
                      {roles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )
                ) : (
                  <span>{u.role || "-"}</span>
                )}
              </td>
              <td>
                {currentUserRole === "admin" ? (
                  saving === u.id ? (
                    <span className="saving-text">Saving...</span>
                  ) : (
                    <select value={u.signatoryLevel || ""} onChange={(e) => handleChange(u.id, "signatoryLevel", e.target.value)}>
                      <option value="">--Select Level--</option>
                      {signatoryLevels.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )
                ) : (
                  <span>{u.signatoryLevel || "-"}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
