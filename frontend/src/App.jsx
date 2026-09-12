/**
 * App — Root router component for STATKARMAYOG.
 *
 * Routes:
 *   /           — LandingPage (public landing view)
 *   /login      — LoginPage   (public authentication)
 *   /dashboard  — Dashboard   (protected officer dashboard)
 *   ...         — Protected feature pages wrapped in AppShell layout
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';

import antdTheme from './theme/antdTheme';
import { useAuth } from './context/AuthContext';

import AppShell from './components/AppShell';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyProfile from './pages/MyProfile';
import MyCompetencies from './pages/MyCompetencies';
import GapAnalysis from './pages/GapAnalysis';
import WorkEvidenceUpload from './pages/WorkEvidenceUpload';
import WorkArtifacts from './pages/WorkArtifacts';
import WorkArtifactDetail from './pages/WorkArtifactDetail';
import EvidenceHistory from './pages/EvidenceHistory';
import LearningPage from './pages/LearningPage';
import IgotPage from './pages/IgotPage';
import QuizPage from './pages/QuizPage';
import CompetencyPassportPage from './pages/CompetencyPassportPage';
import ProgressPage from './pages/ProgressPage';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes — Wrapped in AppShell layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/competencies" element={<MyCompetencies />} />
            <Route path="/gaps" element={<GapAnalysis />} />
            <Route path="/artifacts" element={<WorkArtifacts />} />
            <Route path="/artifacts/:artifactId" element={<WorkArtifactDetail />} />
            <Route path="/upload-artifact" element={<WorkEvidenceUpload />} />
            <Route path="/evidence-history" element={<EvidenceHistory />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/igot" element={<IgotPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/my-quizzes" element={<QuizPage />} />
            <Route path="/passport" element={<CompetencyPassportPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Route>

          {/* Fallback -> Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
