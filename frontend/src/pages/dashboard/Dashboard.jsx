import { useState } from "react";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

export default function Dashboard() {
  const [role, setRole] = useState("teacher");

  return (
    <section className="dashboard-page" aria-label="Bảng điều khiển">
      <div className="dashboard-role-switch">
        <span>Chế độ hiển thị</span>
        <button className={role === "teacher" ? "is-active" : ""} onClick={() => setRole("teacher")}>
          Giáo viên
        </button>
        <button className={role === "student" ? "is-active" : ""} onClick={() => setRole("student")}>
          Sinh viên
        </button>
      </div>

      {role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
    </section>
  );
}
