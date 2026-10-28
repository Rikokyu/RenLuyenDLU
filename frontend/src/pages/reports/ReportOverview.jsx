import { useEffect, useState } from "react";
import { getReportOverview } from "../../services/reportService";
import "./ReportOverview.css";

const number = (value) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
const rate = (value) => value == null ? "Chưa có dữ liệu" : `${number(value)}%`;
const date = (value) => value.split("-").reverse().join("/");
const range = (period) => `${date(period.fromDate)} – ${date(period.toDate)}`;

function change(value, unit) {
  if (value == null) return { text: "Chưa đủ dữ liệu kỳ trước", direction: "neutral", arrow: "" };
  return {
    text: `${value > 0 ? "+" : ""}${number(value)}${unit} so với kỳ trước`,
    direction: value > 0 ? "positive" : value < 0 ? "negative" : "neutral",
    arrow: value > 0 ? "↑ " : value < 0 ? "↓ " : "",
  };
}

export default function ReportOverview({ onPeriodChange }) {
  const [dates, setDates] = useState({ fromDate: "", toDate: "" });
  const [query, setQuery] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    getReportOverview({ ...query, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        if (onPeriodChange) onPeriodChange(query);
        setDates({ fromDate: result.period.fromDate, toDate: result.period.toDate });
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.response?.data?.message || "Không thể kết nối API báo cáo.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, onPeriodChange]);

  const current = data?.current;
  const changes = data?.changes;
  const cards = current ? [
    {
      title: "SINH VIÊN THAM GIA HOẠT ĐỘNG", type: "blue", icon: "👥",
      value: number(current.participatingStudents),
      subtext: `${rate(current.participationRate)} tổng sinh viên — ${data.scopeName}`,
      change: change(changes.participatingStudentsPercent, "%"),
    },
    {
      title: "SỰ KIỆN ĐÃ TỔ CHỨC", type: "green", icon: "🎯",
      value: number(current.organizedEvents),
      subtext: `${number(current.schoolEvents)} cấp Trường, ${number(current.facultyEvents)} cấp Khoa${current.unclassifiedEvents ? `, ${number(current.unclassifiedEvents)} chưa phân loại` : ""}`,
      change: change(changes.organizedEvents, " sự kiện"),
    },
    {
      title: "TỶ LỆ CHECK-IN (QUY ĐỔI)", type: "purple", icon: "📈",
      value: rate(current.checkInRate),
      subtext: `${number(current.confirmedParticipations)} lượt được duyệt / ${number(current.registrations)} lượt đăng ký`,
      change: change(changes.checkInPercentagePoints, " điểm %"),
    },
    {
      title: "TỔNG GIỜ TÌNH NGUYỆN", type: "orange", icon: "⏱️",
      value: `${number(current.volunteerHours)} giờ`,
      subtext: "Quy đổi từ thời lượng hoạt động có minh chứng được duyệt",
      change: change(changes.volunteerHoursPercent, "%"),
    },
  ] : [];

  function submit(event) {
    event.preventDefault();
    if (dates.fromDate > dates.toDate) { setError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc."); return; }
    setQuery({ ...dates });
  }

  return (
    <section className="report-overview" aria-label="Thống kê tổng quan từ database" aria-busy={loading}>
      <form className="report-overview__filters" onSubmit={submit}>
        <label>Từ ngày <input type="date" required value={dates.fromDate} onChange={(e) => setDates({ ...dates, fromDate: e.target.value })} /></label>
        <label>Đến ngày <input type="date" required value={dates.toDate} onChange={(e) => setDates({ ...dates, toDate: e.target.value })} /></label>
        <button className="btn btn-primary" disabled={loading} type="submit">Xem thống kê</button>
        <button className="btn btn-outline" disabled={loading} type="button" onClick={() => setQuery({})}>Học kỳ hiện tại</button>
      </form>
      {loading && <p role="status">Đang tải thống kê…</p>}
      {error && <p role="alert">{error} <button className="btn btn-outline" type="button" onClick={() => setQuery({ ...query })}>Thử lại</button></p>}
      {data && <>
        <p className="report-overview__note">{data.scopeName} · Kỳ báo cáo: {range(data.period)} · So sánh: {range(data.previousPeriod)}.</p>
        <div className="kpi-grid">
          {cards.map((card) => <article className={`kpi-card kpi-${card.type}`} key={card.type}>
            <div className="kpi-header"><span className="kpi-title">{card.title}</span><span className="kpi-icon" aria-hidden="true">{card.icon}</span></div>
            <div className="kpi-body"><h3 className="kpi-value">{card.value}</h3><p className="kpi-subtext">{card.subtext}</p></div>
            <div className="kpi-footer"><span className={`kpi-trend ${card.change.direction}`}>{card.change.arrow}{card.change.text}</span></div>
          </article>)}
        </div>
      </>}
    </section>
  );
}
