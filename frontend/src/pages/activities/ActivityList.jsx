import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./ActivityList.css";

const activities = [
  {
    id: "HD-2025-01",
    title: "Chiến dịch Mùa Hè Xanh 2025",
    category: "Phong trào - Tình nguyện",
    organizer: "Ban Chấp hành Đoàn Trường & Hội Sinh viên",
    date: "2025-07-01",
    location: "Huyện Đam Rông & Lâm Hà, Lâm Đồng",
    score: "+10đ",
    hours: "25h CTXH",
    registered: "142/150",
    status: "Đang diễn ra",
    statusClass: "is-open",
  },
  {
    id: "HD-2025-02",
    title: "Hội Thảo Quốc Tế: Tương Lai CNTT & AI",
    category: "Học thuật - NCKH",
    organizer: "Khoa Công nghệ Thông tin & Phòng KHCN",
    date: "2025-08-15",
    location: "Hội trường A1 - Trung tâm Hội nghị",
    score: "+6đ",
    hours: "4h CTXH",
    registered: "288/300",
    status: "Đang mở đăng ký",
    statusClass: "is-registering",
  },
  {
    id: "HD-2025-03",
    title: "Giải chạy sinh viên DLU - Run For Green",
    category: "Văn hóa - Thể thao",
    organizer: "Trung tâm Thể thao và Quốc phòng",
    date: "2025-09-20",
    location: "Quảng trường Đại học Đà Lạt",
    score: "+5đ",
    hours: "3h CTXH",
    registered: "96/200",
    status: "Sắp diễn ra",
    statusClass: "is-upcoming",
  },
  {
    id: "HD-2025-04",
    title: "Tập huấn kỹ năng lãnh đạo trẻ",
    category: "Kỹ năng mềm - Hội thảo",
    organizer: "Phòng Công tác Sinh viên",
    date: "2025-10-04",
    location: "Phòng hội thảo B203",
    score: "+4đ",
    hours: "2h CTXH",
    registered: "45/60",
    status: "Đang mở đăng ký",
    statusClass: "is-registering",
  },
  {
    id: "HD-2025-05",
    title: "Ngày hội Hiến máu tình nguyện",
    category: "Công tác xã hội - Hiến máu",
    organizer: "Hội Chữ thập đỏ tỉnh Lâm Đồng",
    date: "2025-04-12",
    location: "Nhà đa năng DLU",
    score: "+8đ",
    hours: "5h CTXH",
    registered: "180/180",
    status: "Đã kết thúc",
    statusClass: "is-ended",
  },
  {
    id: "HD-2025-06",
    title: "Giao lưu văn hóa sinh viên quốc tế",
    category: "Hội nhập quốc tế",
    organizer: "Phòng Hợp tác Quốc tế",
    date: "2025-11-01",
    location: "Sân khấu ngoài trời DLU",
    score: "+5đ",
    hours: "3h CTXH",
    registered: "72/100",
    status: "Sắp diễn ra",
    statusClass: "is-upcoming",
  },
];

const statusOptions = ["Tất cả trạng thái", "Đang mở đăng ký", "Đang diễn ra", "Sắp diễn ra", "Đã kết thúc"];
const categoryOptions = ["Tất cả loại hoạt động (6)", "Phong trào - Tình nguyện", "Học thuật - NCKH", "Văn hóa - Thể thao", "Kỹ năng mềm - Hội thảo", "Công tác xã hội - Hiến máu", "Hội nhập quốc tế"];

export default function ActivityList() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(categoryOptions[0]);
  const [status, setStatus] = useState(statusOptions[0]);
  const [semester, setSemester] = useState("Tất cả học kỳ / niên khóa");

  const filteredActivities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesSearch = !normalizedSearch || [activity.id, activity.title, activity.category, activity.organizer]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesCategory = category === categoryOptions[0] || activity.category === category;
      const matchesStatus = status === statusOptions[0] || activity.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [category, search, status]);

  return (
    <section className="activities-page" aria-labelledby="activities-heading">
      <header className="activities-header">
        <div className="activities-heading-group">
          <div className="activities-heading-icon" aria-hidden="true">▦</div>
          <div>
            <h1 id="activities-heading">Quản lý Danh sách Hoạt động & Đợt Rèn luyện</h1>
            <p>Quản lý sự kiện, phát hành mã điểm danh QR và ghi nhận điểm rèn luyện số hóa</p>
          </div>
        </div>
        <button className="create-activity-button" type="button">
          <span aria-hidden="true">＋</span>
          Tạo hoạt động mới
        </button>
      </header>

      <div className="activities-toolbar">
        <label className="activity-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên HĐ, mã HĐ, địa điểm..."
            aria-label="Tìm hoạt động"
          />
        </label>

        <label className="activity-filter">
          <span className="visually-hidden">Loại hoạt động</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categoryOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="activity-filter">
          <span className="visually-hidden">Trạng thái</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="activity-filter">
          <span className="visually-hidden">Học kỳ</span>
          <select value={semester} onChange={(event) => setSemester(event.target.value)}>
            <option>Tất cả học kỳ / niên khóa</option>
            <option>HK2 2025 - 2026</option>
            <option>Học kỳ Hè 2026</option>
            <option>HK1 2025 - 2026</option>
          </select>
        </label>
      </div>

      <div className="activities-table-wrap">
        <table className="activities-table">
          <thead>
            <tr>
              <th>Mã HĐ</th>
              <th>Tên Hoạt động & Loại Hình</th>
              <th>Đơn vị Tổ chức</th>
              <th>Thời gian & Địa điểm</th>
              <th>ĐRL / CTXH</th>
              <th>Đăng ký</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.map((activity) => (
              <tr key={activity.id}>
                <td><Link className="activity-code" to={`/activities/${activity.id}`}>{activity.id}</Link></td>
                <td>
                  <Link className="activity-name" to={`/activities/${activity.id}`}>{activity.title}</Link>
                  <span className="activity-subtext">{activity.category}</span>
                </td>
                <td><span className="activity-cell-truncate">{activity.organizer}</span></td>
                <td>
                  <span className="activity-date">{activity.date}</span>
                  <span className="activity-subtext">{activity.location}</span>
                </td>
                <td>
                  <strong className="activity-score">{activity.score}</strong>
                  <span className="activity-subtext">{activity.hours}</span>
                </td>
                <td><strong className="activity-registered">{activity.registered}</strong></td>
                <td><span className={`activity-status ${activity.statusClass}`}>{activity.status}</span></td>
                <td>
                  <div className="activity-row-actions">
                    <Link to={`/activities/${activity.id}`} className="view-activity">▦ <span>Xem</span></Link>
                    <button type="button" className="qr-button" aria-label={`Mở mã QR cho ${activity.title}`}>▣</button>
                    <button type="button" className="check-button" aria-label={`Điểm danh ${activity.title}`}>✓</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredActivities.length === 0 && <p className="activities-empty">Không tìm thấy hoạt động phù hợp.</p>}
      </div>
    </section>
  );
}
