import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import axios from "./api/axios";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

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

  if (checking) return <div className="center-loader">Loading...</div>;

  // If not logged in: show auth UI (Login/Register). Navbar is not shown.
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="app-root">
      <Navbar onLogout={handleLogout} />
      <div className="app-content">
        <Routes>
          <Route path="/*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}
