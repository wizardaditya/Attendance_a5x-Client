import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import CheckInPage from './pages/CheckInPage';

import EmployeeLayout from './layouts/EmployeeLayout';
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeTasks from './pages/employee/Tasks';
import EmployeeAttendance from './pages/employee/Attendance';
import EmployeeProfile from './pages/employee/Profile';

import FounderLayout from './layouts/FounderLayout';
import FounderOverview from './pages/founder/Overview';
import FounderTasks from './pages/founder/FounderTasks';
import FounderAttendance from './pages/founder/FounderAttendance';
import FounderEmployees from './pages/founder/FounderEmployees';

import AdminLayout from './layouts/AdminLayout';
import AdminHome from './pages/admin/Home';
import AdminAttendance from './pages/admin/Attendance';
import AdminTasks from './pages/admin/Tasks';
import AdminTeams from './pages/admin/Teams';
import AdminEmployees from './pages/admin/Employees';
import AdminQR from './pages/admin/QRManager';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminSettings from './pages/admin/Settings';

function Spinner() {
  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:'2px solid #39ff14', borderTopColor:'transparent', borderRadius:'50%' }} className="animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false, founderOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to={user.role === 'FOUNDER' ? '/founder' : '/employee'} replace />;
  if (founderOnly && user.role !== 'FOUNDER') return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/employee'} replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return (
    <Routes>
      <Route path="/login" element={
        user
          ? <Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'FOUNDER' ? '/founder' : '/employee'} replace />
          : <LoginPage />
      } />
      <Route path="/checkin" element={<CheckInPage />} />

      <Route path="/employee" element={<ProtectedRoute><EmployeeLayout /></ProtectedRoute>}>
        <Route index element={<EmployeeDashboard />} />
        <Route path="tasks" element={<EmployeeTasks />} />
        <Route path="attendance" element={<EmployeeAttendance />} />
        <Route path="profile" element={<EmployeeProfile />} />
      </Route>

      <Route path="/founder" element={<ProtectedRoute founderOnly><FounderLayout /></ProtectedRoute>}>
        <Route index element={<FounderOverview />} />
        <Route path="tasks" element={<FounderTasks />} />
        <Route path="attendance" element={<FounderAttendance />} />
        <Route path="employees" element={<FounderEmployees />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminHome />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="tasks" element={<AdminTasks />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="qr" element={<AdminQR />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="/" element={
        <Navigate to={user ? (user.role === 'ADMIN' ? '/admin' : user.role === 'FOUNDER' ? '/founder' : '/employee') : '/login'} replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111',
              color: '#fff',
              border: '1px solid #1f1f1f',
              borderRadius: '12px',
              fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            },
            success: { iconTheme: { primary: '#39ff14', secondary: '#000' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
