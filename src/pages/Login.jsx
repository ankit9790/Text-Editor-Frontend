import React, { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/login", { email, password });
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
      if (onLoggedIn) onLoggedIn();
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="auth-card">
      <h3>Login</h3>
      <form onSubmit={handleSubmit} className="auth-form">
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
          Login
        </button>
      </form>

      <div style={{ marginTop: 12, textAlign: "center" }}>
        <button className="btn link" onClick={() => navigate("/register")}>
          Create an account
        </button>
      </div>
    </div>
  );
}
