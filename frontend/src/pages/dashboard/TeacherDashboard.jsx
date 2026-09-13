import DashboardPanel from "./DashboardPanel";
import "./TeacherDashboard.css";

const teacherStats = [
  ["Lượt SV tham gia", "12,450", "Tỷ lệ HT: 88.5%", "↗"],
  ["Minh chứng chờ duyệt", "432", "Xử lý ngay →", "◷"],
  ["ĐRL trung bình", "78.4", "Xếp loại: Khá", "♙"],
  ["Hoạt động đang chạy", "24", "12 chiến dịch trọng điểm", "▱"],
  ["SV đạt chuẩn tốt nghiệp", "92.4%", "Mục tiêu khóa: 95%", "✓"],
  ["Phản hồi thắc mắc", "15", "Đã giải quyết: 100%", "□"],
];

const campaigns = [
  ["Chiến dịch Xuân Tình nguyện 2026", "Đang triển khai", 92],
  ["Hội thao sinh viên DLU thường niên", "Đang triển khai", 90],
  ["Học tập nghị quyết & Tuần sinh hoạt công dân", "Hoàn thành", 100],
  ["Hiến máu nhân đạo đợt 1", "Gần hạn", 74],
];

export default function TeacherDashboard() {
  return (
    <div className="dashboard-teacher">
      <section className="dashboard-hero dashboard-hero--dark">
        <div className="dashboard-eyebrow">Hệ thống quản lý rèn luyện</div>
        <h1>Tổng Quan Theo Dõi Hoạt Động & Đánh Giá Rèn Luyện Sinh Viên</h1>
        <p>Theo dõi sát sao tiến độ rèn luyện, tổng hợp chỉ tiêu theo từng Khoa/Viện, tiến độ thẩm định minh chứng rèn luyện toàn khóa.</p>
        <div className="teacher-stat-grid">
          {teacherStats.map(([label, value, note, icon]) => (
            <article className="teacher-stat" key={label}>
              <div className="teacher-stat__top"><span>{label}</span><b>{icon}</b></div>
              <strong>{value}</strong>
              <small>{note}</small>
            </article>
          ))}
        </div>
      </section>

      <div className="dashboard-grid dashboard-grid--teacher">
        <DashboardPanel title="Hiệu Suất Theo Khoa/Viện" subtitle="So sánh tỷ lệ tham gia và điểm rèn luyện trung bình" wide>
          <div className="chart-bars">
            {["CNTT", "Ngoại ngữ", "Luật", "Sư phạm", "Du lịch"].map((label, index) => (
              <div className="chart-bar-group" key={label}>
                <div className="chart-bars__columns"><i style={{ height: `${72 - index * 7}%` }} /><i style={{ height: `${63 - index * 5}%` }} /></div>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend"><span className="legend-blue">■</span> Tỷ lệ tham gia <span className="legend-green">■</span> ĐRL Trung bình</div>
          <div className="mini-insights"><b>Khoa cao nhất<strong>CNTT (88.4đ)</strong></b><b>Quy mô SV đông nhất<strong>CNTT (1,450 SV)</strong></b><b>Khoa cần nâng tỷ lệ<strong>Luật (79.0%)</strong></b></div>
        </DashboardPanel>

        <DashboardPanel title="Cơ Cấu Xếp Loại ĐRL" subtitle="Phân bố xếp loại kỳ học gần nhất">
          <div className="donut-chart"><strong>89.4%<small>ĐẠT CHUẨN</small></strong></div>
          <ul className="score-legend"><li><i className="dot-green" /> Xuất sắc (&gt;=90) <b>18.5%</b></li><li><i className="dot-blue" /> Tốt (80 - 89) <b>45.2%</b></li><li><i className="dot-orange" /> Khá (65 - 79) <b>25.7%</b></li><li><i className="dot-purple" /> Trung bình (50 - 64) <b>8.1%</b></li></ul>
        </DashboardPanel>

        <DashboardPanel title="Xu Hướng Hoạt Động Theo Tháng" subtitle="Số lượt sinh viên hoạt động trong năm rèn luyện" wide>
          <div className="line-chart"><svg viewBox="0 0 620 170" role="img" aria-label="Biểu đồ xu hướng hoạt động"><path className="line-chart__grid" d="M20 30H600M20 80H600M20 130H600" /><path className="line-chart__green" d="M20 124L115 96L210 126L305 82L400 60L495 20L590 28" /><path className="line-chart__blue" d="M20 145L115 132L210 140L305 126L400 108L495 103L590 108" /></svg></div>
          <div className="chart-legend"><span className="legend-green">■</span> Lượt hoàn thành minh chứng <span className="legend-blue">■</span> Lượt đăng ký tham gia</div>
        </DashboardPanel>

        <DashboardPanel title="Tỷ Trọng Các Loại Hoạt Động" subtitle="Phân loại hoạt động được ghi nhận điểm ĐRL">
          {[['Phong trào - Tình nguyện', 45], ['Học thuật - NCKH', 25], ['Công tác xã hội & Hiến máu', 15], ['Kỹ năng mềm - Hội thảo', 10], ['Văn hóa - Thể thao', 5]].map(([label, value]) => <div className="progress-row" key={label}><span>{label}<b>{value}%</b></span><i><em style={{ width: `${value}%` }} /></i></div>)}
          <div className="dashboard-note">ⓘ Khuyến nghị: Tăng cường hoạt động Học thuật để đáp ứng tiêu chí chuẩn chính quốc tế.</div>
        </DashboardPanel>

        <DashboardPanel title="Tiến Độ Chiến Dịch Trọng Điểm" subtitle="Các chiến dịch cộng đồng rèn luyện trong học kỳ" wide>
          {campaigns.map(([label, status, value]) => <div className="campaign-row" key={label}><span>{label}<b>{status}</b></span><i><em style={{ width: `${value}%` }} /></i><small>{value}%</small></div>)}
        </DashboardPanel>

        <DashboardPanel title="Vinh Danh Sinh Viên Tiêu Biểu Phong Trào & Rèn Luyện" subtitle="Top sinh viên dẫn đầu điểm rèn luyện & đóng góp xã hội">
          {['Phạm Quỳnh Anh', 'Nguyễn Văn An', 'Lê Hoàng Minh', 'Trần Thị Mai Phương'].map((name, index) => <div className="student-rank" key={name}><i>#{index + 1}</i><span>{name}<small>CTK44A • Công nghệ Thông tin</small></span><b>{98 - index * 2} đ</b></div>)}
        </DashboardPanel>
      </div>
    </div>
  );
}
