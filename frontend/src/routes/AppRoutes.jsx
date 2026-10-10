import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import ActivityList from "../pages/activities/ActivityList";
import ActivityDetail from "../pages/activities/ActivityDetail";
import Evidence from "../pages/evidence/Evidence";
import Reports from "../pages/reports/Reports";
import Profile from "../pages/profile/Profile";
import Manager from "../pages/manager/Manager";
import EvidenceForStu from "../pages/evidence/EvidenceForStu";
import { useCurrentUser } from "../hooks/useAuth";

const allRoles = [
  "ADMIN",
  "STUDENT_AFFAIRS_ASSISTANT",
  "HOMEROOM_CLASS_OFFICER",
  "STUDENT",
];
const reportRoles = allRoles.filter((role) => role !== "STUDENT");

function normalizeRole(role) {
  if (role === "HOMEROOM_TEACHER" || role === "CLASS_OFFICER") {
    return "HOMEROOM_CLASS_OFFICER";
  }
  return role;
}

function RequireAuth({ children }) {
  return useCurrentUser() ? children : <Navigate to="/login" replace />;
}

function RequireRole({ roles, children }) {
  const user = useCurrentUser();
  return roles.includes(normalizeRole(user?.role)) ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

export default function AppRoutes() {
  const role = useCurrentUser()?.role;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/activities"
          element={
            <RequireRole roles={allRoles}>
              <ActivityList />
            </RequireRole>
          }
        />
        <Route
          path="/activities/:id"
          element={
            <RequireRole roles={allRoles}>
              <ActivityDetail />
            </RequireRole>
          }
        />
        <Route
          path="/evidence"
          element={
            <RequireRole roles={allRoles}>
              {role === "STUDENT" ? <EvidenceForStu /> : <Evidence />}
            </RequireRole>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireRole roles={reportRoles}>
              <Reports />
            </RequireRole>
          }
        />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/manager"
          element={
            <RequireRole roles={["ADMIN", "STUDENT_AFFAIRS_ASSISTANT"]}>
              <Manager />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
