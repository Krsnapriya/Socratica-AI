import { NavLink, useNavigate } from 'react-router-dom';
import Icon from './ui/Icon';
import Button from './ui/Button';

const NAV_ITEMS = [
  { to: '/', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/modules', icon: 'view_module', label: 'Modules' },
  { to: '/workspace', icon: 'code', label: 'Workspace' },
  { to: '/analytics', icon: 'insights', label: 'Analytics' },
  { to: '/archive', icon: 'archive', label: 'Archive' },
];

export default function SideNavBar({ user }) {
  const navigate = useNavigate();
  const displayName = user?.displayName || user?.email || 'User';
  const initial = displayName[0].toUpperCase();

  return (
    <aside
      className="hidden md:flex h-[calc(100vh-4rem)] w-64 flex-col border-r sticky top-16 shrink-0"
      style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}
    >
      {/* User identity header */}
      <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: 'var(--outline-variant)' }}>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg,var(--primary-container),var(--primary))', color: 'white' }}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <div className="font-sans text-sm font-semibold text-on-surface truncate">{displayName}</div>
          <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider truncate">
            {user?.email}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col py-3 px-2 gap-0.5 flex-1 overflow-y-auto scrollbar-thin" aria-label="Sidebar navigation">
        {NAV_ITEMS.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon name={icon} size={20} />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="my-2 border-t" style={{ borderColor: 'var(--outline-variant)' }} aria-hidden="true" />

        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon name="admin_panel_settings" size={20} />
            <span>Admin Console</span>
          </NavLink>
        )}

        <NavLink
          to="/trajectory"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Icon name="account_tree" size={20} />
          <span>Trajectory</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Icon name="settings" size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* CTA */}
      <div className="mt-auto p-4 border-t shrink-0" style={{ borderColor: 'var(--outline-variant)' }}>
        <Button variant="primary" className="w-full font-bold" onClick={() => navigate('/workspace')}>
          <Icon name="play_arrow" size={18} />
          Start Coding
        </Button>
      </div>
    </aside>
  );
}
