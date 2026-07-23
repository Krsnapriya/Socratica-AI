import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import MobileNav from './MobileNav';

export default function TopNavLayout({ user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-[9999] focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:font-mono focus:text-xs"
      >
        Skip to main content
      </a>

      <TopNavBar
        user={user}
        onLogout={onLogout}
        onMobileMenuToggle={() => setMobileMenuOpen(v => !v)}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* Mobile slide-down nav */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} onLogout={onLogout} user={user} />

      <div className="flex-1 flex flex-col">
        {/* Pass user + onLogout via outlet context so child layouts can use them */}
        <Outlet context={{ user, onLogout }} />
      </div>
    </div>
  );
}
