import React from "react";
import "./Reports.css";

const statistics = [
  {
    title: "TỔNG SV TOÀN TRƯỜNG",
    value: "12,500",
    change: "+4.1% so với kỳ trước",
    type: "blue",
    trend: "up",
  },
  {
    title: "SINH VIÊN ĐẠT 5 TỐT",
    value: "320",
    change: "+12.5% so với kỳ trước",
    type: "green",
    trend: "up",
  },
  {
    title: "CẢNH BÁO RÈN LUYỆN",
    value: "450",
    change: "-8.3% so với kỳ trước",
    type: "orange",
    trend: "down",
  },
];

const faculties = [
  {
    name: "Khoa CNTT",
    scores: [
      { label: "Xuất sắc", value: 45, color: "green" },
      { label: "Tốt", value: 32, color: "blue" },
      { label: "Khá", value: 15, color: "orange" },
      { label: "TB", value: 6, color: "yellow" },
      { label: "Yếu", value: 2, color: "red" },
    ],
  },
  {
    name: "Khoa Kinh Tế",
    scores: [
      { label: "Xuất sắc", value: 38, color: "green" },
      { label: "Tốt", value: 40, color: "blue" },
      { label: "Khá", value: 14, color: "orange" },
      { label: "TB", value: 5, color: "yellow" },
      { label: "Yếu", value: 3, color: "red" },
    ],
  },
  {
    name: "Khoa Sư Phạm",
    scores: [
      { label: "Xuất sắc", value: 50, color: "green" },
      { label: "Tốt", value: 35, color: "blue" },
      { label: "Khá", value: 10, color: "orange" },
      { label: "TB", value: 4, color: "yellow" },
      { label: "Yếu", value: 1, color: "red" },
    ],
  },
  {
    name: "Khoa Ngoại Ngữ",
    scores: [
      { label: "Xuất sắc", value: 42, color: "green" },
      { label: "Tốt", value: 38, color: "blue" },
      { label: "Khá", value: 12, color: "orange" },
      { label: "TB", value: 6, color: "yellow" },
      { label: "Yếu", value: 2, color: "red" },
    ],
  },
];

const students = [
  {
    id: "DLU22105",
    name: "Nguyễn Văn Hoàng",
    className: "CTK46B",
    faculty: "Khoa CNTT",
    score: 92,
    rank: "Xuất sắc",
    hours: "24 giờ",
    status: "Đã duyệt",
  },
  {
    id: "DLU22184",
    name: "Lê Thị Mai Anh",
    className: "QTK46A",
    faculty: "Khoa Kinh Tế",
    score: 84,
    rank: "Tốt",
    hours: "18 giờ",
    status: "Đã duyệt",
  },
  {
    id: "DLU22031",
    name: "Trần Minh Quân",
    className: "SPK45",
    faculty: "Khoa Sư Phạm",
    score: 68,
    rank: "Khá",
    hours: "12 giờ",
    status: "Chờ duyệt",
  },
  {
    id: "DLU22492",
    name: "Phạm Hoàng Nam",
    className: "NNA46",
    faculty: "Khoa Ngoại Ngữ",
    score: 42,
    rank: "Yếu",
    hours: "4 giờ",
    status: "Cảnh báo",
  },
];

function getScoreClass(score) {
  if (score >= 90) return "score-green";
  if (score >= 80) return "score-blue";
  if (score >= 60) return "score-orange";

  return "score-red";
}

function getRankClass(rank) {
  const rankMap = {
    "Xuất sắc": "rank-green",
    "Tốt": "rank-blue",
    "Khá": "rank-orange",
    "Yếu": "rank-red",
  };

  return rankMap[rank] || "";
}

function getStatusClass(status) {
  const statusMap = {
    "Đã duyệt": "status-approved",
    "Chờ duyệt": "status-pending",
    "Cảnh báo": "status-warning",
  };

  return statusMap[status] || "";
}

