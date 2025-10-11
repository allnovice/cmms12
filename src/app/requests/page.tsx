"use client";

import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

interface FormData {
  filename: string;
  url: string;
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormData[]>([]);
  const [selected, setSelected] = useState<FormData | null>(null);
  const [tableData, setTableData] = useState<any[][]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/forms")
      .then(res => res.json())
      .then(data => {
        const list = data.forms.map((f: string) => ({
          filename: f,
          url: `http://localhost:3001/uploads/${f}`,
        }));
        setForms(list);
      });
  }, []);

  const handleSelect = async (form: FormData) => {
    setSelected(form);
    const res = await fetch(form.url);
    const buffer = await res.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    setTableData(json as any[][]);
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    const newData = [...tableData];
    newData[row][col] = value;
    setTableData(newData);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const ws = XLSX.utils.aoa_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const formData = new FormData();
    formData.append("file", new File([blob], selected.filename));
    await fetch("http://localhost:3001/fill", {
      method: "POST",
      body: formData,
    });
    alert("Saved filled form!");
    setSaving(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Available Excel Forms</h2>
      {forms.map(f => (
        <div key={f.filename} style={{ marginBottom: 8 }}>
          <button onClick={() => handleSelect(f)}>{f.filename}</button>
        </div>
      ))}

      {selected && tableData.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Editing: {selected.filename}</h3>
          <table border={1}>
            <tbody>
              {tableData.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>
                      <input
                        style={{ width: 80 }}
                        value={cell || ""}
                        onChange={e =>
                          handleCellChange(rIdx, cIdx, e.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSave} disabled={saving} style={{ marginTop: 10 }}>
            {saving ? "Saving..." : "Save Filled Form"}
          </button>
        </div>
      )}
    </div>
  );
}
