import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardOverview } from "../../services/dashboardService";
import { getCurrentUser } from "../../store/authStore";
import DashboardPanel from "./DashboardPanel";
import "./TeacherDashboard.css";

export default function TeacherDashboard() {
  const user = getCurrentUser();
  const role = user?.role;
  const isTeacher = role === "HOMEROOM_TEACHER";
  const scopeLabel = role === "ADMIN"
    ? "Toàn trường"
    : role === "STUDENT_AFFAIRS_ASSISTANT"
      ? `Khoa ${user?.faculty || ""}`.trim()
      : `Lớp ${user?.classCode || ""}`.trim();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboard = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const result = await getDashboardOverview({ signal });
      setOverview(result);
    } catch (requestError) {
      if (requestError.name !== "AbortError" && requestError.code !== "ERR_CANCELED") {
        setError(
          requestError.response?.data?.message ||
            "Không thể tải dữ liệu trang chủ. Vui lòng thử lại.",
        );
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard, refreshKey]);

  const managedActivities = useMemo(
    () => overview?.activities || [],
    [overview],
  );

  const now = Date.now();
  const upcomingActivities = managedActivities
    .filter((activity) => (
      Number(activity.status) !== 0 &&
      new Date(activity.timeBegin).getTime() > now
    ))
    .sort((left, right) => (
      new Date(left.timeBegin).getTime() - new Date(right.timeBegin).getTime()
    ));
  const totalRegistrations = overview?.registrationCount || 0;
  const registrationCapacity = managedActivities.reduce(
    (total, activity) => total + Number(activity.slot || 0),
    0,
  );
  const fillRate = registrationCapacity
    ? Math.round((totalRegistrations / registrationCapacity) * 100)
    : 0;
  const activeActivities = managedActivities.filter((activity) => (
    Number(activity.status) !== 0 && new Date(activity.timeEnd).getTime() > now
  ));
  const openActivities = activeActivities.filter((activity) => (
    Number(activity.registeredCount) < Number(activity.slot)
  ));
  const endedActivities = overview?.completedActivities || 0;
  const monthCounts = getMonthlyActivityCounts(managedActivities);
  const maxMonthCount = Math.max(1, ...monthCounts.map((month) => month.count));
  const popularActivities = [...managedActivities]
    .sort((left, right) => Number(right.registeredCount) - Number(left.registeredCount))
    .slice(0, 5);

  const teacherStats = [
    [role === "ADMIN" ? "Hoạt động đã tổ chức" : "Hoạt động trong phạm vi", overview?.activityCount ?? "—", scopeLabel, "▱"],
    ["Sinh viên đã đăng ký", overview?.participatingStudents ?? "—", `Trong ${formatNumber(overview?.totalStudents || 0)} sinh viên`, "◉"],
    ["Lượt đăng ký", totalRegistrations, `Lấp đầy ${fillRate}% tổng số chỗ`, "↗"],
    ["Tỷ lệ hoàn thành", `${overview?.completionRate ?? 0}%`, "Minh chứng được duyệt sau khi hoạt động kết thúc", "✓"],
    ["Đang diễn ra", overview?.runningActivities ?? 0, "Trong phạm vi dashboard", "◷"],
    ["Minh chứng chờ duyệt", overview?.pendingEvidence ?? 0, "Trong phạm vi dashboard", "▦"],
  ];

  const activeShare = managedActivities.length
    ? Math.round((activeActivities.length / managedActivities.length) * 100)
    : 0;

  return (
    <div className="dashboard-teacher">
      <section className="dashboard-hero dashboard-hero--dark">
        <div className="dashboard-eyebrow">
          {scopeLabel}
        </div>
        <h1>
          {isTeacher ? `Tổng quan lớp ${overview?.scopeName || user?.classCode || ""}` :
            role === "CLASS_OFFICER" ? `Tổng quan lớp ${overview?.scopeName || user?.classCode || ""}` :
              role === "STUDENT_AFFAIRS_ASSISTANT"
                ? `Tổng quan khoa ${overview?.scopeName || user?.faculty || ""}`
                : "Tổng quan hoạt động toàn trường"}
        </h1>
        <p>
          Theo dõi sinh viên, lượt đăng ký, hoạt động và tiến độ minh chứng trong phạm vi {overview?.scopeName || scopeLabel}.
        </p>
        <div className="teacher-stat-grid">
          {teacherStats.map(([label, value, note, icon]) => (
            <article className="teacher-stat" key={label}>
              <div className="teacher-stat__top">
                <span>{label}</span>
                <b>{icon}</b>
              </div>
              <strong>{loading ? "…" : formatNumber(value)}</strong>
              <small>{note}</small>
            </article>
          ))}
        </div>
      </section>

      {error && (
        <div className="dashboard-data-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>
            Thử lại
          </button>
        </div>
      )}

      <div className="dashboard-grid dashboard-grid--teacher">
        <DashboardPanel
          title="Hoạt động theo tháng"
          subtitle={`Hoạt động có sinh viên trong ${overview?.scopeName || scopeLabel}, theo tháng bắt đầu`}
          wide
        >
          {loading ? (
            <p className="dashboard-empty">Đang tải số liệu...</p>
          ) : managedActivities.length ? (
            <>
              <div className="chart-bars">
                {monthCounts.map(({ label, count }) => (
                  <div className="chart-bar-group" key={label}>
                    <div className="chart-bars__columns">
                      <i
                        style={{ height: `${Math.max(8, (count / maxMonthCount) * 100)}%` }}
                        title={`${count} hoạt động`}
                      />
                    </div>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <p className="chart-legend">
                <span className="legend-blue">■</span> Số hoạt động theo tháng
              </p>
            </>
          ) : (
            <p className="dashboard-empty">Chưa có hoạt động để thống kê.</p>
          )}
        </DashboardPanel>

        {role === "STUDENT_AFFAIRS_ASSISTANT" && (
          <DashboardPanel
            title="Thông báo trong khoa"
            subtitle="Đăng ký gần đây và minh chứng đã nộp của sinh viên"
            wide
          >
            <div className="dashboard-notification-columns">
              <section>
                <h3>Sinh viên đăng ký hoạt động</h3>
                {(overview?.recentRegistrations || []).length ? (
                  overview.recentRegistrations.map((item, index) => (
                    <p className="dashboard-notification" key={`${item.studentId}-${item.activityId}-${index}`}>
                      <Link to={`/activities/${item.activityId}`}>{item.studentName} ({item.studentId})</Link>
                      {" đã đăng ký "}
                      <strong>{item.activity}</strong>
                      <small>{formatDate(item.registeredAt)}</small>
                    </p>
                  ))
                ) : <p className="dashboard-empty">Chưa có đăng ký gần đây.</p>}
              </section>
              <section>
                <h3>Minh chứng sinh viên</h3>
                {(overview?.recentEvidence || []).length ? (
                  overview.recentEvidence.map((item, index) => (
                    <p className="dashboard-notification" key={`${item.studentId}-${item.activityId}-${index}`}>
                      <Link to="/evidence">{item.studentName} ({item.studentId})</Link>
                      {" đã nộp minh chứng cho "}
                      <strong>{item.activity}</strong>
                      <small>{formatDate(item.submittedAt)}</small>
                    </p>
                  ))
                ) : <p className="dashboard-empty">Chưa có minh chứng gần đây.</p>}
              </section>
            </div>
          </DashboardPanel>
        )}

        <DashboardPanel
          title="Trạng thái hoạt động"
          subtitle={`Tình trạng trong ${overview?.scopeName || scopeLabel}`}
        >
          <div
            className="donut-chart"
            style={{
              background: `conic-gradient(#11b887 0 ${activeShare}%, #e7edf2 ${activeShare}% 100%)`,
            }}
          >
            <strong>
              {loading ? "…" : `${activeShare}%`}
              <small>ĐANG HOẠT ĐỘNG</small>
            </strong>
          </div>
          <ul className="score-legend">
            <li><i className="dot-green" /> Chưa kết thúc <b>{loading ? "…" : activeActivities.length}</b></li>
            <li><i className="dot-blue" /> Đã kết thúc <b>{loading ? "…" : endedActivities}</b></li>
            <li><i className="dot-orange" /> Còn chỗ đăng ký <b>{loading ? "…" : openActivities.length}</b></li>
          </ul>
        </DashboardPanel>

        <DashboardPanel
          title="Hoạt động có nhiều lượt đăng ký"
          subtitle="Xếp theo số sinh viên đã đăng ký"
          wide
        >
          {loading ? (
            <p className="dashboard-empty">Đang tải hoạt động...</p>
          ) : popularActivities.length ? (
            popularActivities.map((activity, index) => {
              const percent = activity.slot
                ? Math.min(100, Math.round((activity.registeredCount / activity.slot) * 100))
                : 0;
              return (
                <div className="campaign-row" key={activity.id}>
                  <span>
                    <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
                    <b>{activity.registeredCount}/{activity.slot} đăng ký</b>
                  </span>
                  <i><em style={{ width: `${percent}%` }} /></i>
                  <small>{percent}%</small>
                  {index === 0 && <span className="dashboard-row-note">Đang thu hút nhiều đăng ký nhất</span>}
                </div>
              );
            })
          ) : (
            <p className="dashboard-empty">Chưa có hoạt động để hiển thị.</p>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Hoạt động sắp diễn ra"
          subtitle="Các hoạt động có ngày bắt đầu gần nhất"
        >
          {loading ? (
            <p className="dashboard-empty">Đang tải hoạt động...</p>
          ) : upcomingActivities.length ? (
            upcomingActivities.slice(0, 5).map((activity) => (
              <div className="dashboard-upcoming" key={activity.id}>
                <div>
                  <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
                  <small>{formatDate(activity.timeBegin)}</small>
                </div>
                <b>{activity.registeredCount}/{activity.slot}</b>
              </div>
            ))
          ) : (
            <p className="dashboard-empty">Hiện chưa có hoạt động sắp tới.</p>
          )}
          <Link className="dashboard-panel-link" to="/activities">
            Quản lý danh sách hoạt động
          </Link>
        </DashboardPanel>

        <DashboardPanel
          title="Minh chứng"
          subtitle={`Số liệu trong ${overview?.scopeName || scopeLabel}`}
        >
          <div className="dashboard-evidence-summary">
            <strong>{loading ? "…" : formatNumber(overview?.pendingEvidence ?? 0)}</strong>
            <span>minh chứng đang chờ duyệt</span>
          </div>
          <div className="dashboard-evidence-row">
            <span>Hoạt động đã kết thúc</span>
            <b>{loading ? "…" : formatNumber(overview?.completedActivities ?? 0)}</b>
          </div>
          <div className="dashboard-evidence-row">
            <span>Tỷ lệ hoàn thành</span>
            <b>{loading ? "…" : `${overview?.completionRate ?? 0}%`}</b>
          </div>
          <Link className="dashboard-panel-link" to="/evidence">
            Mở trang minh chứng
          </Link>
        </DashboardPanel>
      </div>
    </div>
  );
}

function getMonthlyActivityCounts(activities) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: new Intl.DateTimeFormat("vi-VN", { month: "short" }).format(date),
      count: 0,
    };
  });

  for (const activity of activities) {
    const date = new Date(activity.timeBegin);
    const month = months.find(
      (item) => item.year === date.getFullYear() && item.month === date.getMonth(),
    );
    if (month) month.count += 1;
  }
  return months;
}

function formatNumber(value) {
  if (typeof value === "string" && Number.isNaN(Number(value))) return value;
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa xác định";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
