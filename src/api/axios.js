import axios from "axios";
import { getDoctorToken } from "../utils/auth";

const resolveDefaultApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return "http://localhost:4000/api";
  }

  const { hostname, protocol, origin } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalhost) {
    return `${protocol}//${hostname}:4000/api`;
  }

  return `${origin}/api`;
};

const defaultApiBaseUrl = resolveDefaultApiBaseUrl();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = getDoctorToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
