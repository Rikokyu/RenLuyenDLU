const headers = ["Mã sinh viên", "Họ tên", "Lớp", "Chuyên ngành", "Khoa", "Tên hoạt động", "Giờ nộp minh chứng (UTC+7)", "Số điểm hoạt động", "Trạng thái minh chứng"];
const statusLabels = { 0: "Chờ duyệt", 1: "Đã duyệt", 2: "Đã từ chối", 3: "Cần bổ sung" };

export function hasReportFilters(filters) {
  return Boolean(filters.search?.trim() || filters.facultyId || filters.majorId || filters.classId);
}

export async function buildReportWorkbook(data, filters, createdAt = new Date()) {
  if (!Array.isArray(data.items) || data.items.length !== data.total) {
    throw new Error("Dữ liệu xuất chưa đầy đủ. Vui lòng thử lại.");
  }
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rèn Luyện DLU";
  workbook.created = createdAt;
  const sheet = workbook.addWorksheet("Chi tiết minh chứng");
  sheet.columns = headers.map((header, index) => ({ header, width: [18, 30, 16, 30, 30, 48, 29, 20, 24][index] }));
  for (const item of data.items) {
    // Excel has no time-zone type: store Vietnam wall-clock time, explicitly labelled UTC+7.
    const submittedAt = item.submittedAt ? new Date(new Date(item.submittedAt).getTime() + 7 * 3600000) : null;
    const row = sheet.addRow([
      String(item.studentId ?? ""), String(item.studentName ?? ""), String(item.className ?? ""),
      String(item.major ?? ""), String(item.faculty ?? ""), String(item.eventName ?? ""),
      submittedAt || (item.evidenceId == null ? "Chưa nộp" : "Chưa ghi nhận"), item.activityScore ?? null,
      item.evidenceId == null ? "Chưa nộp" : statusLabels[item.status] || "Chưa xác định",
    ]);
    row.getCell(1).numFmt = "@";
    if (submittedAt) row.getCell(7).numFmt = "dd/mm/yyyy hh:mm:ss";
    row.getCell(8).numFmt = "0";
    row.alignment = { vertical: "middle", wrapText: true };
  }
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: 9 } };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF087A4B" } };
  sheet.getRow(1).alignment = { wrapText: true, vertical: "middle" };
  sheet.getRow(1).height = 32;

  const findLabel = (id, idKey, nameKey) => {
    if (!id) return "Tất cả";
    return data.classes?.find((c) => String(c[idKey]) === String(id))?.[nameKey] || `ID ${id}`;
  };
  const info = workbook.addWorksheet("Thông tin báo cáo");
  info.columns = [{ header: "Thông tin", width: 28 }, { header: "Giá trị", width: 80 }];
  info.addRows([
    ["Phạm vi", data.scopeName],
    ["Kiểu xuất", hasReportFilters(filters) ? "Danh sách đã lọc" : "Toàn bộ danh sách trong phạm vi"],
    ["Thời điểm xuất (UTC+7)", new Date(createdAt.getTime() + 7 * 3600000)],
    ["Từ khóa", filters.search?.trim() || "Không có"],
    ["Khoa", findLabel(filters.facultyId, "facultyId", "facultyName")],
    ["Chuyên ngành", findLabel(filters.majorId, "majorId", "majorName")],
    ["Lớp", findLabel(filters.classId, "id", "name")],
    ["Số bản ghi", data.total],
    ["Dữ liệu", "Minh chứng mới nhất của đăng ký còn hiệu lực; toàn bộ trang kết quả, toàn bộ thời gian."],
  ]);
  info.getCell("B4").numFmt = "dd/mm/yyyy hh:mm:ss";
  info.getRow(1).font = { bold: true };
  info.eachRow((row) => { row.alignment = { vertical: "middle", wrapText: true }; });
  return workbook;
}

export async function saveReportExcel(data, filters, { signal } = {}) {
  const now = new Date();
  const workbook = await buildReportWorkbook(data, filters, now);
  const buffer = await workbook.xlsx.writeBuffer();
  if (signal?.aborted) return null;
  const stamp = new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const filename = `bao-cao-minh-chung-${hasReportFilters(filters) ? "da-loc" : "tat-ca"}-${stamp}.xlsx`;
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link);
  try { link.click(); } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  return filename;
}
