import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile } from "../../services/authService";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getProfile()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Không thể tải hồ sơ và lịch sử.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <p className="page-error" role="alert">{error}</p>;
  }
  if (!profile) {
    return <p className="page-loading">Đang tải hồ sơ...</p>;
  }

  const { user, activities } = profile;
  const isStudent = user.role === "STUDENT";
  const displayTitle =
    isStudent && user.studentId
      ? `${user.name} - ${user.studentId}`
      : user.name;

  return (
    <section className="profile-page" aria-labelledby="profile-heading">
      <div className="profile-hero">
        <div className="profile-hero__identity">
          <div className="profile-avatar">
            <img src="/images/RenLuyenDLULogo.png" alt="" />
          </div>
          <div className="profile-hero__copy">
            <span className="profile-kicker">
              {isStudent ? "Cổng sinh viên cá nhân" : user.roleLabel}
            </span>
            <h1 id="profile-heading">{displayTitle}</h1>
            <p>
              {isStudent ? (
                <>
                  Lớp: <strong>{user.classCode || "Chưa phân lớp"}</strong>
                  <span className="profile-separator">•</span>
                  Khoa: <strong>{user.faculty || "Chưa cập nhật"}</strong>
                </>
              ) : (
                <strong>{user.subtitle}</strong>
              )}
            </p>
          </div>
        </div>

        {isStudent && (
          <div className="profile-score" aria-label="Điểm rèn luyện">
            <span className="profile-score__label">Điểm rèn luyện hiện tại</span>
            <strong>
              {profile.trainingScore}
              <small>/100</small>
            </strong>
            <span className="profile-score__rank">{profile.trainingRank}</span>
          </div>
        )}

        <div className="profile-actions">
          <Link className="profile-button profile-button--blue" to="/activities">
            <span aria-hidden="true">＋</span>
            Đăng ký thêm hoạt động
          </Link>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section-heading">
          <div>
            <p className="section-eyebrow">Theo dõi tiến trình</p>
            <h2>Lịch sử hoạt động & minh chứng của bạn</h2>
          </div>
          <span className="activity-total">
            Tổng số: <strong>{activities.length} hoạt động</strong>
          </span>
        </div>

        {activities.length ? (
          <div className="activity-list">
            {activities.map((activity, index) => (
              <article
                className="activity-item"
                key={`${activity.title}-${activity.registeredAt}-${index}`}
              >
                <div className="activity-item__marker" aria-hidden="true">
                  <img src="/icons/list.svg" alt="" />
                </div>
                <div className="activity-item__details">
                  <div className="activity-item__title-row">
                    <h3>{activity.title}</h3>
                    <span
                      className={`activity-status${activity.evidenceStatus === "Chờ duyệt" ? " is-pending" : ""}`}
                    >
                      {activity.evidenceStatus}
                    </span>
                  </div>
                  <p>
                    {activity.category}
                    <span>•</span>
                    Ngày tham gia: {activity.registeredAt}
                    <span>•</span>
                    Điểm thưởng: <strong>+{activity.score}đ</strong>
                  </p>
                </div>
                <div className="activity-item__actions">
                  <Link className="evidence-button" to="/evidence">
                    Xem minh chứng
                  </Link>
                  <span
                    className={`attendance${activity.attendance !== "Đã điểm danh" ? " is-missing" : ""}`}
                  >
                    {activity.attendance}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="profile-empty">
            {isStudent
              ? "Tài khoản này chưa có lịch sử đăng ký hoạt động."
              : "Hồ sơ này chưa có lịch sử tham gia hoạt động."}
          </p>
        )}
      </div>
    </section>
  );
}
