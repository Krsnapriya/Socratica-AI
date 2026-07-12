import { NavLink, Link } from 'react-router-dom';
import Icon from './ui/Icon.jsx';

// Unified primary nav items
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/modules', label: 'Modules' },
  { to: '/workspace', label: 'Workspace' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/archive', label: 'Archive' },
];

function getNavItems(user) {
  const items = [...NAV_ITEMS];
  if (user?.role === 'admin' || user?.role === 'super_admin') {
    items.push({ to: '/admin', label: 'Admin Console' });
  }
  return items;
}

export default function TopNavBar({ user, onLogout, onMobileMenuToggle, mobileMenuOpen }) {
  return (
    <nav
      className="fixed top-0 w-full z-50 h-16 border-b border-outline-variant"
      style={{ background: 'var(--surface)' }}
      role="navigation"
      aria-label="Primary navigation"
    >
      <div className="flex justify-between items-center px-6 h-full max-w-[1440px] mx-auto">
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="font-sans text-xl font-bold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            style={{ color: 'var(--primary)' }}
            aria-label="Socratica AI — Home"
          >
            Socratica AI
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center h-full gap-1" role="list" aria-label="Desktop navigation">
            {getNavItems(user).map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                role="listitem"
                className={({ isActive }) =>
                  `relative h-16 px-3 flex items-center font-sans text-sm font-medium transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded
                  after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t after:transition-all
                  ${isActive
                    ? 'text-primary after:bg-primary'
                    : 'text-on-surface-variant hover:text-on-surface after:bg-transparent'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            {/* Trajectory quick link */}
            <NavLink
              to="/trajectory"
              className={({ isActive }) =>
                `h-8 px-3 flex items-center gap-1.5 rounded-md font-mono text-xs transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${isActive ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`
              }
              aria-label="View trajectory"
            >
              <Icon name="account_tree" size={14} />
              <span className="hidden lg:inline">Trajectory</span>
            </NavLink>

            <div className="w-px h-6 bg-outline-variant mx-1" aria-hidden="true" />

            {/* User email */}
            <span
              className="font-mono text-xs text-on-surface-variant hidden lg:block max-w-[160px] truncate"
              title={user?.email}
            >
              {user?.displayName || user?.email}
            </span>

            {/* Settings */}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `w-8 h-8 flex items-center justify-center rounded-md transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`
              }
              aria-label="Settings"
            >
              <Icon name="settings" size={20} />
            </NavLink>

            {/* Sign out */}
            <button
              onClick={onLogout}
              className="font-mono text-xs text-on-surface-variant hover:text-error transition-colors px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
              aria-label="Sign out"
            >
              Sign Out
            </button>
          </div>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full border border-outline-variant shrink-0 flex items-center justify-center font-mono text-xs font-bold"
            style={{ background: 'linear-gradient(135deg,var(--primary-container),var(--primary))', color: 'white' }}
            aria-hidden="true"
          >
            {(user?.displayName || user?.email || '?')[0].toUpperCase()}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={onMobileMenuToggle}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>
    </nav>
  );
}
