import axios from "axios";

// Using Vite env variable
const API_URL = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:3001/api/v1";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
