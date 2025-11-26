import axios from "axios";

const instance = axios.create({
  baseURL: "https://texteditorbackend-uxt9.onrender.com",
  // baseURL: "https://texteditorbackend-uxt9.onrender.com/api",
  withCredentials: false,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
