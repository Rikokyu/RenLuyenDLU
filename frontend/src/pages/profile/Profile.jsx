import { useEffect, useState } from "react";
import { getProfileByIdentifier } from "../../services/profileService";
import "./Profile.css";

const activities = [
  {
    title: "Chiến dịch Mùa Hè Xanh 2025 - Về Nguồn & Hỗ Trợ Xã Nghèo",
    type: "Phong trào - Tình nguyện",
    date: "20/06/2025 09:30",
    score: "+10đ",
    status: "Đã duyệt",
    attendance: "Đã điểm danh",
  },
  {
    title: "Ngày hội Hiến máu tình nguyện DLU 2025",
    type: "Cộng đồng - Xã hội",
    date: "12/04/2025 07:00",
    score: "+8đ",
    status: "Đã duyệt",
    attendance: "Đã điểm danh",
  },
  {
    title: "Tuần lễ sinh viên 5 tốt cấp trường",
    type: "Học tập - Kỹ năng",
    date: "08/03/2025 13:30",
    score: "+5đ",
    status: "Chờ duyệt",
    attendance: "Chưa điểm danh",
  },
];

export default function Profile() {
  const identifier = sessionStorage.getItem("renluyen-user-identifier") || "";
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(identifier));
  const [error, setError] = useState(
    identifier ? "" : "Hãy đăng xuất rồi đăng nhập bằng MSSV, mã giảng viên hoặc email để tải hồ sơ.",
  );

  useEffect(() => {
    if (!identifier) {
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    getProfileByIdentifier(identifier)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setProfile(data);
        sessionStorage.setItem(
          "renluyen-profile-identity",
          JSON.stringify({
            fullName: data.fullName,
            code: data.studentCode || data.lecturerCode,
            classCode: data.classCode,
            profileType: data.profileType,
          }),
        );
        window.dispatchEvent(new Event("renluyen-profile-updated"));
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [identifier]);

  const profileCode = profile?.studentCode || profile?.lecturerCode || "";
  const isStudent = profile?.profileType === "student";
  const profileDetails = profile
    ? [
        ["Mã sinh viên", profile.studentCode],
        ["Mã giảng viên", profile.lecturerCode],
        ["Giới tính", profile.gender],
        ["Ngày sinh", profile.birthDate],
        ["Nơi sinh", profile.birthPlace],
        ["Số điện thoại", profile.phone],
        ["Email", profile.email],
        ["Lớp", profile.className || profile.classCode],
        ["Ngành", profile.majorName || profile.majorCode],
        ["Khoa", profile.facultyName || profile.facultyCode],
      ].filter(([, value]) => value)
    : [];

  return (
    <section className="profile-page" aria-label="Hồ sơ cá nhân">
      {loading && (
        <p className="profile-data-message" role="status">
          Đang tải thông tin hồ sơ...
        </p>
      )}
      {error && (
        <p className="profile-data-message profile-data-message--error" role="alert">
          {error}
        </p>
      )}

      {profile && (
      <div className="profile-hero">
        <div className="profile-hero__identity">
          <div className="profile-avatar">
            <img src="/images/RenLuyenDLULogo.png" alt="" />
          </div>

          <div className="profile-hero__copy">
            <span className="profile-kicker">
              {isStudent ? "Cổng sinh viên cá nhân" : "Hồ sơ giảng viên"}
            </span>
            <h1 id="profile-heading">
              {profile.fullName} - {profileCode}
            </h1>
            <p>
              {isStudent && profile.classCode && (
                <>
                  Lớp: <strong>{profile.classCode}</strong>
                  <span className="profile-separator">•</span>
                </>
              )}
              {isStudent && profile.majorName && (
                <>
                  Ngành: <strong>{profile.majorName}</strong>
                  <span className="profile-separator">•</span>
                </>
              )}
              Khoa: <strong>{profile.facultyName || "Chưa cập nhật"}</strong>
            </p>
          </div>
        </div>

        <div className="profile-score" aria-label="Thông tin liên hệ">
          <span className="profile-score__label">Thông tin liên hệ</span>
          <strong className="profile-contact">{profile.phone || "Chưa cập nhật"}</strong>
          <span className="profile-score__rank">{profile.email || "Chưa cập nhật"}</span>
        </div>

        <div className="profile-actions">
          <button className="profile-button profile-button--light" type="button" onClick={() => window.print()}>
            <span aria-hidden="true">▧</span>
            In phiếu đánh giá
          </button>
          <button className="profile-button profile-button--blue" type="button">
            <span aria-hidden="true">＋</span>
            Đăng ký thêm hoạt động
          </button>
        </div>
      </div>
      )}

      {profile && (
        <div className="profile-content profile-personal-content">
          <div className="profile-section-heading">
            <div>
              <p className="section-eyebrow">Thông tin tài khoản</p>
              <h2>Thông tin cá nhân</h2>
            </div>
          </div>
          <dl className="profile-details">
            {profileDetails.map(([label, value]) => (
              <div className="profile-details__item" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {profile && (
      <div className="profile-content">
        <div className="profile-section-heading">
          <div>
            <p className="section-eyebrow">Theo dõi tiến trình</p>
            <h2>Lịch sử hoạt động & minh chứng của bạn</h2>
            <p className="profile-history-note">
              Lịch sử bên dưới hiện là dữ liệu minh họa; API lịch sử hoạt động chưa được kết nối.
            </p>
          </div>
          <span className="activity-total">Tổng số: <strong>{activities.length} hoạt động</strong></span>
        </div>

        <div className="activity-list">
          {activities.map((activity) => (
            <article className="activity-item" key={activity.title}>
              <div className="activity-item__marker" aria-hidden="true">
                <img src="/icons/list.svg" alt="" />
              </div>

              <div className="activity-item__details">
                <div className="activity-item__title-row">
                  <h3>{activity.title}</h3>
                  <span className={`activity-status${activity.status === "Chờ duyệt" ? " is-pending" : ""}`}>
                    {activity.status}
                  </span>
                </div>
                <p>
                  {activity.type}
                  <span>•</span>
                  Ngày tham gia: {activity.date}
                  <span>•</span>
                  Điểm thưởng: <strong>{activity.score}</strong>
                </p>
              </div>

              <div className="activity-item__actions">
                <button className="evidence-button" type="button">
                  <span aria-hidden="true">♧</span>
                  Xem chứng nhận số
                </button>
                <span className={`attendance${activity.attendance === "Chưa điểm danh" ? " is-missing" : ""}`}>
                  {activity.attendance}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
      )}
    </section>
  );
}
