import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

export default function Dashboard() {
  const role = sessionStorage.getItem("renluyen-role") || "student";

  return (
    <section className="dashboard-page" aria-label="Bảng điều khiển">
      {role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
    </section>
  );
}
