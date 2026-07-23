import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../api/api.js';
import Icon from '../components/ui/Icon.jsx';

function PasswordStrength({ password }) {
  if (!password) return null;
  
  const checks = [
    { label: '12+ characters', met: password.length >= 12 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
  
  const metCount = checks.filter(c => c.met).length;
  const strength = metCount <= 2 ? 'weak' : metCount <= 4 ? 'medium' : 'strong';
  const strengthColors = { weak: 'text-red-500', medium: 'text-yellow-500', strong: 'text-green-500' };
  const strengthBg = { weak: 'bg-red-500', medium: 'bg-yellow-500', strong: 'bg-green-500' };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-300 ${strengthBg[strength]}`} style={{ width: `${(metCount / 5) * 100}%` }} />
        </div>
        <span className={`font-mono text-[10px] uppercase ${strengthColors[strength]}`}>{strength}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(check => (
          <div key={check.label} className="flex items-center gap-1.5">
            <Icon name={check.met ? 'check_circle' : 'radio_button_unchecked'} size={12} className={check.met ? 'text-green-500' : 'text-outline'} />
            <span className={`font-mono text-[10px] ${check.met ? 'text-on-surface' : 'text-on-surface-variant'}`}>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon name="school" size={24} className="text-primary" />
          </div>
          <h1 className="font-sans text-2xl font-bold text-on-surface">Socratica</h1>
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mt-1">AI-Powered Learning</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-8 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                <Icon name="check_circle" size={24} className="text-green-500" />
              </div>
              <h2 className="font-sans text-xl font-bold text-on-surface mb-2">Password Reset</h2>
              <p className="font-mono text-sm text-on-surface-variant mb-6">Your password has been reset successfully.</p>
              <Link
                to="/"
                className="inline-block bg-primary-container text-white font-mono text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-lg hover:bg-inverse-primary transition-all"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-sans text-xl font-bold text-on-surface mb-6 text-center">Reset Password</h2>
              {error && (
                <div className="bg-error/10 border border-error/40 rounded-lg px-4 py-3 mb-5 text-error text-sm font-mono" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="reset-password" className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">New Password</label>
                  <div className="relative">
                    <input 
                      id="reset-password" 
                      type={showPassword ? 'text' : 'password'} 
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 pr-10 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
                      placeholder="Enter new password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      autoFocus 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                    >
                      <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                  <div className="mt-2">
                    <PasswordStrength password={password} />
                  </div>
                </div>
                <div>
                  <label htmlFor="reset-confirm" className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <input 
                    id="reset-confirm" 
                    type={showPassword ? 'text' : 'password'} 
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
                    placeholder="Confirm new password" 
                    value={confirm} 
                    onChange={e => setConfirm(e.target.value)} 
                    required 
                  />
                  {confirm && password !== confirm && (
                    <p className="mt-1 font-mono text-[10px] text-error">Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={loading || !password || !confirm} className="w-full bg-primary-container text-white font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-lg hover:bg-inverse-primary disabled:opacity-50 transition-all">
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
