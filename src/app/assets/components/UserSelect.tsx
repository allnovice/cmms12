"use client";

import { User } from "@/types";

type Props = {
  value: string;
  users: User[];
  onChange: (uid: string) => void;
  disabled?: boolean;
};

export default function UserSelect({ value, users, onChange, disabled }: Props) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="">Select User</option>
      {users.map((u) => (
        <option key={u.uid} value={u.uid}>
          {u.fullname}
        </option>
      ))}
    </select>
  );
}
