import { Outlet, NavLink, useOutletContext } from 'react-router-dom';
import Icon from './ui/Icon.jsx';

export default function SettingsLayout() {
  // Propagate context from TopNavLayout so SettingsPage can access user
  const context = useOutletContext() || {};

  return (
    <div className="flex flex-1 pt-16 h-screen overflow-hidden">
      <aside
        className="hidden md:flex w-60 flex-col py-6 px-3 gap-1 h-[calc(100vh-4rem)] sticky top-16 shrink-0 border-r"
        style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}
      >
        <div className="px-3 mb-4">
          <h2 className="font-sans text-xl font-semibold text-primary leading-8">Preferences</h2>
          <p className="font-mono text-xs text-on-surface-variant mt-1 uppercase tracking-wider">System Configuration</p>
        </div>
        <nav className="flex flex-col gap-0.5" aria-label="Settings sections">
          <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <Icon name="person" size={20} />
            <span>User Identity</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `sidebar-link`}>
            <Icon name="terminal" size={20} />
            <span>IDE Preferences</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `sidebar-link`}>
            <Icon name="credit_card" size={20} />
            <span>Plan &amp; Billing</span>
          </NavLink>
        </nav>
      </aside>
      <main
        className="flex-1 overflow-y-auto p-8"
        style={{ background: 'var(--background)' }}
        id="main-content"
      >
        <Outlet context={context} />
      </main>
    </div>
  );
}
