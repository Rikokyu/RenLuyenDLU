import { useMemo, useState } from "react";
import "./Manager.css";

const initialAccounts = [
  {
    id: 1,
    name: "GS.TS. Trần Đình Dũng",
    username: "admin.super",
    email: "admin.system@dlu.edu.vn",
    role: "Quản Trị Viên (Admin)",
    unit: "Ban Giám Hiệu & Quản Trị Hệ Thống",
    lastLogin: "Hôm nay, 08:30",
    status: "Hoạt động",
    permissions: "Toàn quyền quản trị (Super Admin)",
  },
  {
    id: 2,
    name: "ThS. Lê Quỳnh Anh",
    username: "bgh.phongctsv",
    email: "ctsv.quynhanh@dlu.edu.vn",
    role: "Ban Giám Hiệu / CTSV",
    unit: "Khoa Công nghệ Thông tin",
    lastLogin: "Hôm nay, 09:12",
    status: "Hoạt động",
    permissions: "Quản lý hồ sơ sinh viên",
  },
  {
    id: 3,
    name: "ThS. Nguyễn Văn Hải",
    username: "doantruong.hai",
    email: "doantruong@dlu.edu.vn",
    role: "Đoàn - Hội Sinh Viên",
    unit: "Khoa Sinh học",
    lastLogin: "Hôm qua, 17:45",
    status: "Hoạt động",
    permissions: "Tạo hoạt động mới",
  },
  {
    id: 4,
    name: "TS. Lê Thị Thúy Nga",
    username: "ngaltt",
    email: "ngaltt@dlu.edu.vn",
    role: "Cố Vấn Học Tập",
    unit: "Khoa Công nghệ Thông tin",
    className: "CTK44A, CTK45A",
    lastLogin: "Hôm nay, 07:50",
    status: "Hoạt động",
    permissions: "Quản lý lớp sinh hoạt",
  },
  {
    id: 5,
    name: "ThS. Hoàng Minh Khôi",
    username: "khoimn",
    email: "khoimn@dlu.edu.vn",
    role: "Cố Vấn Học Tập",
    unit: "Khoa Quản trị kinh doanh",
    className: "QTK43B",
    lastLogin: "2 ngày trước",
    status: "Hoạt động",
    permissions: "Quản lý lớp sinh hoạt",
  },
  {
    id: 6,
    name: "TS. Vũ Đình Hùng",
    username: "hungvd",
    email: "hungvd@dlu.edu.vn",
    role: "Cố Vấn Học Tập",
    unit: "Khoa Luật",
    className: "LUK44A",
    lastLogin: "05/08/2025",
    status: "Đã khóa",
    permissions: "Quản lý hồ sơ sinh viên",
  },
  {
    id: 7,
    name: "Nguyễn Văn An",
    username: "e21120045",
    email: "21120045@dlu.edu.vn",
    role: "Sinh Viên",
    unit: "Khoa Toán - Tin",
    className: "CTK44A",
    lastLogin: "Hôm nay, 10:15",
    status: "Hoạt động",
    permissions: "Quyền mặc định của vai trò",
  },
];

const initialStudents = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    mssv: "21120045",
    gender: "Nam",
    birth: "2003-04-12",
    className: "CTK44A",
    faculty: "Khoa Công nghệ Thông tin",
    cccd: "068203004512",
    email: "21120045@dlu.edu.vn",
    phone: "0912345678",
    status: "Đang học",
    score: 92,
    rank: "Xuất sắc",
  },
  {
    id: 2,
    name: "Trần Thị Mai Phương",
    mssv: "22140012",
    gender: "Nữ",
    birth: "2004-09-20",
    className: "QTK43B",
    faculty: "Khoa Kinh tế & Quản trị",
    cccd: "068204008945",
    email: "22140012@dlu.edu.vn",
    phone: "0987654321",
    status: "Đang học",
    score: 86,
    rank: "Tốt",
  },
  {
    id: 3,
    name: "Lê Hoàng Minh",
    mssv: "2312565",
    gender: "Nam",
    birth: "2005-02-18",
    className: "CTK45A",
    faculty: "Khoa Công nghệ Thông tin",
    cccd: "079205012378",
    email: "2312565@dlu.edu.vn",
    phone: "0903123890",
    status: "Đang học",
    score: 89,
    rank: "Tốt",
  },
  {
    id: 4,
    name: "Phạm Quỳnh Anh",
    mssv: "22150089",
    gender: "Nữ",
    birth: "2004-11-05",
    className: "NNA45C",
    faculty: "Khoa Ngoại ngữ",
    cccd: "068204011245",
    email: "22150089@dlu.edu.vn",
    phone: "0978112233",
    status: "Đang học",
    score: 95,
    rank: "Xuất sắc",
  },
  {
    id: 5,
    name: "Võ Minh Đức",
    mssv: "21130099",
    gender: "Nam",
    birth: "2003-07-29",
    className: "LUK44A",
    faculty: "Khoa Luật",
    cccd: "052203009912",
    email: "21130099@dlu.edu.vn",
    phone: "0934567890",
    status: "Đang học",
    score: 72,
    rank: "Khá",
  },
  {
    id: 6,
    name: "Đỗ Thảo Vy",
    mssv: "23160034",
    gender: "Nữ",
    birth: "2005-08-14",
    className: "SPK45B",
    faculty: "Khoa Sư phạm & KHXH",
    cccd: "068205009342",
    email: "23160034@dlu.edu.vn",
    phone: "0945671232",
    status: "Cảnh báo rèn luyện",
    score: 48,
    rank: "Yếu",
  },
];

