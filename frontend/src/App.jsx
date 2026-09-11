/**
 * App — root component with react-router-dom routing.
 *
 * Routes:
 *   /login   — LoginPage (public)
 *   /        — Dashboard (protected, officer role)
 *   /quiz    — QuizPage  (protected, officer role)
 *   /admin   — AdminDashboard (protected, admin role only)
 *
 * Protected routes redirect to /login when no auth context.
 * AppShell wraps protected routes with sidebar + header.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';

import antdTheme from './theme/antdTheme';
import { useAuth } from './context/AuthContext';

import AppShell from './components/AppShell';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuizPage from './pages/QuizPage';
import AdminDashboard from './pages/AdminDashboard';

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 */
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * AdminRoute — only allows admin-role users. Officers are redirected to /.
 */
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — wrapped in AppShell */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Route>

          {/* Catch-all → Dashboard or Login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
