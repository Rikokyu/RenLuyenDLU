import { apiRequest } from "./api";

export function getClasses() {
  return apiRequest("/manager/classes");
}

export function getStudents(classCode = "") {
  const query = classCode ? `?class=${encodeURIComponent(classCode)}` : "";
  return apiRequest(`/manager/students${query}`);
}

export function syncStudents(classCode = "") {
  return apiRequest("/manager/students/sync", {
    method: "POST",
    body: JSON.stringify(classCode ? { classCode } : {}),
  });
}
