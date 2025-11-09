// src/components/Navbar.jsx
import React, { useState } from "react";

export default function Navbar({ onLogout, user }) {
  const [joinId, setJoinId] = useState("");

  const handleJoin = () => {
    const id = (joinId || "").trim();
    if (!id) return;
    // dispatch event for Dashboard to handle fetching the document and opening the editor
    window.dispatchEvent(new CustomEvent("joinDocById", { detail: id }));
    setJoinId("");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {user?.email && <div style={{ fontWeight: 600 }}>{user.email}</div>}
      </div>

      <div className="navbar-center">
        <div className="navbar-title">Text Editor</div>
      </div>

      <div className="navbar-right">
        <input
          className="join-input"
          placeholder="Document ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJoin();
          }}
        />
        <button className="btn join-btn" onClick={handleJoin}>
          Join
        </button>
        <button className="btn logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
