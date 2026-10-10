import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";
import { useCurrentUser } from "../../hooks/useAuth";

export default function Dashboard() {
  const role = useCurrentUser()?.role;

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
