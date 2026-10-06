// const API_URL = "https://quan-ly-dao-tao-api.nguyentronghieu.io.vn/api/v1";

// const API_KEY = "mk_dev_0404bfb1980e71ce85b45c059cc7483d1a187eb45d47ff82";

// export async function getStudentsByClass(classId) {
//   const myHeaders = new Headers();

//   myHeaders.append("X-API-KEY", API_KEY);
//   myHeaders.append("Content-Type", "application/json");

//   const raw = JSON.stringify({
//     Id: classId,
//   });

//   const requestOptions = {
//     method: "POST",
//     headers: myHeaders,
//     body: raw,
//     redirect: "follow",
//   };

//   try {
//     const response = await fetch(
//       API_URL + "/LayDanhSachSinhVienTheoLop",
//       requestOptions,
//     );

//     if (!response.ok) {
//       throw new Error(`HTTP error: ${response.status}`);
//     }

//     const result = await response.json();

//     return result;
//   } catch (error) {
//     console.error("Lỗi khi lấy danh sách sinh viên:", error);

//     throw error;
//   }
// }

// export async function getTraniningPointByClass(classId) {
//   const myHeaders = new Headers();

//   myHeaders.append("X-API-KEY", API_KEY);
//   myHeaders.append("Content-Type", "application/json");

//   const raw = JSON.stringify({
//     Id: classId,
//   });

//   const requestOptions = {
//     method: "POST",
//     headers: myHeaders,
//     body: raw,
//     redirect: "follow",
//   };

//   try {
//     const response = await fetch(
//       API_URL + "/LayBangDiemRenLuyenTheoLop",
//       requestOptions,
//     );

//     if (!response.ok) {
//       throw new Error(`HTTP error: ${response.status}`);
//     }

//     const result = await response.json();

//     return result;
//   } catch (error) {
//     console.error("Lỗi khi lấy bảng điểm rèn luyện:", error);

//     throw error;
//   }
// }
