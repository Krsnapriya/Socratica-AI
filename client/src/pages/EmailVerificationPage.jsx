import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../api/api.js';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" role="main">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary opacity-[0.04] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary opacity-[0.03] rounded-full blur-[120px]" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-8 shadow-[0_24px_48px_rgba(0,0,0,0.4)] text-center">
          {status === 'verifying' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="font-mono text-sm text-on-surface-variant">Verifying your email…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl">✓</div>
              <h1 className="font-sans text-xl font-bold text-on-surface mb-2">Email Verified</h1>
              <p className="font-mono text-sm text-on-surface-variant mb-6">{message}</p>
              <Link
                to="/"
                className="inline-block bg-primary-container text-white font-mono text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-lg"
              >
                Sign In
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 bg-error/10 rounded-full flex items-center justify-center text-error text-2xl">✕</div>
              <h1 className="font-sans text-xl font-bold text-on-surface mb-2">Verification Failed</h1>
              <p className="font-mono text-sm text-on-surface-variant mb-6">{message}</p>
              <Link
                to="/"
                className="inline-block bg-primary-container text-white font-mono text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-lg"
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
