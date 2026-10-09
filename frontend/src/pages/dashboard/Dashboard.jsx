import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";
import { getCurrentUser } from "../../store/authStore";

export default function Dashboard() {
  const role = getCurrentUser()?.role;

  return (
    <section className="dashboard-page" aria-label="Bảng điều khiển">
      {role === "ADMIN" || role === "STUDENT_AFFAIRS_ASSISTANT" ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboard />
      )}
    </section>
  );
}
