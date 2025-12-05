"use client";

export default function ChatNotes() {
  return (
    <div className="chat-notes">
      <p><strong>/help</strong> — show full command list</p>
      <p>Anonymous messages auto-delete after <strong>10 minutes</strong></p>
      <p>General & PM messages auto-delete after <strong>3 days</strong></p>
    </div>
  );
}
