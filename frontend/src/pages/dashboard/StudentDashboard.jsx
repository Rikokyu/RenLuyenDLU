import DashboardPanel, { SummaryCard } from "./DashboardPanel";
import "./StudentDashboard.css";

const activities = [
  ["Chiến dịch Xuân Tình nguyện 2026", "Đang triển khai", 92],
  ["Hội thao sinh viên DLU thường niên", "Đang triển khai", 90],
  ["Học tập nghị quyết & Tuần sinh hoạt công dân", "Hoàn thành", 100],
  ["Hiến máu nhân đạo đợt 1", "Gần hạn", 74],
];

export default function StudentDashboard() {
  return (
    <div className="dashboard-student">
      <section className="student-welcome"><p>Chào <strong>Nguyễn Văn An</strong> <span>(CNTT - MSSV: 20S12100XX)</span></p><div className="student-summary-grid"><SummaryCard label="Điểm trung bình hiện tại của bạn" value="85/100" note="+10đ" icon="▤" /><SummaryCard label="Minh chứng của bạn" value="18" note="đã nộp, 4 chờ duyệt" icon="♧" /><SummaryCard label="Điểm trung bình dự kiến" value="88.5" note="" icon="" /><SummaryCard label="Giờ công tác xã hội" value="30/28 giờ" note="Đã đủ chỉ tiêu" icon="♧" /></div></section>
      <div className="dashboard-grid dashboard-grid--student">
        <DashboardPanel title="Tiến Độ Thực Hiện Các Tiêu Chí" subtitle="(Progress on Criteria)" wide>{[['TC1: Học tập', '100 / 18%'], ['TC2: Quy chế', '300 / 50%'], ['TC3: Công tác Xã hội', '380 / 50%'], ['TC4: Công dân', '100 / 1 giờ'], ['TC5: Lớp/Đoàn', '1951 giờ']].map(([label, value], index) => <div className="criteria-row" key={label}><span>{label}<b>{value}</b></span><i><em style={{ width: `${[76, 82, 64, 48, 61][index]}%` }} /></i></div>)}</DashboardPanel>
        <DashboardPanel title="Mục Tiêu ĐRL & Kế Hoạch" subtitle="Tham gia để trao đổi & xây dựng mục tiêu"><ul className="goal-list"><li><b>Điểm thi mayary:</b><small>• Giàn trừ sanh indorie Codat scholarship</small></li><li><b>Ngọn đèn đầu:</b><small>• Giàn trừ 000/06/07/00 · 2/31/2001</small></li></ul><div className="dashboard-note">Mục tiêu nhỏ mỗi tuần sẽ giúp bạn duy trì tiến độ ổn định.</div></DashboardPanel>
        <DashboardPanel title="Xu Hướng Hoạt Động Cá Nhân" subtitle="Theo dõi nhịp hoạt động cá nhân mỗi tuần" wide><div className="line-chart"><svg viewBox="0 0 620 170" role="img" aria-label="Xu hướng hoạt động cá nhân"><path className="line-chart__grid" d="M20 30H600M20 80H600M20 130H600" /><path className="line-chart__green" d="M20 120L115 82L210 112L305 52L400 53L495 15L590 28" /><path className="line-chart__blue" d="M20 135L115 110L210 125L305 110L400 73L495 61L590 80" /></svg></div></DashboardPanel>
        <DashboardPanel title="Thông Báo Quan Trọng và Lời Nhắc"><ul className="reminder-list"><li>Khóa chất hiện minh chứng hoạt động “Xuân Yêu Người” năm 2026</li><li>Thông báo: Sắp đến chu kỳ thu thập minh chứng</li><li>Cấp 3: Công ty hoạt động “Sỹ sáng sáng” để từng TCA</li><li>Cấp 2: Công ty hoạt động “Sỹ sáng sáng” để từng TCA</li></ul></DashboardPanel>
        <DashboardPanel title="Tiến Độ Hoạt Động Cụ Thể" subtitle="Theo dõi các hoạt động đã đăng ký" wide>{activities.map(([label, status, value]) => <div className="campaign-row" key={label}><span>{label}<b>{status}</b></span><i><em style={{ width: `${value}%` }} /></i></div>)}</DashboardPanel>
        <DashboardPanel title="Vinh Danh Sinh Viên Tiêu Biểu"><div className="student-highlight">🏅 <strong>Trần Văn D</strong><small>Sinh viên ưu tú tháng này</small></div><div className="student-highlight">🌱 <strong>Sinh viên ưu tú 1</strong><small>Đóng góp tích cực</small></div><div className="student-highlight">🌱 <strong>Sinh viên ưu tú 2</strong><small>Đóng góp tích cực</small></div></DashboardPanel>
      </div>
    </div>
  );
}
