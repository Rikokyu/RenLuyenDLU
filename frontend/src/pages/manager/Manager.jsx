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

const STUDY_PROGRAMS = ["CQ22CT-PM", "CQ23CT-PM", "CQ23CT-MM1", "CQ24CT"];

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
    roleCode:
      initialData?.roleCode ||
      roles.find((role) => role.code === "STUDENT_AFFAIRS_ASSISTANT")?.code ||
      roles[0]?.code ||
      "",
    unit: initialData?.unit || "Khoa Công nghệ Thông tin",
    classCode: initialData?.classCode || "",
    active: initialData?.active ?? true,
  }));

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
    });
  }

  return (
    <ModalShell
      title={initialData ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}
      subtitle="Email là tên đăng nhập; mật khẩu tạm được thiết lập tự động."
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
          <span>Vai trò hệ thống</span>
          <select
            value={form.roleCode}
            onChange={(event) => update("roleCode", event.target.value)}
            required
          >
            {roles
              .filter((role) => role.code !== "STUDENT")
              .map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name}
                </option>
              ))}
          </select>
        </label>

        <label className="manager-field">
          <span>Đơn vị / Khoa quản lý</span>
          <input
            value={form.unit}
            onChange={(event) => update("unit", event.target.value)}
            placeholder="Phòng Công tác Sinh viên"
          />
        </label>

        <label className="manager-field">
          <span>Lớp phụ trách</span>
          <select
            value={form.classCode}
            onChange={(event) => update("classCode", event.target.value)}
          >
            <option value="">Không gán lớp</option>
            {classes.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code}
              </option>
            ))}
          </select>
        </label>

        <label className="manager-field">
          <span>Trạng thái</span>
          <select
            value={form.active ? "1" : "0"}
            onChange={(event) => update("active", event.target.value === "1")}
          >
            <option value="1">Đang hoạt động</option>
            <option value="0">Đã khóa</option>
          </select>
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
    faculty:
      initialData?.facultyName ||
      classes.find(
        (item) => item.code === (initialData?.classCode || firstClass),
      )?.faculty ||
      "",
    studyProgramId: initialData?.studyProgramId || "CQ23CT-PM",
    gender: initialData?.gender || "Nam",
    birthDay: initialData?.birthDay
      ? String(initialData.birthDay).replace(/T00:00:00(?:\\.000)?Z$/, "")
      : "",
    birthPlace: initialData?.birthPlace || "",
    permanentResidence: initialData?.permanentResidence || "",
    hometownCountry: initialData?.hometownCountry || "Việt Nam",
    hometownProvince: initialData?.hometownProvince || "",
    hometownCity: initialData?.hometownCity || "",
    hometownAddress: initialData?.hometownAddress || "",
    classRoleId: initialData?.classRoleId ?? 0,
    isInClass: initialData?.isInClass ?? true,
  }));

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const selectedClass = classes.find((item) => item.code === form.classCode);

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.mssv.trim() || !form.email.trim()) return;

    const nameParts = form.name.trim().split(/\s+/);
    const lastName = nameParts.length > 1 ? nameParts.pop() : nameParts[0];
    const firstName = nameParts.length > 1 ? nameParts.join(" ") : "";

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
      subtitle="Khoa được lưu theo lớp đã chọn. Email là tên đăng nhập; mật khẩu tạm dựa trên MSSV."
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
            onChange={(event) => {
              const classCode = event.target.value;
              const faculty =
                classes.find((item) => item.code === classCode)?.faculty || "";
              setForm((prev) => ({ ...prev, classCode, faculty }));
            }}
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
          <span>Khoa của lớp</span>
          <input
            value={form.faculty}
            onChange={(event) => update("faculty", event.target.value)}
            placeholder="Công nghệ thông tin"
          />
        </label>

        <label className="manager-field">
          <span>Chương trình</span>
          <select
            value={form.studyProgramId}
            onChange={(event) => update("studyProgramId", event.target.value)}
          >
            {STUDY_PROGRAMS.map((program) => (
              <option key={program} value={program}>
                {program}
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
          />
        </label>

        <label className="manager-field">
          <span>Quốc gia</span>
          <input
            value={form.hometownCountry}
            onChange={(event) => update("hometownCountry", event.target.value)}
            placeholder="Việt Nam"
          />
        </label>

        <label className="manager-field">
          <span>Tỉnh</span>
          <input
            value={form.hometownProvince}
            onChange={(event) => update("hometownProvince", event.target.value)}
            placeholder="Lâm Đồng"
          />
        </label>

        <label className="manager-field">
          <span>Thành phố</span>
          <input
            value={form.hometownCity}
            onChange={(event) => update("hometownCity", event.target.value)}
            placeholder="Đà Lạt"
          />
        </label>

        <label className="manager-field manager-field--full">
          <span>Địa chỉ chi tiết</span>
          <input
            value={form.hometownAddress}
            onChange={(event) => update("hometownAddress", event.target.value)}
            placeholder="Số nhà, đường, phường/xã"
          />
        </label>

        <label className="manager-field">
          <span>Vai trò lớp</span>
          <select
            value={form.classRoleId}
            onChange={(event) =>
              update("classRoleId", Number(event.target.value))
            }
          >
            <option value={0}>Học viên</option>
            <option value={1}>Lớp trưởng</option>
          </select>
        </label>

        <label className="manager-field">
          <span>Trạng thái lớp</span>
          <select
            value={form.isInClass ? "1" : "0"}
            onChange={(event) =>
              update("isInClass", event.target.value === "1")
            }
          >
            <option value="1">Đang học</option>
            <option value="0">Ngoài lớp</option>
          </select>
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
            placeholder="ITK50B"
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
    ["Quản trị hệ thống", true, true, true, true],
    ["Quản lý sinh viên", true, true, true, false],
    ["Quản lý lớp sinh hoạt", true, true, true, false],
    ["Xem điểm rèn luyện", true, true, false, true],
    ["Xuất Excel / CSV", true, true, true, false],
  ];

  const headers = [
    "Quyền / Chức năng",
    "Admin",
    "Trợ lý",
    "Chủ nhiệm",
    "Sinh viên",
  ];

  return (
    <ModalShell
      title="Ma Trận Phân Quyền"
      subtitle="Ma trận minh họa cho giao diện quản lý quyền."
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
          <div className="manager-permission-row" key={row[0]}>
            <div>
              <strong>{row[0]}</strong>
              <small>Quyền áp dụng theo vai trò</small>
            </div>
            {row.slice(1).map((allowed, index) => (
              <span
                key={`${row[0]}-${index}`}
                className={`manager-permission-check manager-permission-check--${index}`}
              >
                {allowed ? (
                  <Icon name="check" />
                ) : (
                  <span className="manager-permission-dash">—</span>
                )}
              </span>
            ))}
          </div>
        ))}
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
  const accountRows = useMemo(() => {
    const linkedStudentIds = new Set(
      accounts.map((account) => account.studentId).filter(Boolean),
    );
    const existingAccounts = accounts.map((account) => ({
      ...account,
      hasLoginAccount: true,
    }));
    const studentsWithoutAccounts = students
      .filter((student) => !linkedStudentIds.has(student.id))
      .map((student) => ({
        id: null,
        name: student.name,
        email: student.email,
        role: "Sinh viên",
        roleCode: "STUDENT",
        unit: student.facultyName,
        classCode: student.classCode,
        className: student.className,
        studentId: student.id,
        status: "Chưa cấp tài khoản",
        active: false,
        lastLogin: "Chưa có tài khoản",
        hasLoginAccount: false,
      }));
    return [...existingAccounts, ...studentsWithoutAccounts];
  }, [accounts, students]);

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
        ? "tài khoản"
        : type === "student"
          ? "sinh viên"
          : "lớp sinh hoạt";
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
          ? "Đã xóa tài khoản"
          : type === "student"
            ? "Đã xóa sinh viên"
            : "Đã xóa lớp",
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
        roleCode: data.roleCode,
        unit: data.unit,
        classCode: data.classCode,
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
        roleCode: account.roleCode,
        unit: account.unit,
        classCode: account.classCode,
        active: !account.active,
      });
      await reloadManagerData();
      notify(account.active ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
    } catch (error) {
      notify(error.response?.data?.message || "Không thể cập nhật trạng thái");
    }
  }

  async function resetAccountPassword(account) {
    const confirmed = window.confirm(
      `Đặt lại mật khẩu mặc định cho tài khoản ${account.email}?`,
    );
    if (!confirmed) return;

    try {
      await resetManagerAccountPassword(account.id);
      notify("Đã đặt lại mật khẩu mặc định");
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
        faculty: data.faculty,
        gender: data.gender,
        birthDay: data.birthDay ? data.birthDay.slice(0, 10) : "",
        firstName: data.firstName,
        lastName: data.lastName,
        studentName: data.studentName,
        isInClass: data.isInClass,
        birthPlace: data.birthPlace,
        classRoleId: data.classRoleId,
        studyProgramId: data.studyProgramId,
        permanentResidence: data.permanentResidence,
        hometownCountry: data.hometownCountry,
        hometownProvince: data.hometownProvince,
        hometownCity: data.hometownCity,
        hometownAddress: data.hometownAddress,
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
      pendingStudentCount: accountRows.length - accounts.length,
      studentCount: students.length,
      classCount: classes.length,
    }),
    [accounts.length, accountRows.length, students.length, classes.length],
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
          <b>
            {managerTitleCount.accountCount} tài khoản ·{" "}
            {managerTitleCount.pendingStudentCount} SV chưa cấp
          </b>
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
            if (payload.data?.roleCode === "STUDENT") {
              const student = students.find(
                (item) => item.id === payload.data.studentId,
              );
              if (student) {
                openModal({ type: "student", data: student });
              }
              return;
            }
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
