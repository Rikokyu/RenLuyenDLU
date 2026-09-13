import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", icon: "/icons/dashboard.svg", label: "Trang chủ" },
  { to: "/activities", icon: "/icons/list.svg", label: "Danh sách hoạt động" },
  { to: "/evidence", icon: "/icons/check.svg", label: "Minh chứng sinh viên" },
  { to: "/reports", icon: "/icons/report.svg", label: "Báo cáo và thống kê" },
  { to: "/profile", icon: "/icons/profile.svg", label: "Hồ sơ và lịch sử" },
  { to: "/manager", icon: "/icons/manager.svg", label: "Quản lý người dùng" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Thanh điều hướng">
      <div className="sidebar__brand">
        <img
          className="sidebar__logo"
          src="/images/RenLuyenDLULogo.png"
          alt="Logo Rèn Luyện DLU"
        />
        <h1 className="sidebar__title">Rèn Luyện DLU</h1>
        <div className="sidebar__divider" aria-hidden="true" />
      </div>

      <nav className="sidebar__nav" aria-label="Menu chính">
        <ul className="nav-list">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `nav-item${isActive ? " is-active" : ""}`
                }
              >
                <img className="icon" src={item.icon} alt="" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <article className="rule-card">
        <div className="rule-card__heading">
          <img className="icon icon--on-accent" src="/icons/rule.svg" alt="" />
          <h2>Quy chế điểm rèn luyện</h2>
        </div>
        <p>
          Điểm rèn luyện tối đa 100 điểm/học kỳ. Cần đạt tối thiểu 65 điểm để
          đạt loại Khá trở lên.
        </p>
      </article>
    </aside>
  );
}
