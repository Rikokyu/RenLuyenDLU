import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/v1/evidences";

export const evidenceApi = {
  // 1. Lấy dữ liệu cho 4 thẻ thống kê
  getStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/stats`);
    return response.data.data; // Trả về { total, pending, approved, rejected }
  },

  // 2. Lấy danh sách minh chứng lên bảng (kèm bộ lọc)
  getEvidences: async (filters) => {
    // filters = { search, faculty_id, class_id, status, from_date, to_date }
    const response = await axios.get(API_BASE_URL, { params: filters });
    return response.data.data;
  },

  // 3. Lấy chi tiết 1 minh chứng để mở Modal Popup
  getDetail: async (evidenceId) => {
    const response = await axios.get(`${API_BASE_URL}/detail`, {
      params: { evidence_id: evidenceId },
    });
    return response.data.data;
  },

  // 4. Cập nhật trạng thái (Duyệt hoặc Từ chối)
  updateStatus: async (evidenceId, status) => {
    // status: 1 (Đã duyệt), 2 (Từ chối)
    const response = await axios.put(`${API_BASE_URL}/status`, {
      evidence_id: evidenceId,
      status: status,
    });
    return response.data;
  },
};
