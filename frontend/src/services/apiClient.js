import axios from "axios";
import { clearSession, getAuthToken } from "../store/authStore";

export const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
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
