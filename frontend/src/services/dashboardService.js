import { apiClient } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

export async function getDashboardOverview({ signal } = {}) {
  const response = await apiClient.get(`${API_BASE_URL}/dashboard/overview`, {
    signal,
  });
  return response.data?.data;
}
