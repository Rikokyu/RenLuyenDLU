import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { buildReportWorkbook, hasReportFilters } from "./reportExport.js";

test("Excel exports all rows, exact string IDs, numeric zero, Vietnam time and literal formula-looking text", async () => {
  const items = Array.from({ length: 25 }, (_, id) => ({
    id, studentId: "001234", studentName: "Nguyễn Văn An", className: "CT1", major: "CNTT", faculty: "Khoa CNTT",
    eventName: "=HYPERLINK(\"https://example.com\")", activityScore: 0,
    submittedAt: "2026-10-22T16:59:59Z", evidenceId: id + 1, status: 1,
  }));
  items[24] = { ...items[24], submittedAt: null, evidenceId: null, status: null, activityScore: null };
  const filters = { facultyId: "1", search: "An" };
  const workbook = await buildReportWorkbook({ items, total: 25, scopeName: "Toàn trường", classes: [{ facultyId: 1, facultyName: "Khoa CNTT" }] }, filters);
  const roundtrip = new ExcelJS.Workbook();
  await roundtrip.xlsx.load(await workbook.xlsx.writeBuffer());
  const sheet = roundtrip.getWorksheet("Chi tiết minh chứng");
  assert.equal(sheet.rowCount, 26);
  assert.equal(sheet.columnCount, 9);
  assert.equal(sheet.getCell("A2").value, "001234");
  assert.equal(sheet.getCell("F2").value, items[0].eventName);
  assert.equal(sheet.getCell("F2").type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell("H2").value, 0);
  assert.equal(sheet.getCell("G2").value.toISOString(), "2026-10-22T23:59:59.000Z");
  assert.equal(sheet.getCell("I2").value, "Đã duyệt");
  assert.equal(sheet.getCell("I26").value, "Chưa nộp");
  assert.equal(sheet.getCell("H26").value, null);
  assert.equal(roundtrip.getWorksheet("Thông tin báo cáo").getCell("B6").value, "Khoa CNTT");
});

test("empty export keeps headers and missing pages are rejected", async () => {
  const workbook = await buildReportWorkbook({ items: [], total: 0, classes: [] }, {});
  assert.equal(workbook.getWorksheet(1).rowCount, 1);
  assert.equal(hasReportFilters({ search: "  " }), false);
  assert.equal(hasReportFilters({ classId: "1" }), true);
  await assert.rejects(buildReportWorkbook({ items: [], total: 1 }, {}), /chưa đầy đủ/);
});
