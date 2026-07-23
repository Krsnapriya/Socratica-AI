import { useEffect, useState, useRef } from 'react';
import { login, register, forgotPassword, fetchMe, googleLogin } from '../api/api.js';
import { fetchCsrfToken } from '../api/client.js';

function BrainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

const fieldClass = "w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function GoogleSignInButton({ onSuccess, onError }) {
  const btnRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              await onSuccess(response.credential);
            } catch (err) {
              onError(err.message || 'Google sign-in failed');
            }
          },
          error_callback: (err) => {
            onError(err.message || 'Google sign-in cancelled');
          },
        });
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular',
        });
        setLoaded(true);
      }
    };
    script.onerror = () => setError('Failed to load Google Sign-In');
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  if (error) {
    return (
      <div className="bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-center">
        <p className="font-mono text-xs text-on-surface-variant">{error}</p>
      </div>
    );
  }

  return (
    <div ref={btnRef} className="w-full min-h-[44px] flex items-center justify-center">
      {!loaded && (
        <div className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
          <span className="font-mono text-xs text-on-surface-variant">Loading Google...</span>
        </div>
      )}
    </div>
  );
}

export default function AuthPage({ onAuth }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => { fetchCsrfToken(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = tab === 'login' ? login : register;
      const data = await fn(email, password);
      localStorage.setItem('socratica-token', data.token);
      localStorage.setItem('socratica-email', data.email);
      // Use role from login response as primary, fetchMe as enhancement
      const baseUser = { email: data.email, token: data.token, role: data.role, displayName: data.displayName, userId: data.userId, emailVerified: data.emailVerified };
      try {
        const me = await fetchMe();
        onAuth({ ...me, token: data.token });
      } catch {
        onAuth(baseUser);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn(idToken) {
    setError('');
    setLoading(true);
    try {
      const data = await googleLogin(idToken);
      localStorage.setItem('socratica-token', data.token);
      localStorage.setItem('socratica-email', data.email);
      onAuth({ email: data.email, token: data.token, role: data.role, displayName: data.displayName, userId: data.userId, emailVerified: data.emailVerified });
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setForgotSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t) {
    setTab(t);
    setError('');
    setForgotMode(false);
    setForgotSent(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" role="main">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary opacity-[0.04] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary opacity-[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-8 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 text-primary mb-3">
              <BrainIcon />
            </div>
            <h1 className="font-sans text-2xl font-bold text-on-surface tracking-tight">Socratica AI</h1>
            <p className="font-mono text-xs text-on-surface-variant mt-1 uppercase tracking-wider">Differential Execution Judge</p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="bg-error/10 border border-error/40 rounded-lg px-4 py-3 mb-5 text-error text-sm font-mono"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {/* Forgot Password Form */}
          {forgotMode ? (
            <form onSubmit={handleForgot} className="space-y-4" noValidate>
              <div>
                <label htmlFor="forgot-email" className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className={fieldClass}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {forgotSent ? (
                <div className="bg-primary/10 border border-primary/40 rounded-lg px-4 py-3 text-sm text-primary font-mono text-center">
                  If the email exists, a reset link has been sent.
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-container text-white font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-lg transition-all duration-200
                    hover:bg-inverse-primary active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    shadow-[0_0_20px_rgba(79,70,229,0.35)]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              )}
              <p className="text-center font-mono text-xs text-on-surface-variant">
                <button
                  type="button"
                  onClick={() => { setForgotMode(false); setForgotSent(false); }}
                  className="text-primary hover:underline focus-visible:outline-none"
                >
                  Back to sign in
                </button>
              </p>
            </form>
          ) : (
            <>
              {/* Google Sign-In */}
              <GoogleSignInButton
                onSuccess={handleGoogleSignIn}
                onError={(msg) => setError(msg)}
              />

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-outline-variant" />
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-outline-variant" />
              </div>

              {/* Tabs */}
              <div className="flex bg-surface-container rounded-lg p-1 mb-5" role="tablist" aria-label="Authentication mode">
                {[
                  { key: 'login', label: 'Sign In' },
                  { key: 'register', label: 'Register' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={tab === key}
                    onClick={() => switchTab(key)}
                    className={`flex-1 py-2 rounded-md font-mono text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                      ${tab === key
                        ? 'bg-primary-container text-on-primary-container shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="auth-email" className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    className={fieldClass}
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label htmlFor="auth-password" className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    className={fieldClass}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
                {tab === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                <button
                  id="auth-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-container text-white font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-lg transition-all duration-200
                    hover:bg-inverse-primary active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    shadow-[0_0_20px_rgba(79,70,229,0.35)]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Please wait...
                    </span>
                  ) : tab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <p className="text-center font-mono text-xs text-on-surface-variant mt-6">
                {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
                  className="text-primary hover:underline focus-visible:outline-none"
                >
                  {tab === 'login' ? 'Register' : 'Sign in'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
