"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
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
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const handleLocateUser = async (uid: string, fullname?: string) => {
    try {
      const pinDoc = await getDoc(doc(db, "userPins", uid));
      if (!pinDoc.exists()) {
        alert("No location found for this user.");
        return;
      }
      const data = pinDoc.data();
      const firstName = fullname?.split(" ")[0] || "User";
      router.push(`/maps?userId=${uid}&lat=${data.latitude}&lng=${data.longitude}&name=${encodeURIComponent(firstName)}`);
    } catch (err) {
      console.error("Error locating user:", err);
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
    </tr>
  </thead>
  <tbody>
    {users.map(u => (
      <tr key={u.id}>
        <td className="text-center">
          <button
            onClick={() => handleLocateUser(u.id, u.fullname)}
            title="Show on map"
            className="locate-btn"
          >
            <FiMapPin size={18} />
          </button>
        </td>
        <td>{u.fullname ?? "-"}</td>
        <td>{u.employeeNumber ?? "-"}</td>
        <td>{u.division ?? "-"}</td>
        <td>{u.designation ?? "-"}</td>
        <td>{u.contact ?? "-"}</td>
        <td>{u.email ?? "-"}</td>
      </tr>
    ))}
  </tbody>
</table>
  </div>
  );
}
