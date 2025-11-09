import React, { useState } from "react";

export default function Navbar({ onLogout, user }) {
  const [joinId, setJoinId] = useState("");

  const handleJoin = () => {
    const id = (joinId || "").trim();
    if (!id) return;
    window.dispatchEvent(new CustomEvent("joinDocById", { detail: id }));
    setJoinId("");
  };

  return (
    <nav className="navbar">
      {/* LEFT SIDE: Show current user email */}
      <div className="navbar-left">
        {user?.email && (
          <span style={{ fontWeight: 600 }}>LogedIn : {user.email}</span>
        )}
      </div>

      {/* CENTER: Navbar title */}
      <div className="navbar-center">
        <div className="navbar-title">Collaborative Editor</div>
      </div>

      {/* RIGHT SIDE: Join input + Logout */}
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
