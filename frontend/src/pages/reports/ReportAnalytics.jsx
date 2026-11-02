import { useEffect, useState } from "react";
import { getReportAnalytics } from "../../services/reportService";
import "./ReportAnalytics.css";

const number = (n) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(n);
const percent = (n) => n == null ? "—" : `${number(n)}%`;
const colors = ["#10b981", "#2563eb", "#f59e0b", "#eab308", "#ef4444"];
const semesterLabel = (s) => `HK ${s.semester} (${s.year})`;

export default function ReportAnalytics({ periodQuery }) {
  const [schoolYearId, setSchoolYearId] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("attended");
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null);
    getReportAnalytics({ ...periodQuery, schoolYearId, page, sort, signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.response?.data?.message || "Không thể kết nối API phân tích báo cáo."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [periodQuery, schoolYearId, page, sort, retry]);

  return <section className="report-analytics" aria-label="Phân tích điểm và tham gia hoạt động" aria-busy={loading}>
    {loading && <p role="status">Đang tải phân tích điểm và hoạt động…</p>}
    {error && <p role="alert">{error} <button type="button" className="btn btn-outline" onClick={() => setRetry((n) => n + 1)}>Thử lại</button></p>}
    {data && <>
      <p className="report-analytics__note">{data.scopeName} · Hoạt động kết thúc từ {data.period.fromDate} đến {data.period.toDate}. Dùng bộ lọc ngày ở phần tổng quan để thay đổi khoảng hoạt động.</p>
      <div className="analytics-section">
        <article className="card analytics-card">
          <div className="card-header"><div><h3>Phân Loại Điểm Rèn Luyện</h3><p>Điểm cuối cùng đã ghi nhận theo học kỳ</p></div></div>
          <div className="card-body">
            <label>Học kỳ điểm rèn luyện
              <select value={schoolYearId} onChange={(e) => { setSchoolYearId(e.target.value); setPage(1); }}>
                <option value="">Tự chọn theo ngày bắt đầu báo cáo</option>
                {data.semesters.map((s) => <option key={s.id} value={s.id}>{semesterLabel(s)}</option>)}
              </select>
            </label>
            <p className="report-analytics__note">{data.scores.semester ? semesterLabel(data.scores.semester) : "Chưa có học kỳ tương ứng trong dữ liệu"} · {number(data.scores.gradedStudents)}/{number(data.scores.totalStudents)} sinh viên có điểm hợp lệ.</p>
            <div className="category-list">
              {data.scores.bands.map((band, i) => <div key={band.key} className="category-item">
                <div className="category-info"><span className="cat-name">{band.label}</span><span className="cat-count">{number(band.count)} SV ({percent(band.percentage)})</span></div>
                <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${band.percentage || 0}%`, backgroundColor: colors[i] }} /></div>
              </div>)}
            </div>
          </div>
        </article>
        <article className="card analytics-card">
          <div className="card-header"><div><h3>Check-in / Đăng Ký Theo Sự Kiện</h3><p>Tham gia và no-show quy đổi từ minh chứng</p></div></div>
          <div className="card-body">
            <label>Sắp xếp sự kiện
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                <option value="attended">Lượt tham gia cao nhất</option><option value="registered">Lượt đăng ký cao nhất</option><option value="no_show">Tỷ lệ no-show cao nhất</option>
              </select>
            </label>
            <div className="faculty-table-wrapper"><table className="mini-table">
              <thead><tr><th>Sự kiện</th><th>Đăng ký</th><th>Tham gia</th><th>Tỷ lệ</th><th>No-show</th></tr></thead>
              <tbody>{data.events.map((e) => <tr key={e.id}>
                <td><strong>{e.title}</strong><small className="report-analytics__detail">{e.code}{e.pending > 0 ? ` · ${number(e.pending)} chờ xử lý minh chứng` : ""}</small></td>
                <td>{number(e.registered)}</td><td>{number(e.attended)}</td><td>{percent(e.checkInRate)}</td><td>{number(e.noShow)} ({percent(e.noShowRate)})</td>
              </tr>)}
              {!data.events.length && <tr><td colSpan={5}>Không có sự kiện trong trang này.</td></tr>}</tbody>
            </table></div>
            <div className="report-analytics__pages"><button className="btn btn-outline" type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</button><span>Trang {page}/{Math.max(1, Math.ceil(data.eventTotal / data.pageSize))} · {number(data.eventTotal)} sự kiện</span><button className="btn btn-outline" type="button" disabled={page * data.pageSize >= data.eventTotal} onClick={() => setPage((p) => p + 1)}>Sau</button></div>
          </div>
        </article>
        <article className="card analytics-card">
          <div className="card-header"><div><h3>Top Sinh Viên Tích Cực</h3><p>Xếp theo số hoạt động xác nhận, sau đó giờ quy đổi</p></div></div>
          <div className="card-body"><ul className="top-list">
            {data.topStudents.map((s) => <li className="top-item" key={s.id}>
              <span className={`rank-badge rank-${s.rank}`}>{s.rank}</span>
              <div className="top-user"><strong>{s.name}</strong><small>{s.studentCode} · {s.classCode}</small><small>{s.faculty}</small></div>
              <div className="top-stats"><span>{number(s.events)} sự kiện</span><span className="highlight">{number(s.hours)} giờ quy đổi</span></div>
            </li>)}
          </ul>{!data.topStudents.length && <p>Chưa có sinh viên có minh chứng được duyệt trong khoảng này.</p>}</div>
        </article>
      </div>
    </>}
  </section>;
}
