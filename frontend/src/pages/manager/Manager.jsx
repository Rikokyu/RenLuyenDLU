import { useEffect, useMemo, useState } from "react";
import ManagerAccounts from "./ManagerAccounts";
import ManagerStudentClass from "./ManagerStudentClass";
import {
  deleteManagerAccount,
  deleteManagerClass,
  deleteManagerStudent,
  getManagerAccounts,
  getManagerClasses,
  getManagerRoles,
  getManagerStudents,
  resetManagerAccountPassword,
  saveManagerAccount,
  saveManagerClass,
  saveManagerStudent,
} from "../../services/managerService";
import { exportManagerWorkbook } from "../../utils/managerExport";
import "./Manager.css";

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

function ModalShell({
  title,
  subtitle,
  icon = "profile",
  children,
  wide = false,
  onClose,
}) {
  return (
    <div
      className="manager-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className={`manager-modal ${wide ? "manager-modal--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="manager-modal__header">
          <div className="manager-modal__title">
            <span className="manager-modal__icon">
              <Icon name={icon} />
            </span>
            <div>
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>

          <button
            className="manager-close"
            type="button"
            onClick={onClose}
            aria-label="Đóng"
          >
            <Icon name="close" />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}

function AccountModal({ initialData, roles, classes, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: initialData?.name || "",
    email: initialData?.email || "",
    gender: initialData?.gender || "Nam",
    birthDay: initialData?.birthDay?.slice(0, 10) || "",
    phone: initialData?.phone || "",
    roleCode:
      initialData?.roleCode ||
      roles.find((role) => role.code === "STUDENT_AFFAIRS_ASSISTANT")?.code ||
      roles[0]?.code ||
      "",
    unit: initialData?.unit || "",
    position: initialData?.position || "",
    active: initialData?.active ?? true,
  }));
  const units = [
    ...new Set(
      [
        ...classes.map((item) => item.faculty),
        ...classes.map((item) => item.code),
      ].filter(Boolean),
    ),
  ];

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    onSave({
      ...(initialData || {}),
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      unit: form.unit.trim(),
      position: form.roleCode === "HOMEROOM_CLASS_OFFICER" ? form.position : "",
    });
  }

  return (
    <ModalShell
      title={initialData ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}
      subtitle={`Email là tên đăng nhập; mật khẩu mặc định là DLU@${new Date().getFullYear()}.`}
      icon="profile"
      onClose={onClose}
    >
      <form className="manager-form" onSubmit={submit}>
        <label className="manager-field manager-field--full">
          <span>Họ và tên</span>
          <input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Nhập họ và tên"
            required
          />
        </label>

        <label className="manager-field">
          <span>Email đăng nhập</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="example@dlu.edu.vn"
            required
          />
        </label>

        <label className="manager-field">
          <span>Giới tính</span>
          <select
            value={form.gender}
            onChange={(event) => update("gender", event.target.value)}
            required
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </label>

        <label className="manager-field">
          <span>Ngày sinh</span>
          <input
            type="date"
            value={form.birthDay}
            onChange={(event) => update("birthDay", event.target.value)}
            required
          />
        </label>

        <label className="manager-field">
          <span>Số điện thoại</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            required
          />
        </label>

        <label className="manager-field">
          <span>Vai trò hệ thống</span>
          <select
            value={form.roleCode}
            onChange={(event) => update("roleCode", event.target.value)}
            required
          >
            {roles
              .filter(
                (role) =>
                  role.code !== "STUDENT" ||
                  initialData?.roleCode === "STUDENT",
              )
              .map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name}
                </option>
              ))}
          </select>
        </label>

        <label className="manager-field">
          <span>Khoa / lớp / đơn vị</span>
          <input
            list="manager-account-units"
            value={form.unit}
            onChange={(event) => update("unit", event.target.value)}
            placeholder="Chọn hoặc nhập đơn vị"
          />
          <datalist id="manager-account-units">
            {units.map((unit) => (
              <option key={unit} value={unit} />
            ))}
          </datalist>
        </label>

        {form.roleCode === "HOMEROOM_CLASS_OFFICER" && (
          <label className="manager-field">
            <span>Chức vụ</span>
            <select
              value={form.position}
              onChange={(event) => update("position", event.target.value)}
              required
            >
              <option value="">Chọn chức vụ</option>
              {form.position &&
                !["Lớp trưởng", "Bí thư", "Bí thư Chi đoàn"].includes(
                  form.position,
                ) && <option value={form.position}>{form.position}</option>}
              <option value="Lớp trưởng">Lớp trưởng</option>
              <option value="Bí thư">Bí thư</option>
            </select>
          </label>
        )}

        <div className="manager-modal-actions">
          <button
            type="button"
            className="manager-button manager-button--outline"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="manager-button manager-button--primary"
          >
            {initialData ? "Lưu thay đổi" : "Tạo tài khoản"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function StudentModal({ initialData, classes, onClose, onSave }) {
  const firstClass = classes[0]?.code || "";
  const [form, setForm] = useState(() => ({
    name: initialData?.name || "",
    mssv: initialData?.mssv || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    classCode: initialData?.classCode || firstClass,
    gender: initialData?.gender || "Nam",
    birthDay: initialData?.birthDay
      ? String(initialData.birthDay).replace(/T00:00:00(?:\\.000)?Z$/, "")
      : "",
    birthPlace: initialData?.birthPlace || "",
  }));

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const selectedClass = classes.find((item) => item.code === form.classCode);

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.mssv.trim() || !form.email.trim()) return;

    const nameParts = form.name.trim().split(/\s+/);
    const lastName = nameParts.length > 1 ? nameParts.pop() : "";
    const firstName = nameParts.join(" ");

    onSave({
      ...(initialData || {}),
      ...form,
      name: form.name.trim(),
      mssv: form.mssv.trim(),
      email: form.email.trim(),
      studentId: form.mssv.trim(),
      firstName,
      lastName,
      studentName: form.name.trim(),
      className: selectedClass?.code || form.classCode,
      birthDay: form.birthDay ? `${form.birthDay}T00:00:00Z` : "",
    });
  }

  return (
    <ModalShell
      title={initialData ? "Chỉnh sửa sinh viên" : "Thêm sinh viên mới"}
      subtitle="Thông tin được lưu vào hồ sơ sinh viên và người dùng của cơ sở dữ liệu."
      icon="profile"
      onClose={onClose}
    >
      <form className="manager-form" onSubmit={submit}>
        <label className="manager-field manager-field--full">
          <span>Họ và tên</span>
          <input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Nguyễn Văn An"
            required
          />
        </label>

        <label className="manager-field">
          <span>Mã số sinh viên</span>
          <input
            value={form.mssv}
            onChange={(event) => update("mssv", event.target.value)}
            placeholder="21120045"
            required
          />
        </label>

        <label className="manager-field">
          <span>Số điện thoại</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="0901 234 567"
          />
        </label>

        <label className="manager-field">
          <span>Email đăng nhập</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="mssv@dlu.edu.vn"
            required
          />
        </label>

        <label className="manager-field">
          <span>Lớp sinh hoạt</span>
          <select
            value={form.classCode}
            onChange={(event) => update("classCode", event.target.value)}
            required
          >
            <option value="" disabled>
              Chọn lớp sinh hoạt
            </option>
            {classes.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code}
              </option>
            ))}
          </select>
        </label>

        <label className="manager-field">
          <span>Giới tính</span>
          <select
            value={form.gender}
            onChange={(event) => update("gender", event.target.value)}
          >
            <option>Nam</option>
            <option>Nữ</option>
          </select>
        </label>

        <label className="manager-field">
          <span>Ngày sinh</span>
          <input
            type="date"
            value={form.birthDay ? form.birthDay.slice(0, 10) : ""}
            onChange={(event) => update("birthDay", event.target.value)}
            required
          />
        </label>

        <label className="manager-field">
          <span>Nơi sinh</span>
          <input
            value={form.birthPlace}
            onChange={(event) => update("birthPlace", event.target.value)}
            placeholder="Tỉnh/thành phố"
          />
        </label>

        <div className="manager-modal-actions">
          <button
            type="button"
            className="manager-button manager-button--outline"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="manager-button manager-button--primary"
          >
            {initialData ? "Lưu thay đổi" : "Thêm sinh viên"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ClassModal({ initialData, students, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    code: initialData?.code || "",
    faculty: initialData?.faculty || "",
    academicYear: initialData?.academicYear || "",
  }));

  const countClassCode = initialData?.code || form.code;
  const existingCount = useMemo(
    () => students.filter((item) => item.classCode === countClassCode).length,
    [students, countClassCode],
  );

  function submit(event) {
    event.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code) return;

    onSave({
      ...(initialData || {}),
      code,
      faculty: form.faculty.trim(),
      academicYear: form.academicYear.trim(),
      originalCode: initialData?.code || "",
    });
  }

  return (
    <ModalShell
      title={initialData ? "Chỉnh sửa lớp sinh hoạt" : "Thêm lớp sinh hoạt mới"}
      subtitle="Nhập thông tin lớp sinh hoạt."
      icon="manager"
      onClose={onClose}
    >
      <form className="manager-form" onSubmit={submit}>
        <label className="manager-field">
          <span>Mã lớp</span>
          <input
            value={form.code}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, code: event.target.value }))
            }
            placeholder="CTK47A"
            required
          />
        </label>

        <label className="manager-field">
          <span>Khoa / Đơn vị</span>
          <input
            value={form.faculty}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, faculty: event.target.value }))
            }
            placeholder="Công nghệ thông tin"
          />
        </label>

        <label className="manager-field">
          <span>Năm học</span>
          <input
            value={form.academicYear}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, academicYear: event.target.value }))
            }
            placeholder="2026-2027"
          />
        </label>

        <div className="manager-alert">
          Sĩ số hiện tại: {existingCount} sinh viên. Sĩ số được tính tự động từ
          danh sách sinh viên.
        </div>

        <div className="manager-modal-actions">
          <button
            type="button"
            className="manager-button manager-button--outline"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="manager-button manager-button--primary"
          >
            {initialData ? "Lưu lớp" : "Thêm lớp"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function PermissionModal({ onClose }) {
  const rows = [
    {
      group: "1. Dashboard & Tin tức",
      action: "Xem bảng tin / Tin tức hệ thống",
      values: ["✓", "✓", "✓", "✓"],
    },
    {
      group: "",
      action: "Xem tổng quan số lượng hoạt động, tỷ lệ tham gia",
      values: ["Toàn trường", "Cấp Khoa", "Cấp Lớp", "✕"],
    },
    {
      group: "",
      action: "Xem cảnh báo điểm rèn luyện",
      values: ["Toàn trường", "Cấp Khoa", "Cấp Lớp", "Cá nhân"],
    },
    {
      group: "2. Quản lý Hoạt động",
      action: "Xem danh sách hoạt động (đang / sắp diễn ra)",
      values: ["Toàn trường", "Cấp Khoa", "✓", "✓"],
    },
    {
      group: "",
      action: "Thêm, Xóa, Sửa thông tin hoạt động",
      values: ["✓", "Cấp Khoa", "✕", "✕"],
    },
    {
      group: "",
      action: "Đăng ký tham gia hoạt động",
      values: ["✕", "✕", "✕", "✓"],
    },
    {
      group: "",
      action: "Xem danh sách sinh viên tham gia hoạt động",
      values: ["Toàn trường", "Cấp Khoa", "Cấp Lớp", "✕"],
    },
    {
      group: "",
      action: "Xuất danh sách hoạt động mới nhất",
      values: ["✓", "✓", "Cấp Lớp", "✕"],
    },
    {
      group: "3. Quản lý Người dùng",
      action: "Xem / Lọc danh sách người dùng",
      values: ["Toàn trường", "Cấp Khoa", "Cấp Lớp", "✕"],
    },
    {
      group: "",
      action: "Thêm, Xóa, Sửa thông tin Khoa, Lớp",
      values: ["✓", "✕", "✕", "✕"],
    },
    {
      group: "",
      action: "Thêm, Xóa, Sửa người dùng",
      values: ["✓", "Cấp Khoa", "✕", "✕"],
    },
    {
      group: "",
      action: "Phân quyền hệ thống / Gán Role",
      values: ["✓", "✕", "✕", "✕"],
    },
    {
      group: "4. Quản lý Minh chứng",
      action: "Nộp minh chứng",
      values: ["✕", "✕", "✕", "✓"],
    },
    {
      group: "",
      action: "Xem thông tin minh chứng",
      values: ["Toàn trường", "Cấp Khoa", "Cấp Lớp", "Cá nhân"],
    },
    {
      group: "",
      action: "Duyệt / Từ chối minh chứng",
      values: ["✓", "Cấp Khoa", "Cấp Lớp (nếu cấp quyền)*", "✕"],
    },
    {
      group: "5. Báo cáo & Thống kê",
      action: "Xem / Xuất báo cáo số lượng, tỷ lệ tham gia",
      values: ["Toàn trường", "Cấp Khoa", "Cấp Lớp", "✕"],
    },
    {
      group: "",
      action: "Xuất danh sách đánh dấu hoạt động của một sinh viên",
      values: ["Toàn trường", "Cấp Khoa", "Cấp Lớp", "✕"],
    },
    {
      group: "6. Thông tin cá nhân",
      action: "Xem và cập nhật hồ sơ cá nhân",
      values: ["✓", "✓", "✓", "✓"],
    },
  ];

  const headers = [
    "Nhóm chức năng",
    "Chi tiết quyền",
    "Admin",
    "Trợ lý CTSV",
    "GVCN & Ban cán sự",
    "Sinh viên",
  ];

  return (
    <ModalShell
      title="Ma Trận Phân Quyền"
      subtitle="Dấu ✓ / ✕ thể hiện quyền thực hiện; phạm vi giới hạn dữ liệu được xem hoặc thao tác."
      icon="key"
      wide
      onClose={onClose}
    >
      <div className="manager-permission-table">
        <div className="manager-permission-row manager-permission-head">
          {headers.map((header) => (
            <b key={header}>{header}</b>
          ))}
        </div>

        {rows.map((row) => (
          <div
            className={`manager-permission-row ${row.group ? "manager-permission-row--group-start" : ""}`}
            key={row.action}
          >
            <div className="manager-permission-category">
              {row.group && <strong>{row.group}</strong>}
            </div>
            <div className="manager-permission-action">{row.action}</div>
            {row.values.map((value, index) => (
              <span
                key={`${row.action}-${index}`}
                className={`manager-permission-check manager-permission-check--${index}`}
              >
                {value === "✓" ? (
                  <span className="manager-permission-denied">✓</span>
                ) : value === "✕" ? (
                  <span className="manager-permission-denied">✕</span>
                ) : (
                  value
                )}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="manager-permission-legend">
        <p>
          <strong className="manager-permission-denied">✓</strong> Có quyền /
          toàn quyền thao tác;{" "}
          <strong className="manager-permission-denied">✕</strong> Không có
          quyền.
        </p>
        <p>
          <strong>Toàn trường / Cấp Khoa / Cấp Lớp / Cá nhân</strong> là phạm vi
          dữ liệu được xem hoặc thao tác.
        </p>
        <p>
          * Quyền duyệt minh chứng của Ban cán sự lớp là quyền nhạy cảm, chỉ áp
          dụng khi được cấp thêm quyền.
        </p>
      </div>

      <div className="manager-permission-footer">
        <button
          type="button"
          className="manager-button manager-button--outline"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </ModalShell>
  );
}

function ScoreModal({ classCode, students, onClose }) {
  const rows = useMemo(
    () =>
      students
        .filter((student) => student.classCode === classCode)
        .slice(0, 50)
        .map((student, index) => ({
          ...student,
          score: 70 + ((index * 7) % 31),
          classification: index % 8 === 0 ? "Khá" : "Tốt",
        })),
    [classCode, students],
  );

  return (
    <ModalShell
      title={`Điểm rèn luyện — lớp ${classCode}`}
      subtitle={`Hiển thị ${rows.length} sinh viên đầu tiên của dữ liệu demo.`}
      icon="report"
      wide
      onClose={onClose}
    >
      {rows.length === 0 ? (
        <div className="manager-score-state">
          Chưa có dữ liệu điểm rèn luyện cho lớp này.
        </div>
      ) : (
        <div className="manager-score-table-wrap">
          <table className="manager-table manager-score-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>MSSV</th>
                <th>HỌ VÀ TÊN</th>
                <th>LỚP</th>
                <th>ĐIỂM RL</th>
                <th>XẾP LOẠI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.mssv}</td>
                  <td>
                    <strong>{student.name}</strong>
                  </td>
                  <td>{student.classCode}</td>
                  <td>
                    <strong>{student.score}</strong>
                  </td>
                  <td>{student.classification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="manager-permission-footer">
        <button
          type="button"
          className="manager-button manager-button--outline"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </ModalShell>
  );
}

export default function Manager() {
  const [activeMainTab, setActiveMainTab] = useState("students");
  const [accounts, setAccounts] = useState([]);
  const [roles, setRoles] = useState([]);

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataError, setDataError] = useState("");
  const accountRows = useMemo(
    () => accounts.map((account) => ({ ...account, hasLoginAccount: true })),
    [accounts],
  );

  useEffect(() => {
    reloadManagerData().catch((error) => {
      console.error("Lỗi tải dữ liệu quản lý:", error);
      setDataError(
        error.response?.data?.message || "Không thể tải dữ liệu từ Database.",
      );
    });
  }, []);

  async function reloadManagerData() {
    setDataError("");
    const [studentResult, classRows, accountRows, roleRows] = await Promise.all(
      [
        getManagerStudents(),
        getManagerClasses(),
        getManagerAccounts(),
        getManagerRoles(),
      ],
    );
    const studentsFromDatabase = Array.isArray(studentResult.data)
      ? studentResult.data
      : [];
    setStudents(studentsFromDatabase);
    setClasses(Array.isArray(classRows) ? classRows : []);
    setAccounts(Array.isArray(accountRows) ? accountRows : []);
    setRoles(Array.isArray(roleRows) ? roleRows : []);
  }

  function notify(message) {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(""), 2600);
  }

  function openModal(payload) {
    setModal(payload);
  }

  function closeModal() {
    setModal(null);
  }

  async function handleDelete(type, idOrCode) {
    const record =
      type === "account"
        ? accounts.find((item) => item.id === idOrCode)
        : type === "student"
          ? students.find((item) => item.id === idOrCode)
          : classes.find((item) => item.code === idOrCode);
    const recordName =
      type === "class" ? record?.code : record?.name || idOrCode;
    const recordType =
      type === "account"
        ? "khóa người dùng"
        : type === "student"
          ? "hồ sơ sinh viên (ẩn khỏi danh sách, giữ lịch sử minh chứng)"
          : "lớp sinh hoạt (ẩn khỏi danh sách, giữ dữ liệu liên quan)";
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa ${recordType} "${recordName}" không?`,
    );
    if (!confirmed) return;

    try {
      if (type === "account") await deleteManagerAccount(idOrCode);
      if (type === "student") await deleteManagerStudent(idOrCode);
      if (type === "class") await deleteManagerClass(idOrCode);
      await reloadManagerData();
      notify(
        type === "account"
          ? "Đã khóa người dùng"
          : type === "student"
            ? "Đã ẩn hồ sơ sinh viên"
            : "Đã ẩn lớp sinh hoạt",
      );
    } catch (error) {
      notify(error.response?.data?.message || "Không thể xóa dữ liệu");
    }
  }

  async function saveAccount(data) {
    try {
      await saveManagerAccount({
        id: data.id,
        name: data.name,
        username: data.email,
        email: data.email,
        password: "",
        gender: data.gender,
        birthDay: data.birthDay,
        phone: data.phone,
        roleCode: data.roleCode,
        unit: data.unit,
        position: data.position,
        active: data.active,
      });
      await reloadManagerData();
      closeModal();
      notify(data.id ? "Đã cập nhật tài khoản" : "Đã tạo tài khoản mới");
    } catch (error) {
      notify(error.response?.data?.message || "Không thể lưu tài khoản");
    }
  }

  async function toggleAccountStatus(account) {
    try {
      await saveManagerAccount({
        id: account.id,
        name: account.name,
        username: account.email,
        email: account.email,
        gender: account.gender,
        birthDay: account.birthDay,
        phone: account.phone,
        roleCode: account.roleCode,
        unit: account.unit,
        position: account.position,
        active: !account.active,
      });
      await reloadManagerData();
      notify(account.active ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
    } catch (error) {
      notify(error.response?.data?.message || "Không thể cập nhật trạng thái");
    }
  }

  async function resetAccountPassword(account) {
    const defaultPassword = `DLU@${new Date().getFullYear()}`;
    const confirmed = window.confirm(
      `Đặt lại mật khẩu cho ${account.email} về ${defaultPassword}?`,
    );
    if (!confirmed) return;

    try {
      await resetManagerAccountPassword(account.id);
      notify(`Đã đặt lại mật khẩu về ${defaultPassword}`);
    } catch (error) {
      notify(error.response?.data?.message || "Không thể đặt lại mật khẩu");
    }
  }

  async function saveStudent(data) {
    try {
      await saveManagerStudent({
        originalStudentId: data.id,
        studentId: data.studentId || data.mssv,
        email: data.email,
        phone: data.phone,
        classCode: data.classCode,
        gender: data.gender,
        birthDay: data.birthDay ? data.birthDay.slice(0, 10) : "",
        firstName: data.firstName,
        lastName: data.lastName,
        studentName: data.studentName,
        birthPlace: data.birthPlace,
      });
      await reloadManagerData();
      closeModal();
      notify(
        data.id
          ? "Đã cập nhật hồ sơ và tài khoản sinh viên"
          : "Đã thêm sinh viên và tạo tài khoản đăng nhập",
      );
    } catch (error) {
      notify(error.response?.data?.message || "Không thể lưu sinh viên");
    }
  }

  async function saveClass(data) {
    try {
      await saveManagerClass({
        originalCode: data.originalCode,
        code: data.code,
        faculty: data.faculty,
        academicYear: data.academicYear,
      });
      await reloadManagerData();
      closeModal();
      notify(
        data.originalCode
          ? "Đã cập nhật lớp sinh hoạt"
          : "Đã thêm lớp sinh hoạt mới",
      );
    } catch (error) {
      notify(error.response?.data?.message || "Không thể lưu lớp");
    }
  }

  function resetFilters() {
    // Child components own their own filters, so this is intentionally a no-op.
    // The callback exists to keep ManagerAccounts API simple and decoupled.
  }

  async function handleSync() {
    try {
      setIsSyncing(true);
      await reloadManagerData();
      notify("Đã tải lại dữ liệu từ Database");
    } catch (error) {
      notify(error.response?.data?.message || "Tải lại dữ liệu thất bại");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleExport() {
    try {
      await exportManagerWorkbook({
        students,
        classes,
        accounts: accountRows,
      });
      notify("Đã xuất Excel gồm 3 sheet");
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      notify("Không thể xuất file Excel");
    }
  }

  const managerTitleCount = useMemo(
    () => ({
      accountCount: accounts.length,
      studentCount: students.length,
      classCount: classes.length,
    }),
    [accounts.length, students.length, classes.length],
  );

  return (
    <main className="manager-page">
      <nav className="manager-main-tabs" aria-label="Khu vực quản lý">
        <button
          type="button"
          className={activeMainTab === "accounts" ? "is-active" : ""}
          onClick={() => setActiveMainTab("accounts")}
        >
          <Icon name="key" />
          Phân Quyền Người Dùng &amp; Quản Lý Tài Khoản
          <b>{managerTitleCount.accountCount} người dùng</b>
        </button>

        <button
          type="button"
          className={activeMainTab === "students" ? "is-active" : ""}
          onClick={() => setActiveMainTab("students")}
        >
          <Icon name="profile" />
          Quản Lý Sinh Viên &amp; Lớp Sinh Hoạt
          <b className="manager-count--orange">
            {managerTitleCount.studentCount} SV · {managerTitleCount.classCount}{" "}
            Lớp
          </b>
        </button>
      </nav>

      {activeMainTab === "accounts" ? (
        <ManagerAccounts
          accounts={accountRows}
          onToggleStatus={toggleAccountStatus}
          onResetPassword={resetAccountPassword}
          onOpenModal={(payload) => {
            openModal(payload);
          }}
          onDelete={handleDelete}
          resetFilters={resetFilters}
        />
      ) : (
        <ManagerStudentClass
          students={students}
          classes={classes}
          onOpenModal={openModal}
          onDelete={handleDelete}
          onExport={handleExport}
          onSync={handleSync}
          isSyncing={isSyncing}
          dataError={dataError}
          onOpenClassModal={(classData) =>
            setModal({ type: "class", data: classData })
          }
          onOpenScores={(classCode) => setModal({ type: "scores", classCode })}
        />
      )}

      {modal?.type === "permissions" && (
        <PermissionModal onClose={closeModal} />
      )}

      {modal?.type === "account" && (
        <AccountModal
          initialData={modal.data}
          roles={roles}
          classes={classes}
          onClose={closeModal}
          onSave={saveAccount}
        />
      )}

      {modal?.type === "student" && (
        <StudentModal
          initialData={modal.data}
          classes={classes}
          onClose={closeModal}
          onSave={saveStudent}
        />
      )}

      {modal?.type === "class" && (
        <ClassModal
          initialData={modal.data}
          students={students}
          onClose={closeModal}
          onSave={saveClass}
        />
      )}

      {modal?.type === "scores" && (
        <ScoreModal
          classCode={modal.classCode}
          students={students}
          onClose={closeModal}
        />
      )}

      {toast && (
        <div className="manager-toast" role="status">
          <span className="manager-toast__check">✓</span>
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast("")}
            aria-label="Đóng thông báo"
          >
            <Icon name="close" />
          </button>
        </div>
      )}
    </main>
  );
}
