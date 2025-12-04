// src/pages/Register.jsx
import React, { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Register({ onRegistered }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 🔥 SEND EXACT FIELDS THAT BACKEND EXPECTS
      const res = await axios.post("/auth/register", {
        username,
        email,
        password,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }

      if (onRegistered) onRegistered();
    } catch (err) {
      alert(err.response?.data?.error || "Register failed");
    }
  };

  return (
    <div className="auth-card">
      <h3>Register</h3>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Username</label>
        <input
          required
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="btn primary">
          Register
        </button>
      </form>

      <div style={{ marginTop: 12, textAlign: "center" }}>
        <button className="btn link" onClick={() => navigate("/login")}>
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}
