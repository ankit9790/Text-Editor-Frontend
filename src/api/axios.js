// src/api/axios.js
import axios from "axios";

// Use Vite env variable if present; fallback to localhost for local dev
const API_BASE =
  import.meta.env.VITE_API_URL || "https://texteditorbackend-uxt9.onrender.com";

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
