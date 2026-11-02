import { apiClient } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

export async function getReportExport({ search, facultyId, majorId, classId, signal } = {}) {
  const response = await apiClient.get(`${API_BASE_URL}/reports/details/export`, {
    signal,
    params: { search: search || undefined, faculty_id: facultyId || undefined,
      major_id: majorId || undefined, class_id: classId || undefined },
  });
  return response.data.data;
}

export async function getReportDetails({ search, facultyId, majorId, classId, page = 1, signal } = {}) {
  const response = await apiClient.get(`${API_BASE_URL}/reports/details`, {
    signal,
    params: { search: search || undefined, faculty_id: facultyId || undefined,
      major_id: majorId || undefined, class_id: classId || undefined, page, page_size: 10 },
  });
  return response.data.data;
}

export async function getReportAnalytics({ fromDate, toDate, schoolYearId, page = 1, sort = "attended", signal } = {}) {
  const response = await apiClient.get(`${API_BASE_URL}/reports/analytics`, {
    signal,
    params: { from_date: fromDate || undefined, to_date: toDate || undefined,
      school_year_id: schoolYearId || undefined, page, page_size: 5, top_limit: 5, sort },
  });
  return response.data.data;
}

export async function getReportOverview({ fromDate, toDate, signal } = {}) {
  const response = await apiClient.get(`${API_BASE_URL}/reports/overview`, {
    signal,
    params: { from_date: fromDate || undefined, to_date: toDate || undefined },
  });
  return response.data.data;
}
