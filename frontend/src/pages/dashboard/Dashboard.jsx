import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";
import { getCurrentUser } from "../../store/authStore";

export default function Dashboard() {
  const role = getCurrentUser()?.role;

  return (
    <section className="dashboard-page" aria-label="Bảng điều khiển">
      {role === "ADMIN" ||
      role === "STUDENT_AFFAIRS_ASSISTANT" ||
      role === "HOMEROOM_TEACHER" ||
      role === "CLASS_OFFICER" ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboard />
      )}
    </section>
  );
}
