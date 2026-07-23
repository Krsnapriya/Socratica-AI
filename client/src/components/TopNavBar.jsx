import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import Icon from './ui/Icon.jsx';
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from '../navigation';
import { ROLES } from '../constants';
import { fetchUnreadCount, markAllNotificationsRead } from '../api/api.js';

function getNavItems(user) {
  const items = [...NAV_ITEMS];
  if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) {
    items.push(...ADMIN_NAV_ITEMS);
  }
  return items;
}

export default function TopNavBar({ user, onLogout, onMobileMenuToggle, mobileMenuOpen }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchUnreadCount().then(d => { if (!cancelled) setUnreadCount(d.count || 0); }).catch(() => {});
    const interval = setInterval(() => {
      fetchUnreadCount().then(d => { if (!cancelled) setUnreadCount(d.count || 0); }).catch(() => {});
    }, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setShowNotifications(false);
    } catch {}
  };
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
            to="/dashboard"
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

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-8 h-8 flex items-center justify-center rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Icon name="notifications" size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-surface-container-low border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-outline-variant flex justify-between items-center">
                    <span className="font-sans text-sm font-semibold text-on-surface">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="font-mono text-[10px] text-primary hover:text-primary/80 transition-colors">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-4 text-center">
                      <Icon name="notifications_none" size={24} className="text-outline mx-auto mb-1" />
                      <p className="font-mono text-[10px] text-on-surface-variant">No notifications yet</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
