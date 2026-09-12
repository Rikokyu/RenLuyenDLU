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
  return (
    <section className="profile-page" aria-labelledby="profile-heading">
      <div className="profile-hero">
        <div className="profile-hero__identity">
          <div className="profile-avatar">
            <img src="/images/RenLuyenDLULogo.png" alt="Ảnh đại diện Nguyễn Văn An" />
          </div>

          <div className="profile-hero__copy">
            <span className="profile-kicker">Cổng sinh viên cá nhân</span>
            <h1 id="profile-heading">Nguyễn Văn An - 21120045</h1>
            <p>
              Lớp: <strong>CTK44A</strong>
              <span className="profile-separator">•</span>
              Khoa: <strong>Khoa Công nghệ Thông tin</strong>
            </p>
          </div>
        </div>

        <div className="profile-score" aria-label="Điểm rèn luyện">
          <span className="profile-score__label">Điểm rèn luyện hiện tại</span>
          <strong>92<small>/100</small></strong>
          <span className="profile-score__rank">Xuất sắc</span>
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

      <div className="profile-content">
        <div className="profile-section-heading">
          <div>
            <p className="section-eyebrow">Theo dõi tiến trình</p>
            <h2>Lịch sử hoạt động & minh chứng của bạn</h2>
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
    </section>
  );
}
