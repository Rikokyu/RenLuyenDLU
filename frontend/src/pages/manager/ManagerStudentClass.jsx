import { useMemo, useState } from "react";
import { formatDate } from "../../utils/formatDate";

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

function formatBirthDay(value) {
  return formatDate(value) || "Chưa cập nhật";
}

function classYear(code) {
  const match = String(code || "").match(/ITK(\d{2})/i);
  return match ? `Khóa ${match[1]}` : "Chưa cập nhật";
}

function classStats(students, code) {
  const rows = students.filter((student) => student.classCode === code);
  const programs = rows.reduce((result, student) => {
    const program = student.studyProgramId || "Chưa cập nhật";
    result[program] = (result[program] || 0) + 1;
    return result;
  }, {});
  return {
    male: rows.filter((student) => student.gender === "Nam").length,
    female: rows.filter((student) => student.gender === "Nữ").length,
    leader: rows.find((student) => student.classRoleId === 1),
    programs,
  };
}

function EmptyState({ onReset }) {
  return (
    <div className="manager-empty">
      <strong>Không tìm thấy dữ liệu phù hợp</strong>
      <button onClick={onReset}>Xóa bộ lọc</button>
    </div>
  );
}

export default function ManagerStudentClass({
  students,
  classes,
  onOpenModal,
  onDelete,
  onExport,
  onSync,
  isSyncing,
  dataError,
  onOpenClassModal,
  onOpenScores,
}) {
  const [tab, setTab] = useState("students");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("Tất cả lớp");
  const [facultyFilter, setFacultyFilter] = useState("Tất cả khoa");
  const classCodes = classes.map((item) => item.code);
  const faculties = [
    ...new Set(students.map((item) => item.facultyName).filter(Boolean)),
  ];
  const filteredStudents = useMemo(
    () =>
      students.filter((item) => {
        const text =
          `${item.name} ${item.mssv} ${item.phone} ${item.email} ${item.className} ${item.studyProgramId} ${item.birthPlace}`.toLowerCase();
        return (
          text.includes(search.toLowerCase()) &&
          (classFilter === "Tất cả lớp" || item.classCode === classFilter) &&
          (facultyFilter === "Tất cả khoa" || item.facultyName === facultyFilter)
        );
      }),
    [students, search, classFilter, facultyFilter],
  );

  return (
    <>
      <div className="manager-toolbar manager-toolbar--student">
        <div className="manager-subtabs">
          <button
            className={tab === "students" ? "is-active" : ""}
            onClick={() => setTab("students")}
          >
            <Icon name="profile" /> Thông Tin cá nhân Sinh Viên{" "}
            <b>{students.length}</b>
          </button>
          <button
            className={tab === "classes" ? "is-active" : ""}
            onClick={() => setTab("classes")}
          >
            <Icon name="manager" /> Quản Lý Lớp Sinh Hoạt{" "}
            <b>{classes.length}</b>
          </button>
        </div>
        <div className="manager-actions">
          <button
            className="manager-button manager-button--outline"
            onClick={onExport}
          >
            <Icon name="report" /> Xuất Excel
          </button>
          <button
            className="manager-button manager-button--outline"
            onClick={onSync}
            disabled={isSyncing}
          >
            <Icon name="change_pass" />{" "}
            {isSyncing ? "Đang tải..." : "Tải lại dữ liệu"}
          </button>
          <button
            className="manager-button manager-button--primary"
            onClick={() =>
              onOpenModal({
                type: tab === "classes" ? "class" : "student",
                data: null,
              })
            }
          >
            <Icon name={tab === "classes" ? "manager" : "profile"} />{" "}
            {tab === "classes"
              ? "Thêm Lớp Sinh Hoạt Mới"
              : "Thêm Sinh Viên Mới"}
          </button>
        </div>
      </div>
      {dataError && <div className="manager-data-error">{dataError}</div>}
      {tab === "students" ? (
        <>
          <div className="manager-filter manager-filter--students manager-filter--student-data">
            <label className="manager-search">
              <Icon name="list" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm mã số, họ tên, lớp, chương trình..."
              />
            </label>
            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
            >
              <option>Tất cả lớp</option>
              {classCodes.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
            <select
              value={facultyFilter}
              onChange={(event) => setFacultyFilter(event.target.value)}
            >
              <option>Tất cả khoa</option>
              {faculties.map((facultyName) => (
                <option key={facultyName}>{facultyName}</option>
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
                  <th>THÔNG TIN CÁ NHÂN</th>
                  <th>NƠI SINH</th>
                  <th>TRẠNG THÁI</th>
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
                          {(item.name || "?").charAt(0)}
                        </span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>
                            <em>{item.mssv}</em>
                          </small>
                          <small>{item.email || "Chưa cập nhật email"}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="manager-orange-text">
                        Lớp {item.className}
                      </strong>
                      <small>{item.facultyName || "Chưa cập nhật khoa"}</small>
                      <small>{item.studyProgramId || "Chưa cập nhật"}</small>
                    </td>
                    <td>
                      <strong>{item.phone || "Chưa cập nhật SĐT"}</strong>
                      <small>Giới tính: {item.gender || "Chưa cập nhật"}</small>
                      <small>Ngày sinh: {formatBirthDay(item.birthDay)}</small>
                    </td>
                    <td>
                      <strong>{item.birthPlace || "Chưa cập nhật"}</strong>
                    </td>
                    <td>
                      <span className="manager-student-status">
                        {item.isInClass ? "Đang học" : "Ngoài lớp"}
                      </span>
                      <strong>Sinh viên</strong>
                    </td>
                    <td>
                      <div className="manager-row-actions">
                        <button
                          onClick={() =>
                            onOpenModal({ type: "student", data: item })
                          }
                          aria-label="Sửa sinh viên"
                        >
                          <Icon name="custom" />
                        </button>
                        <button
                          onClick={() => onOpenScores(item.classCode)}
                          aria-label="Xem điểm rèn luyện"
                        >
                          <Icon name="report" />
                        </button>
                        <button
                          onClick={() => onDelete("student", item.id)}
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
              <EmptyState
                onReset={() => {
                  setSearch("");
                  setClassFilter("Tất cả lớp");
                }}
              />
            )}
          </div>
        </>
      ) : (
        <ClassGrid
          classes={classes}
          students={students}
          onOpenScores={onOpenScores}
          onOpenClassModal={onOpenClassModal}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

function ClassGrid({
  classes,
  students,
  onOpenScores,
  onOpenClassModal,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("Tất cả khoa");
  const [yearFilter, setYearFilter] = useState("Tất cả khóa");
  const years = [
    ...new Set(
      classes
        .map((item) => item.code.match(/ITK(\d{2})/i)?.[1])
        .filter(Boolean),
    ),
  ];
  const filteredClasses = classes.filter(
    (item) =>
      item.code.toLowerCase().includes(search.toLowerCase()) &&
      (facultyFilter === "Tất cả khoa" || item.faculty === facultyFilter) &&
      (yearFilter === "Tất cả khóa" ||
        item.code.toUpperCase().includes(`ITK${yearFilter}`)),
  );
  return (
    <>
      <div className="manager-filter manager-filter--class">
        <label className="manager-search">
          <Icon name="list" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã lớp..."
          />
        </label>
        <select
          value={facultyFilter}
          onChange={(event) => setFacultyFilter(event.target.value)}
        >
          <option>Tất cả khoa</option>
          {[
            ...new Set(classes.map((item) => item.faculty).filter(Boolean)),
          ].map((facultyName) => (
            <option key={facultyName}>{facultyName}</option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(event) => setYearFilter(event.target.value)}
        >
          <option>Tất cả khóa</option>
          {years.map((year) => (
            <option key={year}>{year}</option>
          ))}
        </select>
        <strong>Tổng số: {filteredClasses.length} lớp sinh hoạt</strong>
      </div>
      <div className="manager-class-grid">
        {filteredClasses.map((item) => {
          const stats = classStats(students, item.code);
          return (
            <article className="manager-class-card" key={item.code}>
              <header>
                <div>
                  <h2>Lớp {item.code}</h2>
                  <strong>{item.faculty || "Chưa cập nhật khoa"}</strong>
                  <small>{item.academicYear || classYear(item.code)}</small>
                </div>
                <b>
                  {item.studentCount}
                  <small>sĩ số SV</small>
                </b>
              </header>
              <dl>
                <dt>Lớp trưởng:</dt>
                <dd>
                  {stats.leader
                    ? `${stats.leader.name} (${stats.leader.mssv})`
                    : "Chưa cập nhật"}
                </dd>
                <dt>Nam / Nữ:</dt>
                <dd>
                  {stats.male} / {stats.female}
                </dd>
                <dt>Chương trình:</dt>
                <dd>
                  {Object.entries(stats.programs).map(([program, count]) => (
                    <span className="manager-class-stat" key={program}>
                      {program}: {count}
                    </span>
                  ))}
                </dd>
              </dl>
              <footer>
                <button onClick={() => onOpenScores(item.code)}>
                  <Icon name="report" /> Xem điểm rèn luyện
                </button>
                <button
                  onClick={() => onOpenClassModal(item)}
                  aria-label={`Sửa lớp ${item.code}`}
                >
                  <Icon name="custom" /> Sửa
                </button>
                <button
                  onClick={() => onDelete("class", item.code)}
                  aria-label={`Xóa lớp ${item.code}`}
                >
                  <Icon name="trash" /> Xóa
                </button>
              </footer>
            </article>
          );
        })}
      </div>
    </>
  );
}