const classes = [
  {
    id: 1,
    name: "CTK44A",
    faculty: "Khoa Công nghệ Thông tin",
    year: "2021-2025",
    advisor: "TS. Lê Thị Thúy Nga",
    email: "ngaltt@dlu.edu.vn",
    leader: "Nguyễn Văn An (21120045)",
    count: 1,
    description:
      "Lớp Công nghệ thông tin Khóa 44 - Chuyên ngành Kỹ thuật phần mềm",
  },
  {
    id: 2,
    name: "CTK45A",
    faculty: "Khoa Công nghệ Thông tin",
    year: "2023-2027",
    advisor: "TS. Lê Thị Thúy Nga",
    email: "ngaltt@dlu.edu.vn",
    leader: "Lê Hoàng Minh (2312565)",
    count: 1,
    description:
      "Lớp Công nghệ thông tin Khóa 45 - Định hướng Trí tuệ nhân tạo",
  },
  {
    id: 3,
    name: "CTK46B",
    faculty: "Khoa Công nghệ Thông tin",
    year: "2024-2028",
    advisor: "TS. Đặng Hải Nam",
    email: "namdh@dlu.edu.vn",
    leader: "Bùi Thị Cẩm Tú (24120112)",
    count: 1,
    description: "Lớp Tân sinh viên K46 Công nghệ thông tin",
  },
  {
    id: 4,
    name: "QTK43B",
    faculty: "Khoa Kinh tế & Quản trị",
    year: "2022-2026",
    advisor: "ThS. Hoàng Minh Khôi",
    email: "khoihm@dlu.edu.vn",
    leader: "Trần Thị Mai Phương (22140012)",
    count: 1,
    description: "Lớp Quản trị kinh doanh Quốc tế K43",
  },
  {
    id: 5,
    name: "NNA45C",
    faculty: "Khoa Ngoại ngữ",
    year: "2022-2026",
    advisor: "ThS. Đỗ Phương Thảo",
    email: "thaodp@dlu.edu.vn",
    leader: "Phạm Quỳnh Anh (22150089)",
    count: 1,
    description: "Lớp Ngôn ngữ Anh Biên - Phiên dịch K45",
  },
  {
    id: 6,
    name: "LUK44A",
    faculty: "Khoa Luật",
    year: "2021-2025",
    advisor: "TS. Vũ Đình Hùng",
    email: "hungvd@dlu.edu.vn",
    leader: "Võ Minh Đức (21130099)",
    count: 1,
    description: "Lớp Luật Kinh tế & Dân sự K44",
  },
  {
    id: 7,
    name: "SPK45B",
    faculty: "Khoa Sư phạm & KHXH",
    year: "2023-2027",
    advisor: "TS. Nguyễn Thị Minh Châu",
    email: "chauntm@dlu.edu.vn",
    leader: "Đỗ Thảo Vy (23160034)",
    count: 2,
    description: "Lớp Sư phạm Khoa học xã hội Khóa 45",
  },
  {
    id: 8,
    name: "QTK44A",
    faculty: "Khoa Kinh tế & Quản trị",
    year: "2023-2027",
    advisor: "ThS. Phạm Ngọc Lan",
    email: "lanpn@dlu.edu.vn",
    leader: "Nguyễn Thị Bích Trâm (23140128)",
    count: 2,
    description: "Lớp Quản trị kinh doanh Khóa 44",
  },
];

