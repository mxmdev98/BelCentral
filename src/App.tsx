// src/App.tsx — routes.
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Residents from "./pages/Residents";
import ResidentForm from "./pages/ResidentForm";
import ResidentDetail from "./pages/ResidentDetail";
import Reports from "./pages/Reports";
import WardOfficials from "./pages/WardOfficials";
import WardOfficialForm from "./pages/WardOfficialForm";
import WardOfficialDetail from "./pages/WardOfficialDetail";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* All other routes require auth + use the Layout shell */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/residents" element={<Residents />} />
                    <Route path="/residents/new" element={<ResidentForm />} />
                    <Route path="/residents/:id" element={<ResidentDetail />} />
                    <Route path="/residents/:id/edit" element={<ResidentForm />} />
                    <Route path="/ward-officials" element={<WardOfficials />} />
                    <Route path="/ward-officials/new" element={<WardOfficialForm />} />
                    <Route path="/ward-officials/:id" element={<WardOfficialDetail />} />
                    <Route path="/ward-officials/:id/edit" element={<WardOfficialForm />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
