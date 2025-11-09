// src/api/axios.js
import axios from "axios";

// Use Vite env variable if present; fallback to localhost for local dev
const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:3000", {
  transports: ["websocket"], // force WebSocket
});

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
