import { useEffect, useState, useRef, useMemo } from 'react';
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

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

const fieldClass = "w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 pr-10 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function GoogleSignInButton({ onSuccess, onError }) {
  const btnRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In unavailable');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      try {
        if (window.google?.accounts?.id && btnRef.current) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              try {
                await onSuccess(response.credential);
              } catch (err) {
                onError(err?.message || 'Google sign-in failed');
              }
            }
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
      } catch (err) {
        console.error("Google Sign-In initialization error:", err);
      }
    };
    script.onerror = () => setError('Failed to load Google Sign-In');
    document.head.appendChild(script);
    return () => { 
      try { document.head.removeChild(script); } catch (e) {} 
    };
  }, [onSuccess, onError]);

  if (error) {
    return (
      <div className="bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-center opacity-60">
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

function PasswordStrength({ password }) {
  const strength = useMemo(() => {
    if (!password || typeof password !== 'string') return { score: 0, label: '', color: '' };
    try {
      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-error' };
      if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-tertiary' };
      if (score <= 3) return { score: 3, label: 'Good', color: 'bg-secondary' };
      if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-secondary' };
      return { score: 5, label: 'Very Strong', color: 'bg-secondary' };
    } catch (e) {
      return { score: 0, label: '', color: '' };
    }
  }, [password]);

  if (!password || typeof password !== 'string') return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength.score ? strength.color : 'bg-surface-container-highest'}`} />
        ))}
      </div>
      <p className={`font-mono text-[10px] ${strength.score <= 1 ? 'text-error' : strength.score <= 2 ? 'text-tertiary' : 'text-secondary'}`}>
        {strength.label}
      </p>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, placeholder, autoComplete, required, autoFocus, showStrength }) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={fieldClass}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors focus-visible:outline-none"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {showStrength && <PasswordStrength password={value} />}
    </div>
  );
}

function EmailField({ id, value, onChange, autoFocus, autoComplete }) {
  const [touched, setTouched] = useState(false);
  const isValid = !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  return (
    <div>
      <label htmlFor={id} className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">
        Email
      </label>
      <input
        id={id}
        type="email"
        className={`${fieldClass} ${touched && !isValid ? 'ring-2 ring-error/50 border-error/50' : ''}`}
        placeholder="you@example.com"
        value={value}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        required
        autoFocus={autoFocus}
        autoComplete={autoComplete}
      />
      {touched && !isValid && (
        <p className="font-mono text-[10px] text-error mt-1">Please enter a valid email address</p>
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
  const [registered, setRegistered] = useState(false);

  useEffect(() => { fetchCsrfToken(); }, []);

  function validateForm() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (tab === 'register') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
      if (!/[A-Z]/.test(password)) {
        setError('Password must contain at least one uppercase letter');
        return false;
      }
      if (!/[0-9]/.test(password)) {
        setError('Password must contain at least one number');
        return false;
      }
    } else {
      if (!password) {
        setError('Please enter your password');
        return false;
      }
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const fn = tab === 'login' ? login : register;
      const data = await fn(email, password);
      if (tab === 'register' && !data.emailVerified) {
        setRegistered(true);
        setLoading(false);
        return;
      }
      localStorage.setItem('socratica-token', data.token);
      localStorage.setItem('socratica-email', data.email);
      const baseUser = { email: data.email, token: data.token, role: data.role, displayName: data.displayName, userId: data.userId, emailVerified: data.emailVerified };
      try {
        const me = await fetchMe();
        onAuth({ ...me, token: data.token });
      } catch {
        onAuth(baseUser);
      }
    } catch (err) {
      const msg = err.message || 'Something went wrong. Try again.';
      if (msg.includes('rate limit') || msg.includes('too many')) {
        setError('Too many attempts. Please wait a few minutes before trying again.');
      } else if (msg.includes('already exists') || msg.includes('already registered')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (msg.includes('Invalid credentials') || msg.includes('incorrect')) {
        setError('Invalid email or password. Please check and try again.');
      } else {
        setError(msg);
      }
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
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
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

  if (registered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" role="main">
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary opacity-[0.04] rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary opacity-[0.03] rounded-full blur-[120px]" />
        </div>
        <div className="relative w-full max-w-md">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-8 shadow-[0_24px_48px_rgba(0,0,0,0.4)] text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-secondary/10 rounded-full flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h1 className="font-sans text-xl font-bold text-on-surface mb-2">Check Your Email</h1>
            <p className="font-mono text-sm text-on-surface-variant mb-2">
              We sent a verification link to
            </p>
            <p className="font-mono text-sm text-on-surface font-semibold mb-4">{email}</p>
            <p className="font-mono text-xs text-on-surface-variant mb-6">
              Click the link in the email to verify your account. You can close this tab.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { setRegistered(false); setTab('login'); setEmail(''); setPassword(''); }}
                className="w-full bg-primary-container text-white font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-lg transition-all duration-200 hover:bg-inverse-primary active:scale-[0.98]"
              >
                Back to Sign In
              </button>
              <button
                onClick={() => { setRegistered(false); setTab('register'); }}
                className="w-full font-mono text-xs text-on-surface-variant hover:text-primary transition-colors py-2"
              >
                Use a different email
              </button>
            </div>
          </div>
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
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 text-primary mb-3">
              <BrainIcon />
            </div>
            <h1 className="font-sans text-2xl font-bold text-on-surface tracking-tight">Socratica AI</h1>
            <p className="font-mono text-xs text-on-surface-variant mt-1 uppercase tracking-wider">AI-Powered Coding Platform</p>
          </div>

          {error && (
            <div
              className="bg-error/10 border border-error/40 rounded-lg px-4 py-3 mb-5 text-error text-sm font-mono"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {forgotMode ? (
            <form onSubmit={handleForgot} className="space-y-4" noValidate>
              <EmailField id="forgot-email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              {forgotSent ? (
                <div className="bg-secondary/10 border border-secondary/40 rounded-lg px-4 py-3 text-sm text-secondary font-mono text-center">
                  If the email exists, a reset link has been sent. Check your inbox.
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
                  onClick={() => { setForgotMode(false); setForgotSent(false); setError(''); }}
                  className="text-primary hover:underline focus-visible:outline-none"
                >
                  Back to sign in
                </button>
              </p>
            </form>
          ) : (
            <>
              <GoogleSignInButton
                onSuccess={handleGoogleSignIn}
                onError={(msg) => setError(msg)}
              />

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-outline-variant" />
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-outline-variant" />
              </div>

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

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <EmailField id="auth-email" value={email} onChange={e => setEmail(e.target.value)} autoFocus autoComplete="email" />

                <PasswordField
                  id="auth-password"
                  label="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={tab === 'register' ? 'Min 8 chars, 1 uppercase, 1 number' : 'Enter your password'}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  required
                  showStrength={tab === 'register'}
                />

                {tab === 'login' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-outline-variant" />
                      <span className="font-mono text-xs text-on-surface-variant">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {tab === 'register' && (
                  <p className="font-mono text-[10px] text-on-surface-variant leading-relaxed">
                    By creating an account you agree to our Terms of Service and Privacy Policy.
                  </p>
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

        <p className="text-center font-mono text-[10px] text-on-surface-variant/50 mt-6">
          AI-powered coding platform for deeper learning
        </p>
      </div>
    </div>
  );
}
