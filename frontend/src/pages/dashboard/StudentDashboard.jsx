import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile } from "../../services/authService";
import { getActivities } from "../../services/activityService";
import { getCurrentUser } from "../../store/authStore";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const user = getCurrentUser();
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboard = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const [profileResult, activityResult] = await Promise.all([
        getProfile({ signal }),
        getActivities({ signal }),
      ]);
      setProfile(profileResult);
      setActivities(activityResult.items);
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

  const upcomingActivities = useMemo(() => {
    const now = Date.now();
    return activities
      .filter((activity) => {
        const startsAt = new Date(activity.timeBegin).getTime();
        const endsAt = new Date(activity.timeEnd).getTime();
        const isRunning = startsAt <= now && endsAt > now;
        const hasSpace = Number(activity.registeredCount) < Number(activity.slot);
        return Number(activity.status) !== 0 &&
          endsAt > now &&
          (isRunning || hasSpace);
      })
      .sort((left, right) => (
        new Date(left.timeBegin).getTime() - new Date(right.timeBegin).getTime()
      ))
      .slice(0, 6);
  }, [activities]);

  const history = profile?.activities || [];
  const pendingEvidence = history.filter(
    (activity) => activity.evidenceStatus === "Chờ duyệt",
  ).length;
  const activeRegistrations = history.filter(
    (activity) => activity.registrationStatus === "Đã đăng ký",
  ).length;
  const featuredActivity = upcomingActivities[0];

  return (
    <div className="student-home">
      <main className="student-content">
        <section className="student-hero">
          <div className="student-hero__content">
            <span className="student-pill">CỔNG SINH VIÊN</span>
            <h2>Xin chào, {profile?.user?.lastName || user?.name || "bạn"}!</h2>
            <p>
              Theo dõi hoạt động rèn luyện, điểm số và tình trạng minh chứng
              ngay tại trang chủ.
            </p>
            <Link to="/activities" className="student-primary-button">
              Tìm hoạt động để đăng ký
            </Link>
          </div>

          <aside className="student-news-panel">
            <h3>TỔNG QUAN CỦA BẠN</h3>
            {loading ? (
              <p className="student-dashboard-message">Đang tải dữ liệu...</p>
            ) : (
              <ul className="student-summary-list">
                <li>
                  <span>Điểm rèn luyện</span>
                  <strong>{profile?.trainingScore ?? 0}/100</strong>
                </li>
                <li>
                  <span>Xếp loại hiện tại</span>
                  <strong>{profile?.trainingRank || "Chưa có điểm"}</strong>
                </li>
                <li>
                  <span>Hoạt động đã đăng ký</span>
                  <strong>{activeRegistrations}</strong>
                </li>
                <li>
                  <span>Minh chứng chờ duyệt</span>
                  <strong>{pendingEvidence}</strong>
                </li>
              </ul>
            )}
            <div className="student-dashboard-links">
              <Link to="/profile">Xem hồ sơ và lịch sử</Link>
              <Link to="/evidence">Quản lý minh chứng</Link>
            </div>
          </aside>
        </section>

        {error && (
          <div className="student-dashboard-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>
              Thử lại
            </button>
          </div>
        )}

        <section className="student-events">
          <div className="student-events__header">
            <div>
              <h3>
                {upcomingActivities.some((activity) => new Date(activity.timeBegin).getTime() <= Date.now())
                  ? "HOẠT ĐỘNG ĐANG DIỄN RA VÀ SẮP TỚI"
                  : featuredActivity ? "HOẠT ĐỘNG SẮP TỚI" : "HOẠT ĐỘNG ĐANG MỞ"}
              </h3>
              <p>
                {featuredActivity
                  ? `Sự kiện gần nhất: ${featuredActivity.title}`
                  : "Các hoạt động còn chỗ đăng ký"}
              </p>
            </div>
            <Link to="/activities">Xem tất cả</Link>
          </div>

          {loading ? (
            <p className="student-dashboard-message">Đang tải hoạt động...</p>
          ) : upcomingActivities.length ? (
            <div className="student-event-grid">
              {upcomingActivities.map((activity, index) => (
                <article className="student-event-card" key={activity.id}>
                  <div className="student-event-card__badge">
                    {new Date(activity.timeBegin).getTime() <= Date.now()
                      ? "Đang diễn ra"
                      : index === 0 ? "Sắp diễn ra" : "Còn đăng ký"}
                  </div>
                  <div className="student-event-card__body">
                    <h4>{activity.title}</h4>
                    <p>{formatDate(activity.timeBegin)}</p>
                    <p>{activity.registeredCount}/{activity.slot} đã đăng ký</p>
                    <Link to={`/activities/${activity.id}`}>Xem chi tiết</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="student-dashboard-message">
              {error
                ? "Chưa thể lấy danh sách hoạt động."
                : "Hiện chưa có hoạt động còn chỗ đăng ký."}
            </p>
          )}
        </section>

        <section className="student-events student-history">
          <div className="student-events__header">
            <div>
              <h3>HOẠT ĐỘNG GẦN ĐÂY CỦA BẠN</h3>
              <p>Trạng thái đăng ký và minh chứng mới nhất</p>
            </div>
            <Link to="/profile">Xem lịch sử</Link>
          </div>
          {loading ? (
            <p className="student-dashboard-message">Đang tải lịch sử...</p>
          ) : history.length ? (
            <ul className="student-history-list">
              {history.slice(0, 5).map((activity, index) => (
                <li key={`${activity.title}-${activity.registeredAt}-${index}`}>
                  <div>
                    <strong>{activity.title}</strong>
                    <span>{activity.registeredAt}</span>
                  </div>
                  <span>{activity.registrationStatus}</span>
                  <span>{activity.evidenceStatus}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="student-dashboard-message">
              Bạn chưa đăng ký hoạt động nào. <Link to="/activities">Khám phá hoạt động</Link>
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Chưa xác định";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa xác định";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