function Reports() {
  return (
    <main className="Reports">
      {/* ================= LEFT CONTENT ================= */}

      <section className="Reports-main">

        {/* KPI */}
        <section className="statistics-grid">
          {statistics.map((item) => (
            <article
              className={`stat-card stat-${item.type}`}
              key={item.title}
            >
              <div className="stat-top">
                <p className="stat-title">{item.title}</p>

                <span
                  className={`stat-indicator ${item.type}`}
                />
              </div>

              <h2 className="stat-value">
                {item.value}
              </h2>

              <p
                className={`stat-change ${
                  item.trend === "down"
                    ? "negative"
                    : "positive"
                }`}
              >
                <span>
                  {item.trend === "down" ? "↓" : "↑"}
                </span>

                {item.change}
              </p>
            </article>
          ))}
        </section>

        {/* FILTER */}
        <section className="card filter-section">
          <div className="section-heading">
            <div>
              <h3>
                Bộ Lọc Dữ Liệu Học Viên & Tiêu Chí ĐRL
              </h3>

              <p>
                Lọc và tìm kiếm thông tin sinh viên
              </p>
            </div>

            <span className="total-student">
              Tổng số: 12,500 sinh viên
            </span>
          </div>

          <div className="filter-grid">

            <div className="search-field">
              <span className="search-icon">⌕</span>

              <input
                type="text"
                placeholder="Tìm theo MSSV, họ tên..."
              />
            </div>

            <select>
              <option>Tất cả khoa</option>
              <option>Khoa CNTT</option>
              <option>Khoa Kinh Tế</option>
              <option>Khoa Sư Phạm</option>
              <option>Khoa Ngoại Ngữ</option>
            </select>

            <select>
              <option>Tất cả xếp loại</option>
              <option>Xuất sắc</option>
              <option>Tốt</option>
              <option>Khá</option>
              <option>Trung bình</option>
              <option>Yếu</option>
            </select>

            <button className="btn-primary">
              Lọc dữ liệu
            </button>
          </div>
        </section>

        {/* REPORT */}
        <section className="card report-section">

          <div className="section-heading report-heading">
            <div>
              <h3>
                Phân Phối Điểm Rèn Luyện Theo Khoa
              </h3>

              <p>
                Thống kê tỷ lệ xếp loại của sinh viên theo từng khoa
              </p>
            </div>

            <div className="legend">
              <span>
                <i className="legend-dot green" />
                Xuất sắc
              </span>

              <span>
                <i className="legend-dot blue" />
                Tốt
              </span>

              <span>
                <i className="legend-dot orange" />
                Khá
              </span>
            </div>
          </div>

          <div className="faculty-grid">
            {faculties.map((faculty) => (
              <article
                className="faculty-card"
                key={faculty.name}
              >
                <h4>{faculty.name}</h4>

                <div className="progress-list">
                  {faculty.scores.map((score) => (
                    <div
                      className="progress-item"
                      key={score.label}
                    >
                      <div className="progress-label">
                        <span>{score.label}</span>

                        <strong>
                          {score.value}%
                        </strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className={`progress-bar ${score.color}`}
                          style={{
                            width: `${score.value}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* STUDENT TABLE */}
        <section className="card table-section">

          <div className="section-heading">
            <div>
              <h3>
                Hồ Sơ Rèn Luyện & Tổng Hợp Điểm
              </h3>

              <p>
                Danh sách sinh viên và kết quả đánh giá hiện tại
              </p>
            </div>

            <div className="pagination">
              <button>← Trước</button>
              <button>Tiếp →</button>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>MSSV</th>
                  <th>Họ & Tên Sinh Viên</th>
                  <th>Lớp</th>
                  <th>Khoa</th>
                  <th>Điểm RL</th>
                  <th>Xếp Loại</th>
                  <th>Giờ CTXH</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>

                    <td className="student-name">
                      {student.name}
                    </td>

                    <td>{student.className}</td>

                    <td>{student.faculty}</td>

                    <td
                      className={`score ${getScoreClass(
                        student.score
                      )}`}
                    >
                      {student.score}
                    </td>

                    <td
                      className={getRankClass(
                        student.rank
                      )}
                    >
                      {student.rank}
                    </td>

                    <td>{student.hours}</td>

                    <td>
                      <span
                        className={`status ${getStatusClass(
                          student.status
                        )}`}
                      >
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {/* ================= SIDEBAR ================= */}

      <aside className="Reports-sidebar">

        {/* EXPORT */}
        <section className="card export-section">

          <div className="section-heading">
            <div>
              <h3>Xuất Báo Cáo</h3>

              <p>
                Tạo và xuất báo cáo dữ liệu
              </p>
            </div>
          </div>

          <div className="export-actions">

            <button className="btn-primary export-button">
              <span>▣</span>
              In Báo Cáo Chuẩn A4
            </button>

            <button className="btn-secondary export-button">
              <span>↓</span>
              Xuất Dữ Liệu Excel
            </button>

          </div>
        </section>

        {/* RANKING */}
        <section className="card ranking-section">

          <div className="section-heading">
            <div>
              <h3>Tỷ Lệ Xếp Loại ĐRL</h3>

              <p>Thống kê toàn trường</p>
            </div>
          </div>

          <div className="ranking-content">

            <div className="donut-chart">
              <div className="donut-center">
                <strong>78%</strong>
                <span>Đạt</span>
              </div>
            </div>

            <div className="ranking-list">

              <div className="ranking-item">
                <span className="ranking-color green" />

                <div>
                  <strong>Xuất sắc</strong>
                  <p>4,500 sinh viên</p>
                </div>
              </div>

              <div className="ranking-item">
                <span className="ranking-color blue" />

                <div>
                  <strong>Tốt</strong>
                  <p>5,250 sinh viên</p>
                </div>
              </div>

              <div className="ranking-item">
                <span className="ranking-color orange" />

                <div>
                  <strong>Khá</strong>
                  <p>1,875 sinh viên</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ACTIVITIES */}
        <section className="card activity-section">

          <div className="section-heading">
            <div>
              <h3>Minh Chứng Mới</h3>

              <p>Các minh chứng đang chờ xử lý</p>
            </div>
          </div>

          <div className="activity-list">

            <article className="activity-item">
              <div className="activity-icon orange">
                📄
              </div>

              <div className="activity-info">
                <strong>
                  Minh chứng NCKH cấp Khoa
                </strong>

                <p>
                  Trương Khoa · DLU22045
                </p>

                <span>10 phút trước</span>
              </div>
            </article>

            <article className="activity-item">
              <div className="activity-icon orange">
                📄
              </div>

              <div className="activity-info">
                <strong>
                  Giấy khen công tác Đoàn Hội
                </strong>

                <p>
                  Lê Mỹ Hạnh · DLU22109
                </p>

                <span>45 phút trước</span>
              </div>
            </article>

            <article className="activity-item">
              <div className="activity-icon green">
                ✓
              </div>

              <div className="activity-info">
                <strong>
                  Chiến dịch Mùa Hè Xanh
                </strong>

                <p>
                  Đã tự động đồng bộ trạng thái
                </p>

                <span>08:30 sáng</span>
              </div>
            </article>

          </div>
        </section>
      </aside>
    </main>
  );
}

export default Reports;