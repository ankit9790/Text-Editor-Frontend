// src/api/axios.js
import axios from "axios";

/**
 * Auto-switch base URL:
 * - When Vite env VITE_API_URL is set (on Vercel), use it
 * - Otherwise fallback to local backend (http://localhost:3000)
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const instance = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: false,
});

// Attach JWT token to every request if present
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
