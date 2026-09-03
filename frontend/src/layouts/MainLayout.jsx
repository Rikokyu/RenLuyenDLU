import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/topbar/Topbar";

const titles = {
  "/dashboard": "Dashboard điều hành",
  "/activities": "Danh sách hoạt động",
  "/evidence": "Minh chứng sinh viên",
  "/reports": "Báo cáo và thống kê",
  "/profile": "Hồ sơ và lịch sử",
};

export default function MainLayout() {
  const location = useLocation();
  const title =
    titles[location.pathname] ||
    (location.pathname.startsWith("/activities/")
      ? "Chi tiết hoạt động"
      : "Rèn Luyện DLU");

  return (
    <div className="app">
      <Sidebar />

      <div className="workspace">
        <Topbar title={title} />

        <main className="content" aria-label="Nội dung chính">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
