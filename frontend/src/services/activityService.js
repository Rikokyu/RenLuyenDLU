import { apiClient } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

export function getActivityErrorMessage(error) {
  const message = error.response?.data?.message;
  return typeof message === "string" && message ? message : error.message;
}

function publishActivityChange() {
  window.dispatchEvent(new Event("renluyen-activities-changed"));
}

export async function getActivities({ search = "", signal } = {}) {
  const response = await apiClient.get(`${API_BASE_URL}/activities`, {
    params: search.trim() ? { search: search.trim() } : undefined,
    signal,
  });
  const result = response.data;
  return {
    items: Array.isArray(result?.data) ? result.data : [],
    total: Number(result?.total || 0),
  };
}

export async function getActivity(id, { signal } = {}) {
  const response = await apiClient.get(
    `${API_BASE_URL}/activities/${encodeURIComponent(id)}`,
    { signal },
  );
  return response.data?.data;
}

export async function uploadActivityImage(id, file) {
  const form = new FormData();
  form.append("image", file);
  const response = await apiClient.post(
    `${API_BASE_URL}/activities/${encodeURIComponent(id)}/image`,
    form,
  );
  return response.data;
}

export async function getActivityImage(id, { signal } = {}) {
  const response = await apiClient.get(
    `${API_BASE_URL}/activities/${encodeURIComponent(id)}/image`,
    { responseType: "blob", signal },
  );
  return response.data;
}

export async function createActivity(activity) {
  const response = await apiClient.post(`${API_BASE_URL}/activities`, activity);
  publishActivityChange();
  return response.data;
}

export async function updateActivity(id, activity) {
  const response = await apiClient.put(
    `${API_BASE_URL}/activities/${encodeURIComponent(id)}`,
    activity,
  );
  publishActivityChange();
  return response.data;
}

export async function deleteActivity(id) {
  const response = await apiClient.delete(
    `${API_BASE_URL}/activities/${encodeURIComponent(id)}`,
  );
  publishActivityChange();
  return response.data;
}

export async function registerForActivity(id) {
  const response = await apiClient.post(
    `${API_BASE_URL}/activities/${encodeURIComponent(id)}/registrations`,
  );
  publishActivityChange();
  return response.data;
}