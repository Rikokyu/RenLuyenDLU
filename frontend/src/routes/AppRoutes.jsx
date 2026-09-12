import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import ActivityList from "../pages/activities/ActivityList";
import ActivityDetail from "../pages/activities/ActivityDetail";
import Evidence from "../pages/evidence/Evidence";
import EvidenceForStu from "../pages/evidence/EvidenceForStu";
import Reports from "../pages/reports/Reports";
import Profile from "../pages/profile/Profile";

function RequireAuth({ children }) {
  const authenticated =
    sessionStorage.getItem("renluyen-authenticated") === "true";

  return authenticated ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
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
        <Route path="/activities" element={<ActivityList />} />
        <Route path="/activities/:id" element={<ActivityDetail />} />
        <Route path="/evidence" element={<Evidence />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
