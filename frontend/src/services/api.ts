import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable sending cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - no need to manually add token as cookies are sent automatically
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only redirect on 401 for non-auth-check requests
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/me")
    ) {
      // Clear any authentication state and redirect to login
      // No need to clear localStorage since we're using cookies
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
