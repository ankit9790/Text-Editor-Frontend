import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user");
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav
      className="navbar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#00796b",
        color: "#fff",
        padding: "0.8rem 1.5rem",
      }}
    >
      {/* LEFT: Logged in Email or Login/Register */}
      <div style={{ width: "33%", display: "flex", gap: "10px" }}>
        {!user ? (
          <>
            <Link
              to="/login"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Login
            </Link>
            <Link
              to="/register"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Register
            </Link>
          </>
        ) : (
          <span style={{ fontWeight: 600 }}>Logged as: {user.email}</span>
        )}
      </div>

      {/* CENTER: Title */}
      <div
        style={{
          width: "33%",
          textAlign: "center",
          fontSize: "1.5rem",
          fontWeight: 700,
        }}
      >
        Text Editor
      </div>

      {/* RIGHT: Only Logout */}
      <div
        style={{
          width: "33%",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        {user && (
          <button
            onClick={handleLogout}
            style={{
              background: "#e53935",
              border: "none",
              color: "white",
              padding: "6px 12px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
