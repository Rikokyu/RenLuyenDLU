import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export async function getManagerStudents(filters = {}) {
  const params = {};

  if (filters.search) {
    params.search = filters.search;
  }

  if (filters.classCode) {
    params.class_code = filters.classCode;
  }

  const response = await axios.get(`${API_BASE_URL}/manager/students`, {
    params,
  });

  return response.data;
}

export async function getManagerClasses() {
  const response = await axios.get(`${API_BASE_URL}/manager/classes`);
  return response.data.data;
}

export async function getManagerAccounts() {
  const response = await axios.get(`${API_BASE_URL}/manager/accounts`);
  return response.data.data;
}

export async function getManagerRoles() {
  const response = await axios.get(`${API_BASE_URL}/manager/roles`);
  return response.data.data;
}

export async function saveManagerAccount(account) {
  const { id, ...payload } = account;
  const response = id
    ? await axios.put(`${API_BASE_URL}/manager/accounts/${id}`, payload)
    : await axios.post(`${API_BASE_URL}/manager/accounts`, payload);
  return response.data;
}

export async function deleteManagerAccount(id) {
  await axios.delete(`${API_BASE_URL}/manager/accounts/${id}`);
}

export async function resetManagerAccountPassword(id) {
  const response = await axios.post(
    `${API_BASE_URL}/manager/accounts/${id}/reset-password`,
  );
  return response.data;
}

export async function saveManagerClass(classData) {
  const { originalCode, ...payload } = classData;
  const response = originalCode
    ? await axios.put(
        `${API_BASE_URL}/manager/classes/${encodeURIComponent(originalCode)}`,
        payload,
      )
    : await axios.post(`${API_BASE_URL}/manager/classes`, payload);
  return response.data;
}

export async function deleteManagerClass(code) {
  await axios.delete(
    `${API_BASE_URL}/manager/classes/${encodeURIComponent(code)}`,
  );
}

export async function saveManagerStudent(student) {
  const { originalStudentId, ...payload } = student;
  const response = originalStudentId
    ? await axios.put(
        `${API_BASE_URL}/manager/students/${encodeURIComponent(originalStudentId)}`,
        payload,
      )
    : await axios.post(`${API_BASE_URL}/manager/students`, payload);
  return response.data;
}

export async function deleteManagerStudent(studentId) {
  await axios.delete(
    `${API_BASE_URL}/manager/students/${encodeURIComponent(studentId)}`,
  );
}
