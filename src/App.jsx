// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import axios from "./api/axios";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MessageFab from "./components/MessageFab";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // Auto-Wake Server

  useEffect(() => {
    const pingServer = () => {
      fetch("https://texteditorbackend-uxt9.onrender.com/health")
        .then(() => console.log("🔄 Backend pinged"))
        .catch(() => console.log("Backend sleep…"));
    };

    // Run immediately on load
    pingServer();

    // Then run every 5 minutes
    const interval = setInterval(pingServer, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // ---------------------------
  // AUTO LOGIN CHECK
  // ---------------------------
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setChecking(false);
        return;
      }

      try {
        const res = await axios.get("/auth/me");
        setUser(res.data);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleLogoutEvent = () => {
      localStorage.removeItem("token");
      setUser(null);
      navigate("/login");
    };

    window.addEventListener("logoutRequested", handleLogoutEvent);
    return () =>
      window.removeEventListener("logoutRequested", handleLogoutEvent);
  }, []);

  if (checking) return <div className="center-loader">Loading...</div>;

  // ---------------------------
  // NOT LOGGED IN
  // ---------------------------
  if (!user) {
    return (
      <div className="auth-center">
        <Routes>
          <Route
            path="/register"
            element={
              <Register
                onRegistered={async () => {
                  const token = localStorage.getItem("token");
                  if (token) {
                    try {
                      const r = await axios.get("/auth/me");
                      setUser(r.data);
                      navigate("/");
                    } catch {
                      navigate("/login");
                    }
                  }
                }}
              />
            }
          />

          <Route
            path="/login"
            element={
              <Login
                onLoggedIn={async () => {
                  const token = localStorage.getItem("token");
                  if (token) {
                    try {
                      const r = await axios.get("/auth/me");
                      setUser(r.data);
                      navigate("/");
                    } catch {
                      navigate("/login");
                    }
                  }
                }}
              />
            }
          />

          <Route
            path="*"
            element={
              <Login
                onLoggedIn={async () => {
                  const token = localStorage.getItem("token");
                  if (token) {
                    try {
                      const r = await axios.get("/auth/me");
                      setUser(r.data);
                      navigate("/");
                    } catch {
                      navigate("/login");
                    }
                  }
                }}
              />
            }
          />
        </Routes>
      </div>
    );
  }

  // ---------------------------
  // LOGGED IN
  // ---------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const handleShareClick = () => {
    window.dispatchEvent(new CustomEvent("openShareForCurrentDoc"));
  };

  return (
    <div className="app-root">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onShareClick={handleShareClick}
      />

      <div className="app-content">
        <Routes>
          <Route path="/*" element={<Dashboard user={user} />} />
        </Routes>
      </div>

      {/* FIXED: pass user here */}
      <MessageFab user={user} />
    </div>
  );
}
