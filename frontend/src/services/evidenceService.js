import { apiClient } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

const EVIDENCE_API_URL = `${API_BASE_URL}/evidences`;
const STUDENT_EVIDENCE_URL = `${API_BASE_URL}/student-evidences`;

export const evidenceApi = {
  // === STUDENT EVIDENCE APIs ===

  // Lay danh sach minh chung cua sinh vien
  getStudentEvidences: async (filters) => {
    const response = await apiClient.get(STUDENT_EVIDENCE_URL, { params: filters });
    return response.data;
  },

  // Lay danh sach hoat dong da dang ky (de chon khi nop minh chung)
  getRegisteredActivities: async (userId) => {
    const params = userId ? { user_id: userId } : {};
    const response = await apiClient.get(`${STUDENT_EVIDENCE_URL}/activities`, { params });
    return response.data.data; // [ { registrationId, activityCode, title, score } ]
  },

  // Nop minh chung (multipart/form-data) - thread-safe voi pg_advisory_xact_lock
  submitEvidence: async ({ registrationId, requestKey, file, userId, onUploadProgress }) => {
    const formData = new FormData();
    formData.append("registration_id", String(registrationId));
    formData.append("request_key", requestKey);
    formData.append("file", file);
    const params = userId ? { user_id: userId } : {};
    const response = await apiClient.post(STUDENT_EVIDENCE_URL, formData, {
      params,
      onUploadProgress,
    });
    return response.data;
  },

  // Lay chi tiet 1 minh chung cua sinh vien (kem hasFile)
  getStudentEvidenceDetail: async (evidenceId) => {
    const response = await apiClient.get(`${STUDENT_EVIDENCE_URL}/${evidenceId}`);
    return response.data.data;
  },

  // Lay URL de xem anh minh chung
  cancelStudentEvidence: async (evidenceId) => {
    const response = await apiClient.delete(`${STUDENT_EVIDENCE_URL}/${evidenceId}`);
    return response.data;
  },

  getEvidenceFileUrl: (evidenceId) => {
    return `${STUDENT_EVIDENCE_URL}/${evidenceId}/file`;
  },

  // === MANAGER / ADMIN EVIDENCE APIs ===

  getManagerEvidenceFile: async (evidenceId, signal) => {
    const response = await apiClient.get(`${EVIDENCE_API_URL}/${evidenceId}/file`, {
      responseType: "blob",
      signal,
    });
    return response.data;
  },

  // 1. Lay du lieu cho 4 the thong ke
  getStats: async () => {
    const response = await apiClient.get(`${EVIDENCE_API_URL}/stats`);
    return response.data.data;
  },

  // 2. Lay danh sach minh chung len bang (kem bo loc)
  getEvidences: async (filters) => {
    const response = await apiClient.get(EVIDENCE_API_URL, { params: filters });
    return response.data.data;
  },

  // 3. Lay chi tiet 1 minh chung de mo Modal Popup
  getDetail: async (evidenceId) => {
    const response = await apiClient.get(`${EVIDENCE_API_URL}/detail`, {
      params: { evidence_id: evidenceId },
    });
    return response.data.data;
  },

  // 4. Cap nhat trang thai (Duyet hoac Tu choi)
  updateStatus: async (evidenceId, status) => {
    const response = await apiClient.put(`${EVIDENCE_API_URL}/status`, {
      evidence_id: evidenceId,
      status: status,
    });
    return response.data;
  },
};
