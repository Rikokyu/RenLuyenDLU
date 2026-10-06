import { useMemo, useState } from "react";

function Icon({ name }) {
  return (
    <img
      className="manager-icon"
      src={`/icons/${name}.svg`}
      alt=""
      aria-hidden="true"
    />
  );
}

function getPermissionRole(roleCode) {
  if (roleCode === "ADMIN") return "Admin";
  if (roleCode === "STUDENT_AFFAIRS_ASSISTANT") return "Trợ lý";
  if (roleCode === "HOMEROOM_TEACHER" || roleCode === "CLASS_OFFICER") {
    return "Chủ nhiệm & Ban cán sự";
  }
  return "Sinh viên";
}

const permissionRoleOptions = [
  "Tất cả vai trò",
  "Admin",
  "Trợ lý",
  "Chủ nhiệm & Ban cán sự",
  "Sinh viên",
];

export default function ManagerAccounts({
  accounts,
  onToggleStatus,
  onResetPassword,
  onOpenModal,
  onDelete,
  onNotify,
  resetFilters,
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả vai trò");
  const [unitFilter, setUnitFilter] = useState("Tất cả Khoa / Đơn vị");
  const units = [...new Set(accounts.map((item) => item.unit).filter(Boolean))];
  const filteredAccounts = useMemo(
    () =>
      accounts.filter((item) => {
        const text =
          `${item.name} ${item.email} ${item.studentId}`.toLowerCase();
        return (
          text.includes(search.toLowerCase()) &&
          (roleFilter === "Tất cả vai trò" ||
            getPermissionRole(item.roleCode) === roleFilter) &&
          (unitFilter === "Tất cả Khoa / Đơn vị" || item.unit === unitFilter)
        );
      }),
    [accounts, search, roleFilter, unitFilter],
  );

  function clearFilters() {
    setSearch("");
    setRoleFilter("Tất cả vai trò");
    setUnitFilter("Tất cả Khoa / Đơn vị");
    resetFilters();
  }

  return (
    <>
      <div className="manager-toolbar manager-toolbar--accounts">
        <div>
          <strong>Bộ lọc danh sách tài khoản:</strong>
          <span> ({filteredAccounts.length} mục phù hợp)</span>
        </div>
        <div className="manager-actions">
          <button
            className="manager-button manager-button--outline"
            disabled
            title="Chức năng phân quyền chưa triển khai"
          >
            <Icon name="key" /> Ma Trận Phân Quyền (chưa triển khai)
          </button>
          <button
            className="manager-button manager-button--primary"
            onClick={() => onOpenModal({ type: "account", data: null })}
          >
            <Icon name="profile" /> Tạo Tài Khoản Mới
          </button>
        </div>
      </div>
      <div className="manager-filter manager-filter--account-list">
        <label className="manager-search">
          <Icon name="list" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo họ tên, email, MSSV..."
          />
        </label>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          {permissionRoleOptions.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
        <select
          value={unitFilter}
          onChange={(event) => setUnitFilter(event.target.value)}
        >
          <option>Tất cả Khoa / Đơn vị</option>
          {units.map((unit) => (
            <option key={unit}>{unit}</option>
          ))}
        </select>
      </div>
      <div className="manager-table-wrap">
        <table className="manager-table">
          <thead>
            <tr>
              <th>TÀI KHOẢN & NGƯỜI DÙNG</th>
              <th>VAI TRÒ HỆ THỐNG</th>
              <th>KHOA / LỚP / ĐƠN VỊ</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((item) => (
              <tr key={item.id || `student-${item.studentId}`}>
                <td>
                  <div className="manager-person">
                    <span className="manager-avatar">
                      {item.name.charAt(0)}
                    </span>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.email}</small>
                      {item.studentId && <small>MSSV: {item.studentId}</small>}
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className={`manager-role ${item.roleCode === "STUDENT" ? "manager-role--student" : item.roleCode === "HOMEROOM_TEACHER" ? "manager-role--orange" : ""}`}
                  >
                    {item.role}
                  </span>
                  <small className="manager-last-login">
                    Lần đăng nhập: {item.lastLogin}
                  </small>
                </td>
                <td>
                  <strong>
                    {item.unit || (item.studentId ? "Sinh viên" : "")}
                  </strong>
                  {item.className && (
                    <small className="manager-class-tag">
                      {item.studentId
                        ? `Lớp ${item.className}`
                        : item.className}
                    </small>
                  )}
                  <small className="manager-note">
                    {item.studentId
                      ? "Tài khoản đăng nhập của sinh viên"
                      : "Đơn vị phụ trách và quản lý tài khoản"}
                  </small>
                </td>
                <td>
                  <span
                    className={`manager-status ${item.hasLoginAccount && item.active ? "" : "manager-status--locked"}`}
                  >
                    <i />
                    {!item.hasLoginAccount
                      ? "Chưa cấp tài khoản"
                      : item.active
                        ? "Đang hoạt động"
                        : "Đã khóa"}
                  </span>
                </td>
                <td>
                  <div className="manager-row-actions">
                    <button
                      onClick={() =>
                        onOpenModal({ type: "account", data: item })
                      }
                      aria-label={
                        item.hasLoginAccount
                          ? "Sửa tài khoản"
                          : "Cấp tài khoản sinh viên"
                      }
                      title={
                        item.hasLoginAccount
                          ? "Sửa tài khoản"
                          : "Nhập email để cấp tài khoản sinh viên"
                      }
                    >
                      <Icon name="custom" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(item)}
                      disabled={
                        !item.hasLoginAccount || item.roleCode === "ADMIN"
                      }
                      aria-label={
                        item.active ? "Khóa tài khoản" : "Mở khóa tài khoản"
                      }
                      title={
                        item.active ? "Khóa tài khoản" : "Mở khóa tài khoản"
                      }
                    >
                      <Icon name="lock" />
                    </button>
                    <button
                      onClick={() => onResetPassword(item)}
                      disabled={!item.hasLoginAccount}
                      aria-label="Đặt lại mật khẩu"
                      title="Đặt lại mật khẩu mặc định"
                    >
                      <Icon name="change_pass" />
                    </button>
                    {item.hasLoginAccount && item.roleCode !== "ADMIN" && (
                      <button
                        onClick={() => onDelete("account", item.id)}
                        aria-label="Xóa tài khoản"
                      >
                        <Icon name="trash" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAccounts.length === 0 && (
          <div className="manager-empty">
            <strong>Không tìm thấy dữ liệu phù hợp</strong>
            <button onClick={clearFilters}>Xóa bộ lọc</button>
          </div>
        )}
      </div>
    </>
  );
}