const permissionRows = [
  [
    "Quản trị hệ thống",
    "Cấu hình tham số, phân quyền cao & bảo mật",
    [1, 0, 0, 0, 0],
  ],
  [
    "Quản lý tài khoản",
    "Tạo tài khoản, cấp quyền, khóa/mở và đặt lại mật khẩu",
    [1, 0, 0, 0, 0],
  ],
  [
    "Tạo hoạt động mới",
    "Đăng ký sự kiện, lập kế hoạch & thiết lập điểm rèn luyện",
    [1, 1, 1, 0, 0],
  ],
  [
    "Chỉnh sửa hoạt động",
    "Cập nhật địa điểm, thời lượng hoặc đóng hoạt động",
    [1, 0, 1, 0, 0],
  ],
  [
    "Duyệt minh chứng rèn luyện",
    "Thẩm định hồ sơ hình ảnh, xét duyệt cộng điểm",
    [1, 1, 1, 0, 0],
  ],
  [
    "Cấp chứng nhận số",
    "Ký số và phát hành giấy chứng nhận hoàn thành",
    [1, 1, 1, 0, 0],
  ],
  [
    "Quản lý hồ sơ sinh viên",
    "Thêm mới, sửa thông tin cá nhân, CCCD, lý lịch",
    [1, 1, 0, 1, 0],
  ],
  [
    "Quản lý lớp sinh hoạt",
    "Tạo lớp, chuyển lớp sinh viên và phân công cố vấn",
    [1, 1, 0, 0, 0],
  ],
  [
    "Xuất báo cáo & Quyết định",
    "Trích xuất báo cáo thống kê và khen thưởng",
    [1, 1, 1, 1, 0],
  ],
];

const permissionRoleOptions = [
  "Tất cả vai trò",
  "Admin",
  "Trợ lý",
  "Chủ nhiệm & Ban cán sự",
  "Sinh viên",
];

function getPermissionRole(role) {
  if (role.includes("Quản Trị")) return "Admin";
  if (role === "Sinh Viên") return "Sinh viên";
  if (role.includes("Cố Vấn")) return "Chủ nhiệm & Ban cán sự";
  return "Trợ lý";
}

function Icon({ name, className = "" }) {
  return (
    <img
      className={`manager-icon ${className}`}
      src={`/icons/${name}.svg`}
      alt=""
      aria-hidden="true"
    />
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="manager-toast" role="status">
      <span className="manager-toast__check">
        <Icon name="check" />
      </span>
      <span>{message}</span>
      <button onClick={onClose} aria-label="Đóng thông báo">
        <Icon name="close" />
      </button>
    </div>
  );
}

