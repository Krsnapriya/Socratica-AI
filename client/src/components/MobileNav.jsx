import { NavLink } from 'react-router-dom';
import Icon from './ui/Icon.jsx';
import Button from './ui/Button.jsx';
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from '../navigation';

const NAV_LINKS = NAV_ITEMS.map(item => ({
  ...item,
  icon: item.icon || 'code',
  label: item.label,
  end: item.to === '/',
}));

const ADMIN_LINKS = ADMIN_NAV_ITEMS.map(item => ({
  ...item,
  icon: item.icon || 'admin_panel_settings',
  label: item.label,
  end: false,
}));

export default function MobileNav({ isOpen, onClose, onLogout, user }) {
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
  const links = isAdmin ? [...NAV_LINKS, ...ADMIN_LINKS] : NAV_LINKS;
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-down panel */}
      <div
        className={`fixed top-16 left-0 right-0 z-40 bg-surface-container-low border-b border-outline-variant md:hidden transition-all duration-200 origin-top
          ${isOpen ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-95 pointer-events-none'}`}
        role="navigation"
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
      >
        <nav className="flex flex-col py-2 px-3 gap-1">
          {links.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-xs font-medium transition-colors
                ${isActive
                  ? 'bg-primary-container/20 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                }`
              }
            >
              <Icon name={icon} size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="border-t border-outline-variant mt-2 pt-2">
            <Button variant="danger" className="w-full" onClick={onLogout}>
              <Icon name="logout" size={16} />
              Sign Out
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
