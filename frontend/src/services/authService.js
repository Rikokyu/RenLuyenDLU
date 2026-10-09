import { apiClient } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

export async function login(username, password) {
  const response = await apiClient.post(`${API_BASE_URL}/auth/login`, {
    username,
    password,
  });
  return response.data;
}

export async function loginWithGoogle(credential) {
  const response = await apiClient.post(`${API_BASE_URL}/auth/google`, {
    credential,
  });
  return response.data;
}

export async function changePassword(oldPassword, newPassword) {
  const response = await apiClient.put(`${API_BASE_URL}/auth/password`, {
    oldPassword,
    newPassword,
  });
  return response.data;
}

export async function getProfile() {
  const response = await apiClient.get(`${API_BASE_URL}/auth/me`);
  return response.data;
}