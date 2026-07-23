import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import AuthPage from './pages/AuthPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import EmailVerificationPage from './pages/EmailVerificationPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';

import TopNavLayout from './components/TopNavLayout.jsx';
import MainLayout from './components/MainLayout.jsx';
import SettingsLayout from './components/SettingsLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { PublicConfigProvider } from './contexts/PublicConfigContext.jsx';

import DashboardPage from './pages/DashboardPage.jsx';
import ModulesPage from './pages/ModulesPage.jsx';
import Workspace from './pages/Workspace.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import ArchivePage from './pages/ArchivePage.jsx';
import TrajectoryViewPage from './pages/TrajectoryViewPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PageErrorBoundary from './components/PageErrorBoundary.jsx';
import { fetchMe, logout } from './api/api.js';
import { clearTokens, fetchCsrfToken } from './api/client.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('socratica-token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(data => {
        setUser({ ...data, token });
      })
      .catch(() => {
        clearTokens();
        localStorage.removeItem('socratica-email');
      })
      .finally(() => setLoading(false));

    // Fetch CSRF token on load
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      handleLogout();
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  function handleAuth(userData) {
    setUser(userData);
  }

  function handleRoleSync(role) {
    setUser(prev => prev ? { ...prev, role } : prev);
  }

  async function handleLogout() {
    await logout().catch(() => {});
    localStorage.removeItem('socratica-email');
    clearTokens();
    setUser(null);
  }

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <PublicConfigProvider>
      <BrowserRouter>
      <Routes>
        {/* Public routes — no auth required */}
        <Route path="/landing" element={user ? <Navigate to="/" replace /> : <LandingPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Root: show landing for guests, dashboard for users */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />

        {/* Auth page */}
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage onAuth={handleAuth} />} />

        {/* All other routes require auth */}
        <Route element={user ? <TopNavLayout user={user} onLogout={handleLogout} /> : <AuthPage onAuth={handleAuth} />}>
          
          {/* Main layout with Curriculum side nav */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<PageErrorBoundary><DashboardPage /></PageErrorBoundary>} />
            <Route path="/modules" element={<PageErrorBoundary><ModulesPage /></PageErrorBoundary>} />
            <Route path="/courses" element={<PageErrorBoundary><ModulesPage /></PageErrorBoundary>} />
            <Route path="/analytics" element={<PageErrorBoundary><AnalyticsPage /></PageErrorBoundary>} />
            <Route path="/archive" element={<PageErrorBoundary><ArchivePage /></PageErrorBoundary>} />
            {/* Admin Dashboard */}
            <Route path="/admin" element={
              <ProtectedRoute user={user} allowedRoles={['admin', 'super_admin']} onRoleSynced={handleRoleSync}>
                <PageErrorBoundary><AdminDashboard user={user} /></PageErrorBoundary>
              </ProtectedRoute>
            } />
          </Route>

          {/* Settings layout with Settings side nav */}
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<PageErrorBoundary><SettingsPage /></PageErrorBoundary>} />
          </Route>

          {/* Standalone pages under TopNav */}
          <Route path="/workspace" element={<PageErrorBoundary><Workspace /></PageErrorBoundary>} />
          <Route path="/trajectory" element={<PageErrorBoundary><TrajectoryViewPage /></PageErrorBoundary>} />
          <Route path="/about" element={<PageErrorBoundary><AboutPage /></PageErrorBoundary>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </PublicConfigProvider>
  );
}