function Modal({ title, subtitle, icon, children, onClose, wide = false }) {
  return (
    <div
      className="manager-modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className={`manager-modal${wide ? " manager-modal--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-modal-title"
      >
        <header className="manager-modal__header">
          <div className="manager-modal__title">
            <span className="manager-modal__icon">
              <Icon name={icon} />
            </span>
            <div>
              <h2 id="manager-modal-title">{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          <button className="manager-close" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Field({ label, children, full = false }) {
  return (
    <label className={`manager-field${full ? " manager-field--full" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Manager() {
  const [mainTab, setMainTab] = useState("accounts");
  const [accountTab, setAccountTab] = useState("students");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả vai trò");
  const [unitFilter, setUnitFilter] = useState("Tất cả Khoa / Đơn vị");
  const [facultyFilter, setFacultyFilter] = useState("Tất cả Khoa / Viện");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [students, setStudents] = useState(initialStudents);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };
  const filteredAccounts = useMemo(
    () =>
      accounts.filter((item) => {
        const text =
          `${item.name} ${item.username} ${item.email}`.toLowerCase();
        return (
          text.includes(search.toLowerCase()) &&
          (roleFilter === "Tất cả vai trò" ||
            getPermissionRole(item.role) === roleFilter) &&
          (unitFilter === "Tất cả Khoa / Đơn vị" || item.unit === unitFilter)
        );
      }),
    [accounts, search, roleFilter, unitFilter],
  );
  const filteredStudents = useMemo(
    () =>
      students.filter((item) => {
        const text =
          `${item.name} ${item.mssv} ${item.cccd} ${item.email}`.toLowerCase();
        return (
          text.includes(search.toLowerCase()) &&
          (facultyFilter === "Tất cả Khoa / Viện" ||
            item.faculty === facultyFilter) &&
          true
        );
      }),
    [students, search, facultyFilter],
  );

  function resetFilters() {
    setSearch("");
    setRoleFilter("Tất cả vai trò");
    setUnitFilter("Tất cả Khoa / Đơn vị");
    setFacultyFilter("Tất cả Khoa / Viện");
  }
  function openCreate(type) {
    setModal({ type, data: null });
  }
  function saveAccount(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = {
      id: Date.now(),
      name: form.get("name"),
      username: form.get("username"),
      email: form.get("email"),
      role: form.get("role"),
      unit: form.get("unit"),
      lastLogin: "Chưa đăng nhập",
      status: "Hoạt động",
      permissions: "Quyền mặc định của vai trò",
    };
    setAccounts((current) =>
      modal.data
        ? current.map((item) =>
            item.id === modal.data.id
              ? { ...item, ...data, id: item.id }
              : item,
          )
        : [...current, data],
    );
    setModal(null);
    notify(
      modal.data ? "Đã lưu thay đổi tài khoản" : "Tạo tài khoản thành công",
    );
  }
  function saveStudent(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = {
      id: Date.now(),
      name: form.get("name"),
      mssv: form.get("mssv"),
      gender: form.get("gender"),
      birth: form.get("birth"),
      className: form.get("className"),
      faculty: form.get("faculty"),
      cccd: form.get("cccd"),
      email: form.get("email"),
      phone: form.get("phone"),
      status: form.get("status"),
      score: 0,
      rank: "Chưa xếp loại",
    };
    setStudents((current) =>
      modal.data
        ? current.map((item) =>
            item.id === modal.data.id
              ? { ...item, ...data, id: item.id }
              : item,
          )
        : [...current, data],
    );
    setModal(null);
    notify(
      modal.data ? "Đã cập nhật hồ sơ sinh viên" : "Thêm sinh viên thành công",
    );
  }
  function deleteItem(type, id) {
    if (!window.confirm("Bạn có chắc muốn xóa dữ liệu này?")) return;
    type === "student"
      ? setStudents((current) => current.filter((item) => item.id !== id))
      : setAccounts((current) => current.filter((item) => item.id !== id));
    notify("Đã xóa dữ liệu");
  }

  const faculties = [...new Set(students.map((item) => item.faculty))];
  const units = [...new Set(accounts.map((item) => item.unit))];

  return (
    <section className="manager-page">
      <div className="manager-main-tabs">
        <button
          className={mainTab === "accounts" ? "is-active" : ""}
          onClick={() => {
            setMainTab("accounts");
            resetFilters();
          }}
        >
          <Icon name="key" /> Phân Quyền Người Dùng & Quản Lý Tài Khoản <b>7</b>
        </button>
        <button
          className={mainTab === "students" ? "is-active" : ""}
          onClick={() => {
            setMainTab("students");
            setAccountTab("students");
            resetFilters();
          }}
        >
          <Icon name="profile" /> Quản Lý Sinh Viên & Lớp Sinh Hoạt{" "}
          <b className="manager-count--orange">
            {mainTab === "students" ? "8 SV · 8 Lớp" : "8 SV · 8 Lớp"}
          </b>
        </button>
      </div>

      {mainTab === "accounts" ? (
        <>
          <div className="manager-toolbar manager-toolbar--accounts">
            <div>
              <strong>Bộ lọc danh sách tài khoản:</strong>
              <span> (7 tài khoản phù hợp)</span>
            </div>
            <div className="manager-actions">
              <button
                className="manager-button manager-button--outline"
                onClick={() => setModal({ type: "permissions" })}
              >
                <Icon name="key" /> Ma Trận Phân Quyền
              </button>
              <button
                className="manager-button manager-button--primary"
                onClick={() => openCreate("account")}
              >
                <Icon name="profile" /> Tạo Tài Khoản Mới
              </button>
            </div>
          </div>
          <div className="manager-filter">
            <label className="manager-search">
              <Icon name="list" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo họ tên, username, email..."
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
                  <th>ĐƠN VỊ / KHOA QUẢN LÝ</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="manager-person">
                        <span className="manager-avatar">
                          {item.name.charAt(0)}
                        </span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>
                            @{item.username} <em>ROOT</em>
                          </small>
                          <small>{item.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`manager-role ${item.role === "Sinh Viên" ? "manager-role--student" : item.role.includes("Cố Vấn") ? "manager-role--orange" : ""}`}
                      >
                        {item.role}
                      </span>
                      <small className="manager-last-login">
                        Lần đăng nhập: {item.lastLogin}
                      </small>
                    </td>
                    <td>
                      <strong>{item.unit}</strong>
                      {item.className && (
                        <small className="manager-class-tag">
                          {item.className}
                        </small>
                      )}
                      <small className="manager-note">
                        Đơn vị phụ trách và quản lý tài khoản
                      </small>
                    </td>
                    <td>
                      <div className="manager-row-actions">
                        <button
                          onClick={() =>
                            setModal({ type: "account", data: item })
                          }
                          aria-label="Sửa tài khoản"
                        >
                          <Icon name="custom" />
                        </button>
                        <button
                          onClick={() =>
                            notify(
                              item.status === "Đã khóa"
                                ? "Đã mở khóa tài khoản"
                                : "Đã khóa tài khoản",
                            )
                          }
                          aria-label="Khóa tài khoản"
                        >
                          <Icon name="lock" />
                        </button>
                        <button
                          onClick={() => notify("Đã đặt lại mật khẩu tạm thời")}
                          aria-label="Đặt lại mật khẩu"
                        >
                          <Icon name="change_pass" />
                        </button>
                        {item.id > 1 && (
                          <button
                            onClick={() => deleteItem("account", item.id)}
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
              <EmptyState onReset={resetFilters} />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="manager-toolbar manager-toolbar--student">
            <div className="manager-subtabs">
              <button
                className={accountTab === "students" ? "is-active" : ""}
                onClick={() => setAccountTab("students")}
              >
                <Icon name="profile" /> Thông Tin Cá Nhân Sinh Viên <b>8</b>
              </button>
              <button
                className={accountTab === "classes" ? "is-active" : ""}
                onClick={() => setAccountTab("classes")}
              >
                <Icon name="manager" /> Quản Lý Lớp & Cố Vấn Phụ Trách <b>8</b>
              </button>
            </div>
            <div className="manager-actions">
              <button
                className="manager-button manager-button--outline"
                onClick={() => notify("Đang chuẩn bị file Excel/CSV...")}
              >
                <Icon name="report" /> Xuất Excel/CSV
              </button>
              <button
                className="manager-button manager-button--primary"
                onClick={() =>
                  openCreate(accountTab === "classes" ? "class" : "student")
                }
              >
                <Icon name={accountTab === "classes" ? "manager" : "profile"} />{" "}
                {accountTab === "classes"
                  ? "Thêm Lớp Sinh Hoạt Mới"
                  : "Thêm Sinh Viên Mới"}
              </button>
            </div>
          </div>
          {accountTab === "students" ? (
            <>
              <div className="manager-filter manager-filter--students">
                <label className="manager-search">
                  <Icon name="list" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm MSSV, Họ tên, CCCD, Email..."
                  />
                </label>
                <select
                  value={facultyFilter}
                  onChange={(event) => setFacultyFilter(event.target.value)}
                >
                  <option>Tất cả Khoa / Viện</option>
                  {faculties.map((faculty) => (
                    <option key={faculty}>{faculty}</option>
                  ))}
                </select>
              </div>
              <div className="manager-table-wrap">
                <table className="manager-table manager-table--students">
                  <thead>
                    <tr>
                      <th></th>
                      <th>THÔNG TIN SINH VIÊN</th>
                      <th>LỚP & KHOA</th>
                      <th>NHÂN THÂN & CCCD</th>
                      <th>LIÊN HỆ</th>
                      <th>TRẠNG THÁI & RÈN LUYỆN</th>
                      <th>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td>
                          <div className="manager-person">
                            <span className="manager-avatar manager-avatar--student">
                              {item.name.charAt(0)}
                            </span>
                            <div>
                              <strong>{item.name}</strong>
                              <small>
                                <em>{item.mssv}</em> · {item.gender} ·{" "}
                                {item.birth}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong className="manager-orange-text">
                            Lớp {item.className}
                          </strong>
                          <small>{item.faculty}</small>
                          <small>Khóa: 2021-2025</small>
                        </td>
                        <td>
                          <strong>{item.cccd}</strong>
                          <small>TP. Đà Lạt, Lâm Đồng</small>
                        </td>
                        <td>
                          <strong>{item.email}</strong>
                          <small>{item.phone}</small>
                        </td>
                        <td>
                          <span
                            className={`manager-student-status ${item.status.includes("Cảnh") ? "manager-student-status--warning" : ""}`}
                          >
                            {item.status}
                          </span>
                          <strong>
                            ĐRL: {item.score}đ ({item.rank})
                          </strong>
                        </td>
                        <td>
                          <div className="manager-row-actions">
                            <button
                              onClick={() =>
                                setModal({ type: "student", data: item })
                              }
                              aria-label="Sửa sinh viên"
                            >
                              <Icon name="custom" />
                            </button>
                            <button
                              onClick={() => deleteItem("student", item.id)}
                              aria-label="Xóa sinh viên"
                            >
                              <Icon name="trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStudents.length === 0 && (
                  <EmptyState onReset={resetFilters} />
                )}
              </div>
            </>
          ) : (
            <ClassGrid
              classes={classes}
              onEdit={(item) => setModal({ type: "class", data: item })}
              onDelete={() => notify("Đã xóa lớp sinh hoạt")}
              onView={() => {
                setAccountTab("students");
                notify("Đã lọc sinh viên theo lớp");
              }}
            />
          )}
        </>
      )}
      {modal?.type === "permissions" && (
        <PermissionModal onClose={() => setModal(null)} />
      )}
      {modal?.type === "account" && (
        <AccountModal
          data={modal.data}
          onClose={() => setModal(null)}
          onSubmit={saveAccount}
        />
      )}
      {modal?.type === "student" && (
        <StudentModal
          data={modal.data}
          onClose={() => setModal(null)}
          onSubmit={saveStudent}
        />
      )}
      {modal?.type === "class" && (
        <ClassModal
          data={modal.data}
          onClose={() => setModal(null)}
          onSave={() => {
            setModal(null);
            notify("Đã lưu lớp sinh hoạt");
          }}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </section>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="manager-empty">
      <strong>Không tìm thấy dữ liệu phù hợp</strong>
      <button onClick={onReset}>Xóa bộ lọc</button>
    </div>
  );
}

function ClassGrid({ classes: classList, onEdit, onDelete, onView }) {
  return (
    <>
      <div className="manager-filter manager-filter--class">
        <label className="manager-search">
          <Icon name="list" />
          <input placeholder="Tìm theo tên lớp, cố vấn, lớp trưởng..." />
        </label>
        <select>
          <option>Tất cả Khoa / Viện</option>
          <option>Khoa Công nghệ Thông tin</option>
          <option>Khoa Kinh tế & Quản trị</option>
        </select>
        <strong>Tổng số: {classList.length} lớp sinh hoạt</strong>
      </div>
      <div className="manager-class-grid">
        {classList.map((item) => (
          <article className="manager-class-card" key={item.id}>
            <header>
              <div>
                <h2>
                  Lớp {item.name} <span>Đang học</span>
                </h2>
                <strong>{item.faculty}</strong>
                <small>Niên khóa: {item.year}</small>
              </div>
              <b>
                {item.count}
                <small>sĩ số SV</small>
              </b>
            </header>
            <p className="manager-class-description">{item.description}</p>
            <dl>
              <dt>Cố vấn học tập:</dt>
              <dd>{item.advisor}</dd>
              <dt>Liên hệ CVHT:</dt>
              <dd>{item.email}</dd>
              <dt>Lớp trưởng:</dt>
              <dd>{item.leader}</dd>
              <dt>Bí thư chi đoàn:</dt>
              <dd>Trần Hoàng Long</dd>
            </dl>
            <footer>
              <button onClick={onView}>
                <Icon name="profile" /> Xem {item.count} sinh viên
              </button>
              <button onClick={() => onEdit(item)} aria-label="Sửa lớp">
                <Icon name="custom" />
              </button>
              <button onClick={onDelete} aria-label="Xóa lớp">
                <Icon name="trash" />
              </button>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}

function AccountModal({ data, onClose, onSubmit }) {
  return (
    <Modal
      title={data ? "Chỉnh sửa tài khoản" : "Tạo tài khoản hệ thống mới"}
      subtitle={
        data
          ? `@${data.username} (${data.name})`
          : "Cấp tài khoản đăng nhập & phân quyền cán bộ / sinh viên"
      }
      icon={data ? "custom" : "key"}
    >
      <form className="manager-form" onSubmit={onSubmit}>
        <Field label="Tên đăng nhập (Username) *">
          <input
            name="username"
            defaultValue={data?.username}
            placeholder="ví dụ: hunghl_cntt"
            required
          />
        </Field>
        <Field label="Mật khẩu khởi tạo *">
          <input
            name="password"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            required={!data}
          />
        </Field>
        <Field label="Họ và tên đầy đủ *" full>
          <input
            name="name"
            defaultValue={data?.name}
            placeholder="ví dụ: ThS. Lê Hữu Hưng"
            required
          />
        </Field>
        <Field label="Email công vụ / DLU *">
          <input
            name="email"
            type="email"
            defaultValue={data?.email}
            placeholder="hunglh@dlu.edu.vn"
            required
          />
        </Field>
        <Field label="Số điện thoại">
          <input name="phone" placeholder="0912 345 678" />
        </Field>
        <Field label="Vai trò (Phân quyền chính) *">
          <select
            name="role"
            defaultValue={data?.role || "Cán bộ Khoa / Cố vấn Học tập"}
          >
            <option>Cán bộ Khoa / Cố vấn Học tập</option>
            <option>Quản Trị Viên (Admin)</option>
            <option>Ban Giám Hiệu / CTSV</option>
            <option>Đoàn - Hội Sinh Viên</option>
            <option>Sinh Viên</option>
          </select>
        </Field>
        <Field label="Khoa / Đơn vị phụ trách *">
          <select
            name="unit"
            defaultValue={data?.unit || "Khoa Công nghệ Thông tin"}
          >
            <option>Khoa Công nghệ Thông tin</option>
            <option>Khoa Kinh tế & Quản trị</option>
            <option>Khoa Luật</option>
            <option>Phòng Công tác Sinh viên (CTSV)</option>
          </select>
        </Field>
        <div className="manager-alert">
          ⓘ Tài khoản sau khi tạo sẽ tự động được gán các quyền hạn tương ứng
          theo Ma Trận Phân quyền.
        </div>
        <ModalActions
          onClose={onClose}
          label={data ? "Lưu thay đổi" : "Khởi tạo tài khoản"}
        />
      </form>
    </Modal>
  );
}

function StudentModal({ data, onClose, onSubmit }) {
  return (
    <Modal
      title={data ? "Chỉnh sửa hồ sơ sinh viên" : "Thêm Hồ Sơ Sinh Viên Mới"}
      subtitle={
        data
          ? `${data.mssv} · ${data.name}`
          : "Nhập thông tin cá nhân và lớp sinh hoạt"
      }
      icon="profile"
      wide
    >
      <form className="manager-form" onSubmit={onSubmit}>
        <Field label="Họ và Tên (*)">
          <input
            name="name"
            defaultValue={data?.name}
            placeholder="Ví dụ: Nguyễn Văn An"
            required
          />
        </Field>
        <Field label="Mã Số Sinh Viên (MSSV) (*)">
          <input
            name="mssv"
            defaultValue={data?.mssv}
            placeholder="Ví dụ: 22120099"
            required
          />
        </Field>
        <Field label="Giới tính">
          <select name="gender" defaultValue={data?.gender || "Nam"}>
            <option>Nam</option>
            <option>Nữ</option>
          </select>
        </Field>
        <Field label="Ngày sinh">
          <input name="birth" type="date" defaultValue={data?.birth} />
        </Field>
        <Field label="Số CCCD / CMND (*)">
          <input
            name="cccd"
            defaultValue={data?.cccd}
            placeholder="068204008945"
            required
          />
        </Field>
        <Field label="Khoa / Viện trực thuộc (*)">
          <select
            name="faculty"
            defaultValue={data?.faculty || "Khoa Công nghệ Thông tin"}
          >
            <option>Khoa Công nghệ Thông tin</option>
            <option>Khoa Kinh tế & Quản trị</option>
            <option>Khoa Ngoại ngữ</option>
            <option>Khoa Luật</option>
            <option>Khoa Sư phạm & KHXH</option>
          </select>
        </Field>
        <Field label="Lớp sinh hoạt (*)">
          <select name="className" defaultValue={data?.className || "CTK44A"}>
            <option>CTK44A</option>
            <option>CTK45A</option>
            <option>QTK43B</option>
            <option>NNA45C</option>
            <option>LUK44A</option>
          </select>
        </Field>
        <Field label="Email sinh viên (*)">
          <input
            name="email"
            type="email"
            defaultValue={data?.email}
            placeholder="22120099@dlu.edu.vn"
            required
          />
        </Field>
        <Field label="Số điện thoại liên hệ">
          <input
            name="phone"
            defaultValue={data?.phone}
            placeholder="0912345678"
          />
        </Field>
        <Field label="Trạng thái học vụ">
          <select name="status" defaultValue={data?.status || "Đang học"}>
            <option>Đang học</option>
            <option>Cảnh báo rèn luyện</option>
            <option>Bảo lưu</option>
            <option>Đã tốt nghiệp</option>
          </select>
        </Field>
        <ModalActions
          onClose={onClose}
          label={data ? "Lưu Sinh Viên" : "Lưu Sinh Viên"}
        />
      </form>
    </Modal>
  );
}

function ClassModal({ data, onClose, onSave }) {
  return (
    <Modal
      title={data ? "Chỉnh sửa lớp sinh hoạt" : "Tạo Lớp Học Sinh Hoạt Mới"}
      icon="manager"
    >
      <form
        className="manager-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <Field label="Mã / Tên Lớp (*)">
          <input
            defaultValue={data?.name}
            placeholder="Ví dụ: CTK47A"
            required
          />
        </Field>
        <Field label="Niên khóa (*)">
          <input defaultValue={data?.year} placeholder="2025-2029" required />
        </Field>
        <Field label="Khoa / Viện trực thuộc (*)" full>
          <select defaultValue={data?.faculty || "Khoa Công nghệ Thông tin"}>
            <option>Khoa Công nghệ Thông tin</option>
            <option>Khoa Kinh tế & Quản trị</option>
            <option>Khoa Ngoại ngữ</option>
            <option>Khoa Luật</option>
          </select>
        </Field>
        <Field label="Cố vấn học tập phụ trách (*)">
          <input
            defaultValue={data?.advisor}
            placeholder="Ví dụ: TS. Lê Thị Thúy Nga"
            required
          />
        </Field>
        <Field label="Email cố vấn (*)">
          <input
            defaultValue={data?.email}
            placeholder="covan@dlu.edu.vn"
            required
          />
        </Field>
        <Field label="Lớp trưởng">
          <input placeholder="Họ tên sinh viên làm lớp trưởng" />
        </Field>
        <Field label="Bí thư chi đoàn">
          <input placeholder="Họ tên sinh viên làm bí thư" />
        </Field>
        <Field label="Mô tả định hướng / Chuyên ngành" full>
          <input
            defaultValue={data?.description}
            placeholder="Ví dụ: Lớp Kỹ thuật phần mềm & AI ứng dụng..."
          />
        </Field>
        <Field label="Trạng thái lớp" full>
          <select>
            <option>Đang học</option>
            <option>Đã kết thúc</option>
          </select>
        </Field>
        <ModalActions
          onClose={onClose}
          label={data ? "Lưu thay đổi" : "Tạo Lớp"}
        />
      </form>
    </Modal>
  );
}

function ModalActions({ onClose, label }) {
  return (
    <div className="manager-modal-actions">
      <button
        type="button"
        className="manager-button manager-button--outline"
        onClick={onClose}
      >
        Hủy bỏ
      </button>
      <button type="submit" className="manager-button manager-button--primary">
        {label}
      </button>
    </div>
  );
}

function PermissionModal({ onClose }) {
  return (
    <Modal
      title="Ma Trận Phân Quyền Theo Vai Trò (Role & Permission Matrix)"
      subtitle="Quy chuẩn phân quyền kiểm soát truy cập theo vai trò trên toàn hệ thống UniActivity"
      icon="check"
      wide
    >
      <div className="manager-permission-table">
        <div className="manager-permission-row manager-permission-head">
          <strong>Danh mục Quyền Hạn</strong>
          <b>Admin</b>
          <b>Trợ lý</b>
          <b>Chủ nhiệm & Ban cán sự</b>
          <b>Sinh viên</b>
        </div>
        {permissionRows.map(([title, description, values]) => (
          <div className="manager-permission-row" key={title}>
            <div>
              <strong>{title}</strong>
              <small>{description}</small>
            </div>
            {values.slice(0, 4).map((value, index) => (
              <span
                className={
                  value
                    ? `manager-permission-check manager-permission-check--${index}`
                    : "manager-permission-dash"
                }
                key={`${title}-${index}`}
              >
                {value ? <Icon name="check-circle" /> : "-"}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="manager-permission-footer">
        <button
          className="manager-button manager-button--outline"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </Modal>
  );
}

export default Manager;
