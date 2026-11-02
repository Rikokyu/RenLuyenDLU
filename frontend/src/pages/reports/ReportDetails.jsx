import { useEffect, useRef, useState } from "react";
import { getReportDetails, getReportExport } from "../../services/reportService";
import { hasReportFilters, saveReportExcel } from "../../utils/reportExport";

const emptyFilters = { search: "", facultyId: "", majorId: "", classId: "" };
const statuses = { 0: ["Chờ duyệt", "badge-warning"], 1: ["Đã duyệt", "badge-success"], 2: ["Đã từ chối", "badge-danger"], 3: ["Cần bổ sung", "badge-warning"] };
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" });
const distinctOptions = (items, idKey, nameKey) => [...new Map(items.filter((c) => c[idKey]).map((c) => [c[idKey], { id: c[idKey], name: c[nameKey] }])).values()].sort((a, b) => a.name.localeCompare(b.name, "vi"));

export default function ReportDetails() {
  const [draft, setDraft] = useState(emptyFilters);
  const [query, setQuery] = useState({ ...emptyFilters, page: 1 });
  const [data, setData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [exportError, setExportError] = useState("");
  const exportController = useRef(null);
  useEffect(() => () => exportController.current?.abort(), []);

  async function exportExcel() {
    if (exportController.current || loading || !data) return;
    const controller = new AbortController();
    exportController.current = controller;
    const appliedFilters = { ...query };
    setExporting(true); setExportMessage(""); setExportError("");
    try {
      const result = await getReportExport({ ...appliedFilters, signal: controller.signal });
      if (controller.signal.aborted) return;
      const filename = await saveReportExcel(result, appliedFilters, { signal: controller.signal });
      if (filename) setExportMessage(`Đã tạo file ${filename} gồm ${result.total} bản ghi. Trình duyệt sẽ tải file xuống.`);
    } catch (err) {
      if (!controller.signal.aborted) setExportError(err.response?.data?.message || err.message || "Không thể xuất Excel. Vui lòng thử lại.");
    } finally {
      exportController.current = null;
      if (!controller.signal.aborted) setExporting(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null);
    getReportDetails({ ...query, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result); setClasses(result.classes);
      })
      .catch((err) => { if (!controller.signal.aborted) setError(err.response?.data?.message || "Không thể kết nối API danh sách báo cáo."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query]);

  const faculties = distinctOptions(classes, "facultyId", "facultyName");
  const facultyClasses = classes.filter((c) => !draft.facultyId || String(c.facultyId) === draft.facultyId);
  const majors = distinctOptions(facultyClasses, "majorId", "majorName");
  const classOptions = facultyClasses.filter((c) => !draft.majorId || String(c.majorId) === draft.majorId);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const from = data?.items.length ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data?.items.length ? from + data.items.length - 1 : 0;

  return <section className="card data-grid-section" aria-busy={loading}>
    <div className="card-header border-bottom"><div>
      <h3>Danh Sách Chi Tiết Minh Chứng Hoạt Động</h3>
      <p>Thông tin sinh viên, hoạt động và minh chứng mới nhất{data ? ` · ${data.scopeName}` : ""}. Danh sách toàn bộ thời gian, lọc riêng bên dưới.</p>
    </div><div className="export-hub-btns">
      <button type="button" className="btn btn-sm btn-outline" disabled title="Chức năng xuất PDF chưa được triển khai">📄 In PDF (A4)</button>
      <button type="button" className="btn btn-sm btn-success" disabled={loading || !data || exporting} onClick={exportExcel} title="Xuất toàn bộ kết quả theo bộ lọc đã áp dụng, không chỉ trang hiện tại">
        {exporting ? "Đang tạo Excel…" : `📊 Xuất Excel ${hasReportFilters(query) ? "đã lọc" : "tất cả"}`}
      </button>
    </div></div>
    {exportMessage && <p role="status">{exportMessage}</p>}
    {exportError && <p role="alert">{exportError}</p>}
    <form className="filter-bar" onSubmit={(e) => { e.preventDefault(); setQuery({ ...draft, page: 1 }); }}>
      <div className="search-box"><span className="search-icon" aria-hidden="true">🔍</span><input aria-label="Tìm kiếm sinh viên hoặc hoạt động" placeholder="Tìm họ tên, MSSV, tên hoặc mã hoạt động..." value={draft.search} maxLength={200} onChange={(e) => setDraft({ ...draft, search: e.target.value })} /></div>
      <div className="filter-group">
        <select aria-label="Khoa" value={draft.facultyId} onChange={(e) => setDraft({ ...draft, facultyId: e.target.value, majorId: "", classId: "" })}>
          <option value="">Tất cả khoa</option>{faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select aria-label="Chuyên ngành" value={draft.majorId} onChange={(e) => setDraft({ ...draft, majorId: e.target.value, classId: "" })}>
          <option value="">Tất cả ngành</option>{majors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select aria-label="Lớp" value={draft.classId} onChange={(e) => setDraft({ ...draft, classId: e.target.value })}>
          <option value="">Tất cả lớp</option>{classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" className="btn btn-primary" disabled={loading}>Lọc dữ liệu</button>
        <button type="button" className="btn btn-outline" disabled={loading} onClick={() => { setDraft(emptyFilters); setQuery({ ...emptyFilters, page: 1 }); }}>Đặt lại</button>
      </div>
    </form>
    {error && <p role="alert">{error} <button type="button" className="btn btn-outline" onClick={() => setQuery({ ...query })}>Thử lại</button></p>}
    <div className="table-wrapper"><table className="main-table report-evidence-table" aria-label="Danh sách chi tiết minh chứng hoạt động">
      <thead><tr>{["Mã sinh viên", "Họ tên", "Lớp", "Chuyên ngành", "Khoa", "Tên hoạt động", "Giờ nộp minh chứng", "Số điểm hoạt động", "Trạng thái minh chứng"].map((name) => <th scope="col" key={name}>{name}</th>)}</tr></thead>
      <tbody>
        {loading && <tr><td colSpan={9} role="status">Đang tải danh sách…</td></tr>}
        {!loading && !error && !data?.items.length && <tr><td colSpan={9}>Không có dữ liệu phù hợp với bộ lọc.</td></tr>}
        {data?.items.map((row) => {
          const [label, badge] = row.evidenceId == null ? ["Chưa nộp", "badge-default"] : statuses[row.status] || ["Chưa xác định", "badge-default"];
          return <tr key={row.id}>
            <td><code>{row.studentId}</code></td><td><strong>{row.studentName}</strong></td>
            <td>{row.className || "—"}</td><td>{row.major || "—"}</td><td>{row.faculty || "—"}</td>
            <td><strong>{row.eventName}</strong></td><td>{row.submittedAt ? dateFormatter.format(new Date(row.submittedAt)) : row.evidenceId == null ? "Chưa nộp" : "Chưa ghi nhận"}</td>
            <td className="report-evidence-score"><strong>{row.activityScore ?? "—"}</strong></td>
            <td><span className={`status-badge ${badge}`}>{label}</span></td>
          </tr>;
        })}
      </tbody>
    </table></div>
    {data && <div className="table-footer"><span className="text-muted">Hiển thị {from}–{to} trong {data.total} bản ghi</span>
      <div className="pagination"><button type="button" className="btn-page" disabled={loading || query.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Trang trước</button>
        <span>Trang {query.page}/{pages}</span>
        <button type="button" className="btn-page" disabled={loading || query.page >= pages} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Trang sau</button>
      </div>
    </div>}
  </section>;
}
