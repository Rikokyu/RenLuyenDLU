import { Link } from "react-router-dom";

export default function ActivityList() {
  return (
    <section className="page-placeholder">
      <h1>Danh sách hoạt động</h1>
      <p>Đây là trang con của MainLayout.</p>
      <Link to="/activities/1">Xem thử chi tiết hoạt động</Link>
    </section>
  );
}
