import { Link, useParams } from "react-router-dom";

export default function ActivityDetail() {
  const { id } = useParams();

  return (
    <section className="page-placeholder">
      <h1>Chi tiết hoạt động</h1>
      <p>Mã hoạt động: {id}</p>
      <Link to="/activities">← Quay lại danh sách</Link>
    </section>
  );
}
