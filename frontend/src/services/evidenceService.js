import { apiClient } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

const EVIDENCE_API_URL = `${API_BASE_URL}/evidences`;

export const evidenceApi = {
  // 1. Lấy dữ liệu cho 4 thẻ thống kê
  getStats: async () => {
    const response = await apiClient.get(`${EVIDENCE_API_URL}/stats`);
    return response.data.data; // Trả về { total, pending, approved, rejected }
  },

  // 2. Lấy danh sách minh chứng lên bảng (kèm bộ lọc)
  getEvidences: async (filters) => {
    // filters = { search, faculty_id, class_id, status, from_date, to_date }
    const response = await apiClient.get(EVIDENCE_API_URL, { params: filters });
    return response.data.data;
  },

  // 3. Lấy chi tiết 1 minh chứng để mở Modal Popup
  getDetail: async (evidenceId) => {
    const response = await apiClient.get(`${EVIDENCE_API_URL}/detail`, {
      params: { evidence_id: evidenceId },
    });
    return response.data.data;
  },

  // 4. Cập nhật trạng thái (Duyệt hoặc Từ chối)
  updateStatus: async (evidenceId, status) => {
    // status: 1 (Đã duyệt), 2 (Từ chối)
    const response = await apiClient.put(`${EVIDENCE_API_URL}/status`, {
      evidence_id: evidenceId,
      status: status,
    });
    return response.data;
  },
};
