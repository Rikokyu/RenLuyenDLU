import "./StudentDashboard.css";

const news = [
  { title: "Xét học bổng kỳ 2", time: "1 ngày trước" },
  { title: "Sinh viên cần cập nhật hồ sơ", time: "2 ngày trước" },
  { title: "Chương trình hỗ trợ việc làm", time: "3 ngày trước" },
  { title: "Đăng ký tham gia chương trình", time: "5 ngày trước" },
];

const events = [
  { title: "Chuyên đề kỹ năng mềm", detail: "20/06", tag: "Mới" },
  { title: "Tuần sinh hoạt công dân", detail: "25/06", tag: "Nổi bật" },
  { title: "Hội thảo dạy nghề", detail: "28/06", tag: "Hot" },
  { title: "Ngày hội sáng tạo", detail: "30/06", tag: "Sắp tới" },
  { title: "Đua xe đạp trường", detail: "02/07", tag: "Đang mở" },
  { title: "Hiến máu nhân đạo", detail: "04/07", tag: "Mời tham gia" },
];

export default function StudentDashboard() {
  return (
    <div className="student-home">

      <main className="student-content">
        <section className="student-hero">
          <div className="student-hero__content">
            <span className="student-pill">TIN NỔI BẬT</span>
            <h2>HACKATHON CÔNG NGHỆ 2026</h2>
            <p>
              Tham gia trải nghiệm, sáng tạo và kết nối với các dự án công nghệ
              mới nhất của sinh viên DLU.
            </p>
            <button type="button" className="student-primary-button">
              Đăng ký ngay
            </button>
          </div>

          <aside className="student-news-panel">
            <h3>TIN TỨC MỚI NHẤT</h3>
            <ul className="student-news-list">
              {news.map((item) => (
                <li key={item.title}>
                  <div className="student-news-thumb" aria-hidden="true" />
                  <div className="student-news-copy">
                    <strong>{item.title}</strong>
                    <span>{item.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="student-events">
          <div className="student-events__header">
            <h3>SỰ KIỆN SẮP DIỄN RA</h3>
            <button type="button">Xem tất cả</button>
          </div>

          <div className="student-event-grid">
            {events.map((event) => (
              <article key={event.title} className="student-event-card">
                <div className="student-event-card__badge">{event.tag}</div>
                <div className="student-event-card__body">
                  <h4>{event.title}</h4>
                  <p>{event.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
