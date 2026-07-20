import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../api/api.js';

const fieldClass = "w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" role="main">
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-8 max-w-md text-center">
          <h1 className="font-sans text-xl font-bold text-on-surface mb-2">Invalid Reset Link</h1>
          <p className="font-mono text-sm text-on-surface-variant mb-6">No reset token provided.</p>
          <Link to="/" className="text-primary hover:underline font-mono text-sm">Back to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" role="main">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary opacity-[0.04] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary opacity-[0.03] rounded-full blur-[120px]" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-8 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl">✓</div>
              <h1 className="font-sans text-xl font-bold text-on-surface mb-2">Password Reset</h1>
              <p className="font-mono text-sm text-on-surface-variant mb-6">Your password has been reset successfully.</p>
              <Link
                to="/"
                className="inline-block bg-primary-container text-white font-mono text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-lg"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-sans text-xl font-bold text-on-surface mb-6 text-center">Reset Password</h1>
              {error && (
                <div className="bg-error/10 border border-error/40 rounded-lg px-4 py-3 mb-5 text-error text-sm font-mono" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="reset-password" className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">New Password</label>
                  <input id="reset-password" type="password" className={fieldClass} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
                </div>
                <div>
                  <label htmlFor="reset-confirm" className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <input id="reset-confirm" type="password" className={fieldClass} placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-primary-container text-white font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-lg hover:bg-inverse-primary disabled:opacity-50 transition-all">
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
