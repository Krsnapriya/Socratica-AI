import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { fetchMe, updateProfile } from '../api/api.js';
import { LANGUAGES } from '../constants';

function SectionHeader({ icon, title, description }) {
  return (
    <div className="mb-5">
      <h2 className="font-sans text-xl font-semibold text-primary flex items-center gap-2">
        <Icon name={icon} size={20} className="text-primary" />
        {title}
      </h2>
      {description && <p className="font-mono text-[10px] text-on-surface-variant mt-1">{description}</p>}
    </div>
  );
}

function FormField({ label, children, id, description }) {
  return (
    <div>
      <label htmlFor={id} className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {description && <p className="font-mono text-[10px] text-outline mt-1">{description}</p>}
    </div>
  );
}

const inputClass = "bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 w-full text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

function Toggle({ on, label, onChange, description }) {
  return (
    <div className="flex items-start gap-3">
      <button
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`relative w-10 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background shrink-0 mt-0.5
          ${on ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
        aria-label={label}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'left-[calc(100%-20px-2px)]' : 'left-0.5'}`} />
      </button>
      <div>
        <span className="text-sm text-on-surface">{label}</span>
        {description && <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user: ctxUser, logout } = useOutletContext() || {};

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState({
    language: 'python',
    tabSize: '4 spaces',
    theme: 'Socratica Dark',
    fontSize: '14px',
    telemetry: true,
    strictMode: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const me = await fetchMe();
        setDisplayName(me.displayName || '');
        setBio(me.bio || '');
        setEmail(me.email || ctxUser?.email || '');
        if (me.preferences) {
          setPrefs(p => ({ ...p, ...me.preferences }));
        }
      } catch {
        setEmail(ctxUser?.email || '');
        setDisplayName(ctxUser?.displayName || '');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ctxUser]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile({ displayName, bio, preferences: prefs });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setLoading(true);
    fetchMe()
      .then((me) => {
        setDisplayName(me.displayName || '');
        setBio(me.bio || '');
        if (me.preferences) setPrefs(p => ({ ...p, ...me.preferences }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  const initial = (displayName || email || '?')[0].toUpperCase();

  return (
    <div className="page-enter max-w-4xl mx-auto space-y-8 pb-16">
      <header className="border-b border-outline-variant pb-6">
        <div className="flex items-center gap-2 text-on-surface-variant mb-2">
          <span className="font-mono text-xs uppercase tracking-wider">Dashboard</span>
          <Icon name="chevron_right" size={14} />
          <span className="font-mono text-xs uppercase tracking-wider text-on-surface">Settings</span>
        </div>
        <h1 className="font-sans text-[32px] md:text-[40px] font-bold text-on-surface tracking-tight">Settings</h1>
        <p className="text-on-surface-variant text-base mt-1">Manage your profile, preferences, and security.</p>
      </header>

      {saved && (
        <div className="bg-secondary/10 border border-secondary/40 rounded-lg px-4 py-3 text-secondary text-sm font-mono flex items-center gap-2" role="status">
          <Icon name="check_circle" size={16} />
          Settings saved successfully.
        </div>
      )}
      {error && (
        <div className="bg-error/10 border border-error/40 rounded-lg px-4 py-3 text-error text-sm font-mono" role="alert">
          {error}
        </div>
      )}

      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-6" id="profile">
        <SectionHeader icon="person" title="Profile" description="Your public identity on Socratica AI" />
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 w-20 rounded-full skeleton" />
            <div className="h-4 skeleton rounded w-1/2" />
            <div className="h-4 skeleton rounded w-3/4" />
          </div>
        ) : (
          <div className="flex gap-8 flex-col md:flex-row">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div
                className="w-20 h-20 rounded-full border border-outline-variant flex items-center justify-center font-sans text-3xl font-bold"
                style={{ background: 'linear-gradient(135deg,var(--primary-container),var(--primary))', color: 'white' }}
                aria-label="User avatar"
              >
                {initial}
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Avatar</span>
            </div>
            <div className="flex-1 space-y-4">
              <FormField label="Display Name" id="display-name">
                <input
                  id="display-name"
                  className={inputClass}
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </FormField>
              <FormField label="Email Address" id="email-address" description="Contact support to change your email">
                <input
                  id="email-address"
                  className={`${inputClass} opacity-60 cursor-not-allowed`}
                  type="email"
                  value={email}
                  disabled
                />
              </FormField>
              <FormField label="Bio" id="bio">
                <textarea
                  id="bio"
                  className={`${inputClass} resize-none`}
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              </FormField>
            </div>
          </div>
        )}
      </section>

      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-6" id="ide">
        <SectionHeader icon="terminal" title="IDE Preferences" description="Customize your coding environment" />
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Default Language" id="lang">
              <select id="lang" className={inputClass} value={prefs.language} onChange={e => setPrefs(p => ({ ...p, language: e.target.value }))}>
                {LANGUAGES.map(l => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Tab Size" id="tab-size">
              <select id="tab-size" className={inputClass} value={prefs.tabSize} onChange={e => setPrefs(p => ({ ...p, tabSize: e.target.value }))}>
                <option>2 spaces</option>
                <option>4 spaces</option>
                <option>8 spaces</option>
              </select>
            </FormField>
            <FormField label="Theme" id="theme">
              <select id="theme" className={inputClass} value={prefs.theme} onChange={e => setPrefs(p => ({ ...p, theme: e.target.value }))}>
                <option>Socratica Dark</option>
                <option>Monokai Pro</option>
                <option>One Dark Pro</option>
                <option>Catppuccin</option>
              </select>
            </FormField>
            <FormField label="Font Size" id="font-size">
              <select id="font-size" className={inputClass} value={prefs.fontSize} onChange={e => setPrefs(p => ({ ...p, fontSize: e.target.value }))}>
                <option>12px</option>
                <option>14px</option>
                <option>16px</option>
                <option>18px</option>
              </select>
            </FormField>
          </div>
          <div className="space-y-4 pt-4 border-t border-outline-variant/50">
            <Toggle 
              on={prefs.telemetry} 
              label="Enable telemetry overlay" 
              description="Show execution metrics in the workspace"
              onChange={v => setPrefs(p => ({ ...p, telemetry: v }))} 
            />
            <Toggle 
              on={prefs.strictMode} 
              label="Strict mode" 
              description="Block resubmission if your approach diverges significantly"
              onChange={v => setPrefs(p => ({ ...p, strictMode: v }))} 
            />
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-6" id="notifications">
        <SectionHeader icon="notifications" title="Notifications" description="Control what you get notified about" />
        <div className="space-y-4">
          <Toggle on={true} label="Email notifications" description="Receive email updates about your progress" onChange={() => {}} />
          <Toggle on={true} label="Weekly digest" description="Get a weekly summary of your activity" onChange={() => {}} />
          <Toggle on={false} label="Marketing emails" description="Receive updates about new features and courses" onChange={() => {}} />
        </div>
      </section>

      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-6" id="security">
        <SectionHeader icon="security" title="Security" description="Manage your account security" />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant/30">
            <div>
              <div className="font-sans text-sm font-semibold text-on-surface">Email</div>
              <div className="font-mono text-[10px] text-on-surface-variant mt-0.5">{email || 'Not set'}</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => alert('Contact support to change your email address.')}>
              Change Email
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant/30">
            <div>
              <div className="font-sans text-sm font-semibold text-on-surface">Password</div>
              <div className="font-mono text-[10px] text-on-surface-variant mt-0.5">Last changed: Unknown</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/reset-password')}>
              Change Password
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant/30">
            <div>
              <div className="font-sans text-sm font-semibold text-on-surface">Active Sessions</div>
              <div className="font-mono text-[10px] text-on-surface-variant mt-0.5">Manage devices where you're logged in</div>
            </div>
            <Button variant="secondary" size="sm">
              Manage Sessions
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-6" id="data">
        <SectionHeader icon="storage" title="Data & Privacy" description="Manage your data and account" />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant/30">
            <div>
              <div className="font-sans text-sm font-semibold text-on-surface">Export Data</div>
              <div className="font-mono text-[10px] text-on-surface-variant mt-0.5">Download all your submissions and analytics</div>
            </div>
            <Button variant="secondary" size="sm">
              <Icon name="download" size={14} />
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-error/5 rounded-lg border border-error/20">
            <div>
              <div className="font-sans text-sm font-semibold text-error">Delete Account</div>
              <div className="font-mono text-[10px] text-on-surface-variant mt-0.5">Permanently delete your account and all data</div>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <Icon name="delete" size={14} />
              Delete
            </Button>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
        <Button variant="secondary" onClick={handleDiscard} disabled={saving}>Discard Changes</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : 'Save Changes'}
        </Button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                <Icon name="warning" size={20} className="text-error" />
              </div>
              <h3 className="font-sans text-lg font-bold text-on-surface">Delete Account</h3>
            </div>
            <p className="text-on-surface-variant text-sm mb-6">
              This action is irreversible. All your data, submissions, and progress will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => {}}>
                <Icon name="delete" size={14} />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
