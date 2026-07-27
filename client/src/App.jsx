import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
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

// Lazy-load heavy pages so a broken page can't crash the whole app
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const ModulesPage = lazy(() => import('./pages/ModulesPage.jsx'));
const Workspace = lazy(() => import('./pages/Workspace.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const ArchivePage = lazy(() => import('./pages/ArchivePage.jsx'));
const TrajectoryViewPage = lazy(() => import('./pages/TrajectoryViewPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));

import PageErrorBoundary from './components/PageErrorBoundary.jsx';
import { fetchMe, logout } from './api/api.js';
import { clearTokens, fetchCsrfToken } from './api/client.js';

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
    </div>
  );
}

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
    let loggingOut = false;
    function handleUnauthorized() {
      if (loggingOut) return;
      loggingOut = true;
      handleLogout().finally(() => { loggingOut = false; });
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  function handleAuth(userData) {
    setUser(userData);
  }

  const handleRoleSync = useCallback((role) => {
    setUser(prev => prev ? { ...prev, role } : prev);
  }, []);

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
        <Route path="/landing" element={user ? <Navigate to="/" replace /> : <PageErrorBoundary><LandingPage /></PageErrorBoundary>} />
        <Route path="/verify-email" element={<PageErrorBoundary><EmailVerificationPage /></PageErrorBoundary>} />
        <Route path="/reset-password" element={<PageErrorBoundary><ResetPasswordPage /></PageErrorBoundary>} />

        {/* Root: show landing for guests, dashboard for users */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <PageErrorBoundary><LandingPage /></PageErrorBoundary>} />

        {/* Auth page */}
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <PageErrorBoundary><AuthPage onAuth={handleAuth} /></PageErrorBoundary>} />

        {/* All other routes require auth */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route element={<TopNavLayout user={user} onLogout={handleLogout} />}>
          
          {/* Main layout with Curriculum side nav */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<PageErrorBoundary><Suspense fallback={<PageLoader />}><DashboardPage /></Suspense></PageErrorBoundary>} />
            <Route path="/modules" element={<PageErrorBoundary><Suspense fallback={<PageLoader />}><ModulesPage /></Suspense></PageErrorBoundary>} />
            <Route path="/courses" element={<PageErrorBoundary><Suspense fallback={<PageLoader />}><ModulesPage /></Suspense></PageErrorBoundary>} />
            <Route path="/analytics" element={<PageErrorBoundary><Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense></PageErrorBoundary>} />
            <Route path="/archive" element={<PageErrorBoundary><Suspense fallback={<PageLoader />}><ArchivePage /></Suspense></PageErrorBoundary>} />
            {/* Admin Dashboard */}
            <Route path="/admin" element={
              <ProtectedRoute user={user} allowedRoles={['admin', 'super_admin']} onRoleSynced={handleRoleSync}>
                <PageErrorBoundary><Suspense fallback={<PageLoader />}><AdminDashboard user={user} /></Suspense></PageErrorBoundary>
              </ProtectedRoute>
            } />
          </Route>

          {/* Settings layout with Settings side nav */}
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<PageErrorBoundary><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></PageErrorBoundary>} />
          </Route>

          {/* Standalone pages under TopNav */}
          <Route path="/workspace" element={<PageErrorBoundary><Suspense fallback={<PageLoader />}><Workspace /></Suspense></PageErrorBoundary>} />
          <Route path="/trajectory" element={<PageErrorBoundary><Suspense fallback={<PageLoader />}><TrajectoryViewPage /></Suspense></PageErrorBoundary>} />
          <Route path="/about" element={<PageErrorBoundary><Suspense fallback={<PageLoader />}><AboutPage /></Suspense></PageErrorBoundary>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        </Route>
      </Routes>
      </BrowserRouter>
    </PublicConfigProvider>
  );
}
