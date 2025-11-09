// src/api/axios.js
import axios from "axios";

/**
 * Auto-switch base URL:
 * - On Vercel (production) set VITE_API_URL to https://texteditorbackend-uxt9.onrender.com
 * - Locally, if VITE_API_URL is not set, fallback to http://localhost:3000
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const instance = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: false,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
