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

  // // Auto-Wake Server
  // useEffect(() => {
  //   fetch("https://texteditorbackend-uxt9.onrender.com/health")
  //     .catch(() => {});
  // }, []);

  // AUTO LOGIN CHECK
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

  const handleShareClick = () => {
    if (!user) return alert("Login required for sharing!");
    window.dispatchEvent(new CustomEvent("openShareForCurrentDoc"));
  };

  return (
    <div className="app-root">
      <Navbar
        user={user}
        onShareClick={handleShareClick}
        onLogin={() => navigate("/login")}
      />

      <div className="app-content">
        <Routes>
          {/* MAIN DASHBOARD ALWAYS SHOWN */}
          <Route path="/" element={<Dashboard user={user} />} />

          {/* LOGIN (centered) */}
          <Route
            path="/login"
            element={
              <div className="auth-fullscreen-center">
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
              </div>
            }
          />

          {/* REGISTER (centered) */}
          <Route
            path="/register"
            element={
              <div className="auth-fullscreen-center">
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
              </div>
            }
          />
        </Routes>
      </div>

      <MessageFab user={user} />
    </div>
  );
}
