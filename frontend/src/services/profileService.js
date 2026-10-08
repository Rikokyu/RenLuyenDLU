const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

async function requestProfile(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      result?.message || `Không thể tải hồ sơ (HTTP ${response.status})`,
    );
    error.status = response.status;
    throw error;
  }

  if (result?.status !== "success" || !result.data) {
    throw new Error(result?.message || "Dữ liệu hồ sơ trả về không hợp lệ");
  }

  return result.data;
}

export async function getProfileByIdentifier(identifier) {
  const encodedIdentifier = encodeURIComponent(identifier);

  try {
    const student = await requestProfile(
      `/profiles/students/${encodedIdentifier}`,
    );
    return { ...student, profileType: "student" };
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }

  const lecturer = await requestProfile(
    `/profiles/lecturers/${encodedIdentifier}`,
  );
  return { ...lecturer, profileType: "lecturer" };
}
