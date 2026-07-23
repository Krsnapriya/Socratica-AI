import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../api/api.js';
import Icon from '../components/ui/Icon.jsx';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully! You can now sign in.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  async function handleResend() {
    setResending(true);
    setResendSuccess(false);
    try {
      await resendVerification();
      setResendSuccess(true);
    } catch (err) {
      setMessage(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" role="main">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary opacity-[0.04] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary opacity-[0.03] rounded-full blur-[120px]" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon name="school" size={24} className="text-primary" />
          </div>
          <h1 className="font-sans text-2xl font-bold text-on-surface">Socratica</h1>
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mt-1">AI-Powered Learning</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-8 shadow-[0_24px_48px_rgba(0,0,0,0.4)] text-center">
          {status === 'verifying' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="font-mono text-sm text-on-surface-variant">Verifying your email…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                <Icon name="check_circle" size={24} className="text-green-500" />
              </div>
              <h2 className="font-sans text-xl font-bold text-on-surface mb-2">Email Verified</h2>
              <p className="font-mono text-sm text-on-surface-variant mb-6">{message}</p>
              <Link
                to="/"
                className="inline-block bg-primary-container text-white font-mono text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-lg hover:bg-inverse-primary transition-all"
              >
                Sign In
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 bg-error/10 rounded-full flex items-center justify-center">
                <Icon name="error" size={24} className="text-error" />
              </div>
              <h2 className="font-sans text-xl font-bold text-on-surface mb-2">Verification Failed</h2>
              <p className="font-mono text-sm text-on-surface-variant mb-6">{message}</p>
              
              {resendSuccess ? (
                <div className="bg-green-500/10 border border-green-500/40 rounded-lg px-4 py-3 mb-4 text-green-500 text-sm font-mono">
                  Verification email sent! Check your inbox.
                </div>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full bg-surface-container border border-outline-variant text-on-surface font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-lg hover:bg-surface-container-high disabled:opacity-50 transition-all mb-3"
                >
                  {resending ? 'Sending…' : 'Resend Verification Email'}
                </button>
              )}
              
              <Link
                to="/"
                className="inline-block text-primary hover:underline font-mono text-sm"
              >
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
