"use client";

import React from "react";
import "../globals.css";

export default function BorrowingPage() {
  return (
    <div>
      <h1>Borrowing</h1>
      <p style={{ marginTop: "0.5rem", color: "var(--text-color)" }}>
        This is the borrowing section. Add forms and lists here for checking out and returning assets.
      </p>

      <div style={{ marginTop: "1rem" }} className="table-wrapper">
        <p style={{ padding: "1.25rem" }}>No borrowing records yet — implement list or form as needed.</p>
      </div>
    </div>
  );
}
