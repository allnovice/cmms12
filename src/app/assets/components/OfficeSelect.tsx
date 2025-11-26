"use client";

import { Office } from "@/types";

type Props = {
  value: string;
  offices: Office[];
  onChange: (officeId: string) => void;
  disabled?: boolean;
};

export default function OfficeSelect({ value, offices, onChange, disabled }: Props) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="">Select Office</option>
      {offices.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
