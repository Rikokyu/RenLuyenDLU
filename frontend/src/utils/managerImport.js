function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function cellText(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if (value.text) return String(value.text).trim();
    if (value.richText) {
      return value.richText.map((item) => item.text || "").join("").trim();
    }
    if ("result" in value) return cellText(value.result);
  }
  return String(value).trim().replace(/\.0$/, "");
}

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return date.toISOString().slice(0, 10);
  }

  const text = cellText(value);
  if (!text) return "";
  const isoDate = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoDate) {
    return formatValidDate(
      Number(isoDate[1]),
      Number(isoDate[2]),
      Number(isoDate[3]),
    );
  }
  const localizedDate = text.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/);
  if (localizedDate) {
    return formatValidDate(
      Number(localizedDate[3]),
      Number(localizedDate[2]),
      Number(localizedDate[1]),
    );
  }
  return "";
}

function formatValidDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getSheet(workbook, aliases) {
  const expected = new Set(aliases.map(normalizeHeader));
  return workbook.worksheets.find((sheet) =>
    expected.has(normalizeHeader(sheet.name)),
  );
}

function readRecords(sheet, columnAliases, requiredKeys, issues) {
  const headerColumns = new Map();
  sheet.getRow(1).eachCell((cell, column) => {
    headerColumns.set(normalizeHeader(cell.value), column);
  });

  const columns = {};
  for (const [key, aliases] of Object.entries(columnAliases)) {
    columns[key] = aliases
      .map(normalizeHeader)
      .map((alias) => headerColumns.get(alias))
      .find(Boolean);
  }

  for (const key of requiredKeys) {
    if (!columns[key]) {
      issues.push({
        row: 1,
        sheet: sheet.name,
        message: `Thiếu cột bắt buộc "${columnAliases[key][0]}" trong sheet "${sheet.name}".`,
      });
    }
  }

  const records = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const raw = Object.fromEntries(
      Object.entries(columns).map(([key, column]) => [
        key,
        column ? row.getCell(column).value : "",
      ]),
    );
    if (Object.values(raw).every((value) => !cellText(value))) continue;
    records.push({ row: rowNumber, raw });
  }
  return records;
}

export async function readManagerImportWorkbook(file) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const issues = [];
  const classSheet = getSheet(workbook, ["Lớp sinh hoạt", "Lớp"]);
  const studentSheet = getSheet(workbook, ["Sinh viên", "Sinh vien"]);
  if (!classSheet) issues.push({ row: 1, message: 'Thiếu sheet "Lớp sinh hoạt".' });
  if (!studentSheet) issues.push({ row: 1, message: 'Thiếu sheet "Sinh viên".' });

  const classes = classSheet
    ? readRecords(
        classSheet,
        {
          code: ["Mã lớp", "Mã lớp sinh hoạt"],
          faculty: ["Khoa / Đơn vị", "Khoa", "Đơn vị"],
          academicYear: ["Năm học"],
        },
        ["code"],
        issues,
      )
    : [];
  const students = studentSheet
    ? readRecords(
        studentSheet,
        {
          studentId: ["MSSV", "Mã số sinh viên"],
          name: ["Họ và tên", "Họ tên", "Tên sinh viên"],
          phone: ["Số điện thoại", "Điện thoại"],
          email: ["Email đăng nhập", "Email"],
          classCode: ["Lớp", "Mã lớp"],
          gender: ["Giới tính"],
          birthDay: ["Ngày sinh"],
          birthPlace: ["Nơi sinh"],
        },
        ["studentId", "name", "email", "classCode", "birthDay"],
        issues,
      )
    : [];

  const normalizedClasses = [];
  const classCodes = new Set();
  for (const { row, raw } of classes) {
    const code = cellText(raw.code).toUpperCase();
    if (!code) {
      issues.push({ row, sheet: classSheet.name, message: "Thiếu mã lớp." });
      continue;
    }
    if (classCodes.has(code)) {
      issues.push({
        row,
        sheet: classSheet.name,
        message: `Mã lớp "${code}" bị lặp trong file.`,
      });
      continue;
    }
    classCodes.add(code);
    normalizedClasses.push({
      row,
      code,
      faculty: cellText(raw.faculty),
      academicYear: cellText(raw.academicYear),
    });
  }

  const normalizedStudents = [];
  const studentIds = new Set();
  for (const { row, raw } of students) {
    const studentId = cellText(raw.studentId);
    const name = cellText(raw.name);
    const email = cellText(raw.email).toLowerCase();
    const classCode = cellText(raw.classCode).toUpperCase();
    const birthDay = parseDate(raw.birthDay);
    const missing = [
      ["MSSV", studentId],
      ["họ và tên", name],
      ["email", email],
      ["lớp", classCode],
      ["ngày sinh hợp lệ", birthDay],
    ].filter(([, value]) => !value);

    if (missing.length) {
      issues.push({
        row,
        sheet: studentSheet.name,
        message: `Thiếu ${missing.map(([label]) => label).join(", ")}.`,
      });
      continue;
    }
    const normalizedId = studentId.toLowerCase();
    if (studentIds.has(normalizedId)) {
      issues.push({
        row,
        sheet: studentSheet.name,
        message: `MSSV "${studentId}" bị lặp trong file.`,
      });
      continue;
    }
    studentIds.add(normalizedId);
    normalizedStudents.push({
      row,
      studentId,
      name,
      email,
      phone: cellText(raw.phone),
      classCode,
      gender: cellText(raw.gender) || "Nam",
      birthDay,
      birthPlace: cellText(raw.birthPlace),
    });
  }

  return { classes: normalizedClasses, students: normalizedStudents, issues };
}

export async function downloadManagerImportTemplate() {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rèn Luyện DLU";

  const classSheet = workbook.addWorksheet("Lớp sinh hoạt");
  classSheet.addRow(["Mã lớp", "Khoa / Đơn vị", "Năm học"]);
  classSheet.getRow(1).font = { bold: true };
  classSheet.columns = [{ width: 18 }, { width: 30 }, { width: 18 }];

  const studentSheet = workbook.addWorksheet("Sinh viên");
  studentSheet.addRow([
    "MSSV",
    "Họ và tên",
    "Số điện thoại",
    "Email đăng nhập",
    "Lớp",
    "Giới tính",
    "Ngày sinh",
    "Nơi sinh",
  ]);
  studentSheet.getRow(1).font = { bold: true };
  studentSheet.columns = [
    { width: 18 },
    { width: 28 },
    { width: 20 },
    { width: 32 },
    { width: 16 },
    { width: 14 },
    { width: 16 },
    { width: 24 },
  ];

  const guideSheet = workbook.addWorksheet("Hướng dẫn");
  guideSheet.addRows([
    ["Sheet", "Cột bắt buộc", "Ghi chú"],
    [
      "Lớp sinh hoạt",
      "Mã lớp",
      "Khoa / Đơn vị và Năm học không bắt buộc. Lớp mới bắt đầu với 0 sinh viên.",
    ],
    [
      "Sinh viên",
      "MSSV, Họ và tên, Email đăng nhập, Lớp, Ngày sinh",
      "Lớp phải có trong hệ thống hoặc trong sheet Lớp sinh hoạt. Ngày sinh dùng YYYY-MM-DD hoặc DD/MM/YYYY. Giới tính để trống mặc định Nam.",
    ],
  ]);
  guideSheet.getRow(1).font = { bold: true };
  guideSheet.columns = [{ width: 20 }, { width: 58 }, { width: 90 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mau-import-lop-sinh-vien.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
