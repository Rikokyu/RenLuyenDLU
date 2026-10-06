import { formatDate } from "./formatDate";

function addSheet(workbook, name, columns, rows) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns;
  sheet.addRows(rows);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF087A4B" },
  };
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });
}

export async function exportManagerWorkbook({ students, classes, accounts }) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rèn Luyện DLU";
  workbook.created = new Date();

  addSheet(
    workbook,
    "Sinh viên",
    [
      { header: "MSSV", key: "studentId", width: 18 },
      { header: "Họ và tên", key: "name", width: 28 },
      { header: "Số điện thoại", key: "phone", width: 20 },
      { header: "Email đăng nhập", key: "email", width: 32 },
      { header: "Lớp", key: "classCode", width: 16 },
      { header: "Khoa", key: "faculty", width: 28 },
      { header: "Chương trình", key: "program", width: 20 },
      { header: "Giới tính", key: "gender", width: 14 },
      { header: "Ngày sinh", key: "birthDay", width: 16 },
      { header: "Quốc gia", key: "hometownCountry", width: 20 },
      { header: "Tỉnh", key: "hometownProvince", width: 24 },
      { header: "Thành phố", key: "hometownCity", width: 24 },
      { header: "Địa chỉ chi tiết", key: "hometownAddress", width: 36 },
      { header: "Vai trò lớp", key: "classRole", width: 18 },
      { header: "Trạng thái lớp", key: "status", width: 18 },
    ],
    students.map((student) => ({
      studentId: student.mssv,
      name: student.name,
      phone: student.phone,
      email: student.email,
      classCode: student.classCode,
      faculty: student.facultyName,
      program: student.studyProgramId,
      gender: student.gender,
      birthDay: formatDate(student.birthDay),
      hometownCountry: student.hometownCountry,
      hometownProvince: student.hometownProvince,
      hometownCity: student.hometownCity,
      hometownAddress: student.hometownAddress,
      classRole: student.classRoleId === 1 ? "Lớp trưởng" : "Học viên",
      status: student.isInClass ? "Đang học" : "Ngoài lớp",
    })),
  );

  addSheet(
    workbook,
    "Lớp sinh hoạt",
    [
      { header: "Mã lớp", key: "code", width: 18 },
      { header: "Khoa / Đơn vị", key: "faculty", width: 30 },
      { header: "Năm học", key: "academicYear", width: 18 },
      { header: "Sĩ số", key: "studentCount", width: 12 },
    ],
    classes.map((classItem) => ({
      code: classItem.code,
      faculty: classItem.faculty,
      academicYear: classItem.academicYear,
      studentCount: classItem.studentCount,
    })),
  );

  addSheet(
    workbook,
    "Tài khoản",
    [
      { header: "Họ và tên", key: "name", width: 28 },
      { header: "Email đăng nhập", key: "email", width: 32 },
      { header: "Vai trò", key: "role", width: 28 },
      { header: "Khoa / Đơn vị", key: "unit", width: 30 },
      { header: "Lớp", key: "className", width: 18 },
      { header: "MSSV", key: "studentId", width: 18 },
      { header: "Trạng thái", key: "status", width: 20 },
      { header: "Lần đăng nhập", key: "lastLogin", width: 22 },
    ],
    accounts.map((account) => ({
      name: account.name,
      email: account.email,
      role: account.role,
      unit: account.unit,
      className: account.className,
      studentId: account.studentId,
      status: account.status,
      lastLogin: account.lastLogin,
    })),
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ren-luyen-dlu-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
