import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Layout      from "./components/Layout.jsx";
import Login       from "./pages/Login.jsx";
import Overview    from "./pages/Overview.jsx";
import Users       from "./pages/Users.jsx";
import Classes     from "./pages/Classes.jsx";
import Enrollments from "./pages/Enrollments.jsx";
import Grades      from "./pages/Grades.jsx";
import Assignments from "./pages/Assignments.jsx";
import Analytics   from "./pages/Analytics.jsx";
import Settings    from "./pages/Settings.jsx";

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route index         element={<Overview />} />
            <Route path="users"       element={<Users />} />
            <Route path="classes"     element={<Classes />} />
            <Route path="enrollments" element={<Enrollments />} />
            <Route path="grades"      element={<Grades />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="analytics"   element={<Analytics />} />
            <Route path="settings"    element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
