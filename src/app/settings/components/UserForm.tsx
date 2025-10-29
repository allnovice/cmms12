"use client";

import React from "react";
import { UserData } from "../hooks/useUserData";

interface UserFormProps {
  data: UserData;
  setField: (field: keyof UserData, value: string) => void;
}

export default function UserForm({ data, setField }: UserFormProps) {
  return (
    <div>
      <div>
        <label>Email (read-only)</label>
        <input type="text" value={data.email} readOnly />
      </div>

      <div>
        <label>Full Name *</label>
        <input
          type="text"
          value={data.fullname}
          onChange={(e) => setField("fullname", e.target.value)}
          required
        />
      </div>

      <div>
        <label>Designation *</label>
        <input
          type="text"
          value={data.designation}
          onChange={(e) => setField("designation", e.target.value)}
          required
        />
      </div>

      <div>
        <label>Address</label>
        <input
          type="text"
          value={data.address ?? ""}
          onChange={(e) => setField("address", e.target.value)}
        />
      </div>

      <div>
        <label>Contact</label>
        <input
          type="text"
          value={data.contact ?? ""}
          onChange={(e) => setField("contact", e.target.value)}
        />
      </div>

      <div>
        <label>Employee Number</label>
        <input
          type="text"
          value={data.employeeNumber ?? ""}
          onChange={(e) => setField("employeeNumber", e.target.value)}
        />
      </div>

      <div>
        <label>Division</label>
        <input
          type="text"
          value={data.division ?? ""}
          onChange={(e) => setField("division", e.target.value)}
        />
      </div>
    </div>
  );
}
