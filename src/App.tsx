// src/App.tsx — routes.
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import RequirePermission from "./components/RequirePermission";
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
import Houses from "./pages/Houses";
import HouseForm from "./pages/HouseForm";
import HouseDetail from "./pages/HouseDetail";
import DisabledPersons from "./pages/DisabledPersons";
import DisabledPersonForm from "./pages/DisabledPersonForm";
import DisabledPersonDetail from "./pages/DisabledPersonDetail";
import Deaths from "./pages/Deaths";
import DeathForm from "./pages/DeathForm";
import DeathDetail from "./pages/DeathDetail";
import Births from "./pages/Births";
import BirthForm from "./pages/BirthForm";
import BirthDetail from "./pages/BirthDetail";
import Marriages from "./pages/Marriages";
import MarriageForm from "./pages/MarriageForm";
import MarriageDetail from "./pages/MarriageDetail";
import Tenants from "./pages/Tenants";
import TenantForm from "./pages/TenantForm";
import TenantDetail from "./pages/TenantDetail";
import PersonMovements from "./pages/PersonMovements";
import PersonMovementForm from "./pages/PersonMovementForm";
import PersonMovementDetail from "./pages/PersonMovementDetail";
import Projects from "./pages/Projects";
import ProjectForm from "./pages/ProjectForm";
import ProjectDetail from "./pages/ProjectDetail";
import Schools from "./pages/Schools";
import SchoolForm from "./pages/SchoolForm";
import SchoolDetail from "./pages/SchoolDetail";
import Villages from "./pages/Villages";
import TribesClans from "./pages/TribesClans";
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

                    {/* Residents — gated by 'residents' read permission */}
                    <Route path="/residents" element={
                      <RequirePermission resource="residents">
                        <Residents />
                      </RequirePermission>
                    } />
                    <Route path="/residents/new" element={
                      <RequirePermission resource="residents">
                        <ResidentForm />
                      </RequirePermission>
                    } />
                    <Route path="/residents/:id" element={
                      <RequirePermission resource="residents">
                        <ResidentDetail />
                      </RequirePermission>
                    } />
                    <Route path="/residents/:id/edit" element={
                      <RequirePermission resource="residents">
                        <ResidentForm />
                      </RequirePermission>
                    } />

                    {/* Ward Officials — gated by 'ward_officials' read permission */}
                    <Route path="/ward-officials" element={
                      <RequirePermission resource="ward_officials">
                        <WardOfficials />
                      </RequirePermission>
                    } />
                    <Route path="/ward-officials/new" element={
                      <RequirePermission resource="ward_officials">
                        <WardOfficialForm />
                      </RequirePermission>
                    } />
                    <Route path="/ward-officials/:id" element={
                      <RequirePermission resource="ward_officials">
                        <WardOfficialDetail />
                      </RequirePermission>
                    } />
                    <Route path="/ward-officials/:id/edit" element={
                      <RequirePermission resource="ward_officials">
                        <WardOfficialForm />
                      </RequirePermission>
                    } />

                    {/* Houses — gated by 'houses' read permission */}
                    <Route path="/houses" element={
                      <RequirePermission resource="houses">
                        <Houses />
                      </RequirePermission>
                    } />
                    <Route path="/houses/new" element={
                      <RequirePermission resource="houses">
                        <HouseForm />
                      </RequirePermission>
                    } />
                    <Route path="/houses/:id" element={
                      <RequirePermission resource="houses">
                        <HouseDetail />
                      </RequirePermission>
                    } />
                    <Route path="/houses/:id/edit" element={
                      <RequirePermission resource="houses">
                        <HouseForm />
                      </RequirePermission>
                    } />

                    {/* Disabled Persons */}
                    <Route path="/disabled-persons" element={
                      <RequirePermission resource="disabled_persons">
                        <DisabledPersons />
                      </RequirePermission>
                    } />
                    <Route path="/disabled-persons/new" element={
                      <RequirePermission resource="disabled_persons">
                        <DisabledPersonForm />
                      </RequirePermission>
                    } />
                    <Route path="/disabled-persons/:id" element={
                      <RequirePermission resource="disabled_persons">
                        <DisabledPersonDetail />
                      </RequirePermission>
                    } />
                    <Route path="/disabled-persons/:id/edit" element={
                      <RequirePermission resource="disabled_persons">
                        <DisabledPersonForm />
                      </RequirePermission>
                    } />

                    {/* Deaths */}
                    <Route path="/deaths" element={
                      <RequirePermission resource="deaths">
                        <Deaths />
                      </RequirePermission>
                    } />
                    <Route path="/deaths/new" element={
                      <RequirePermission resource="deaths">
                        <DeathForm />
                      </RequirePermission>
                    } />
                    <Route path="/deaths/:id" element={
                      <RequirePermission resource="deaths">
                        <DeathDetail />
                      </RequirePermission>
                    } />
                    <Route path="/deaths/:id/edit" element={
                      <RequirePermission resource="deaths">
                        <DeathForm />
                      </RequirePermission>
                    } />

                    {/* Births */}
                    <Route path="/births" element={
                      <RequirePermission resource="births">
                        <Births />
                      </RequirePermission>
                    } />
                    <Route path="/births/new" element={
                      <RequirePermission resource="births">
                        <BirthForm />
                      </RequirePermission>
                    } />
                    <Route path="/births/:id" element={
                      <RequirePermission resource="births">
                        <BirthDetail />
                      </RequirePermission>
                    } />
                    <Route path="/births/:id/edit" element={
                      <RequirePermission resource="births">
                        <BirthForm />
                      </RequirePermission>
                    } />

                    {/* Marriages */}
                    <Route path="/marriages" element={
                      <RequirePermission resource="marriages">
                        <Marriages />
                      </RequirePermission>
                    } />
                    <Route path="/marriages/new" element={
                      <RequirePermission resource="marriages">
                        <MarriageForm />
                      </RequirePermission>
                    } />
                    <Route path="/marriages/:id" element={
                      <RequirePermission resource="marriages">
                        <MarriageDetail />
                      </RequirePermission>
                    } />
                    <Route path="/marriages/:id/edit" element={
                      <RequirePermission resource="marriages">
                        <MarriageForm />
                      </RequirePermission>
                    } />

                    {/* Tenants */}
                    <Route path="/tenants" element={
                      <RequirePermission resource="tenants">
                        <Tenants />
                      </RequirePermission>
                    } />
                    <Route path="/tenants/new" element={
                      <RequirePermission resource="tenants">
                        <TenantForm />
                      </RequirePermission>
                    } />
                    <Route path="/tenants/:id" element={
                      <RequirePermission resource="tenants">
                        <TenantDetail />
                      </RequirePermission>
                    } />
                    <Route path="/tenants/:id/edit" element={
                      <RequirePermission resource="tenants">
                        <TenantForm />
                      </RequirePermission>
                    } />

                    {/* People Movement */}
                    <Route path="/people-movement" element={
                      <RequirePermission resource="people_movement">
                        <PersonMovements />
                      </RequirePermission>
                    } />
                    <Route path="/people-movement/new" element={
                      <RequirePermission resource="people_movement">
                        <PersonMovementForm />
                      </RequirePermission>
                    } />
                    <Route path="/people-movement/:id" element={
                      <RequirePermission resource="people_movement">
                        <PersonMovementDetail />
                      </RequirePermission>
                    } />
                    <Route path="/people-movement/:id/edit" element={
                      <RequirePermission resource="people_movement">
                        <PersonMovementForm />
                      </RequirePermission>
                    } />

                    {/* Community Projects */}
                    <Route path="/projects" element={
                      <RequirePermission resource="projects">
                        <Projects />
                      </RequirePermission>
                    } />
                    <Route path="/projects/new" element={
                      <RequirePermission resource="projects">
                        <ProjectForm />
                      </RequirePermission>
                    } />
                    <Route path="/projects/:id" element={
                      <RequirePermission resource="projects">
                        <ProjectDetail />
                      </RequirePermission>
                    } />
                    <Route path="/projects/:id/edit" element={
                      <RequirePermission resource="projects">
                        <ProjectForm />
                      </RequirePermission>
                    } />

                    {/* Schools & Education */}
                    <Route path="/schools" element={
                      <RequirePermission resource="schools">
                        <Schools />
                      </RequirePermission>
                    } />
                    <Route path="/schools/new" element={
                      <RequirePermission resource="schools">
                        <SchoolForm />
                      </RequirePermission>
                    } />
                    <Route path="/schools/:id" element={
                      <RequirePermission resource="schools">
                        <SchoolDetail />
                      </RequirePermission>
                    } />
                    <Route path="/schools/:id/edit" element={
                      <RequirePermission resource="schools">
                        <SchoolForm />
                      </RequirePermission>
                    } />

                    {/* Land registry — admin-managed master lists.
                        villages & tribes/clans are not per-user permission
                        resources; RequirePermission admits only admins here
                        (officials have no perm row for these keys). */}
                    <Route path="/villages" element={
                      <RequirePermission resource="villages">
                        <Villages />
                      </RequirePermission>
                    } />
                    <Route path="/tribes-clans" element={
                      <RequirePermission resource="villages">
                        <TribesClans />
                      </RequirePermission>
                    } />

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
