import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import client from '../api/client';

export default function ProtectedRoute({ user, allowedRoles, children }) {
  const [verifiedRole, setVerifiedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function verifyRole() {
      try {
        const res = await client.get('/auth/me');
        if (!cancelled) {
          setVerifiedRole(res.data.role || 'student');
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }
    if (user) {
      setVerifiedRole(user.role || null);
      verifyRole();
    } else {
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [user]);

  if (error) return <Navigate to="/auth" replace />;
  if (!user) return <Navigate to="/" replace />;
  if (loading) return null;

  const effectiveRole = verifiedRole || user.role || 'student';

  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center" style={{ background: 'var(--background)' }}>
        <div className="bg-surface-container border border-error/50 rounded-xl p-8 max-w-md w-full shadow-lg">
          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">security</span>
          </div>
          <h2 className="font-sans text-xl font-bold text-on-surface mb-2">Access Denied</h2>
          <p className="text-on-surface-variant text-sm mb-6">
            You do not have the required permissions to access this page. This area requires {allowedRoles.join(' or ')} access.
          </p>
          <a href="/" className="inline-flex items-center justify-center px-4 py-2 font-mono text-sm font-bold rounded-lg transition-colors border text-white bg-primary border-primary hover:opacity-90">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
}
