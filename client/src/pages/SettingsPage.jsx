import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { fetchMe, updateProfile } from '../api/api.js';
import { LANGUAGES } from '../constants';

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
  return (
    <h2 className="font-sans text-xl font-semibold text-primary mb-5 flex items-center gap-2">
      <Icon name={icon} size={20} className="text-primary" />
      {title}
    </h2>
  );
}

function FormField({ label, children, id }) {
  return (
    <div>
      <label htmlFor={id} className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass = "bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 w-full text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

function Toggle({ on, label, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <button
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`relative w-10 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
          ${on ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
        aria-label={label}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'left-[calc(100%-20px-2px)]' : 'left-0.5'}`} />
      </button>
      <span className="text-sm text-on-surface-variant">{label}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user: ctxUser } = useOutletContext() || {};

  // Form state
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

  // Fetch real user data on mount
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
        // Fallback to context user
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
      setError(err.response?.data?.error || 'Failed to save settings. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setLoading(true);
    // Re-fetch to restore
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
      {/* ── Page Header ── */}
      <header className="border-b border-outline-variant pb-6">
        <h1 className="font-sans text-[40px] font-bold text-on-surface tracking-tight">Settings</h1>
        <p className="text-on-surface-variant text-base mt-1">Manage your Socratica AI environment and identity.</p>
      </header>

      {/* ── Success / Error Banner ── */}
      {saved && (
        <div className="bg-secondary/10 border border-secondary/40 rounded-lg px-4 py-3 text-secondary text-sm font-mono flex items-center gap-2" role="status">
          <Icon name="check_circle" size={16} />
          Configuration saved successfully.
        </div>
      )}
      {error && (
        <div className="bg-error/10 border border-error/40 rounded-lg px-4 py-3 text-error text-sm font-mono" role="alert">
          {error}
        </div>
      )}

      {/* ── User Identity ── */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-6" id="profile">
        <SectionHeader icon="person" title="User Identity" />
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
              <FormField label="Email Address" id="email-address">
                <input
                  id="email-address"
                  className={`${inputClass} opacity-60 cursor-not-allowed`}
                  type="email"
                  value={email}
                  disabled
                  title="Email cannot be changed"
                />
              </FormField>
              <FormField label="Bio" id="bio">
                <textarea
                  id="bio"
                  className={`${inputClass} resize-none`}
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell us about yourself…"
                />
              </FormField>
            </div>
          </div>
        )}
      </section>

      {/* ── IDE Preferences ── */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-6" id="ide">
        <SectionHeader icon="terminal" title="IDE Preferences" />
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
            <Toggle on={prefs.telemetry} label="Enable telemetry overlay (Ctrl+Shift+T)" onChange={v => setPrefs(p => ({ ...p, telemetry: v }))} />
            <Toggle on={prefs.strictMode} label="Strict mode — block resubmit on divergence" onChange={v => setPrefs(p => ({ ...p, strictMode: v }))} />
          </div>
        </div>
      </section>

      {/* ── Plan & Billing ── */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-6" id="billing">
        <SectionHeader icon="credit_card" title="Plan & Billing" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Free', price: '$0', features: ['100 traces / month', '1 workspace', 'Basic telemetry'], current: false },
            { label: 'Pro', price: '$29', features: ['Unlimited traces', '10 workspaces', 'Full telemetry + radar', 'Priority mentor hints'], current: true },
            { label: 'Enterprise', price: '$99', features: ['Everything in Pro', 'Self-hosted engine', 'Custom integrations', 'SSO / SAML'], current: false, dimmed: true },
          ].map(({ label, price, features, current, dimmed }) => (
            <div
              key={label}
              className={`bg-surface-container-lowest rounded-xl p-5 text-center relative ${current ? 'border-2 border-primary' : 'border border-outline-variant'} ${dimmed ? 'opacity-60' : ''}`}
            >
              {current && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-3 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase">
                  Current
                </span>
              )}
              <span className={`font-mono text-xs uppercase tracking-wider ${current ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
              <div className="font-sans text-4xl font-bold text-on-surface mt-2">{price}</div>
              <span className="font-mono text-xs text-on-surface-variant">/month</span>
              <ul className="mt-4 space-y-2 text-xs text-on-surface-variant text-left">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Icon name="check" size={14} className={current ? 'text-primary' : 'text-outline'} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Action Bar ── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
        <Button variant="secondary" onClick={handleDiscard} disabled={saving}>Discard Changes</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </span>
          ) : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
