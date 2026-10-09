import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { clearSession, getAuthToken } from "./store/authStore";
import "./index.css";

axios.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = /\/auth\/(login|google)(\?|$)/.test(
      error.config?.url || "",
    );
    if (error.response?.status === 401 && getAuthToken() && !isLoginRequest) {
      clearSession();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
