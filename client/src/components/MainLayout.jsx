import { Outlet, useOutletContext } from 'react-router-dom';
import SideNavBar from './SideNavBar';

export default function MainLayout() {
  const { user, onLogout } = useOutletContext() || {};

  return (
    <div className="flex pt-16 h-screen overflow-hidden">
      <SideNavBar user={user} />
      <main
        className="flex-1 overflow-y-auto p-6 md:p-8"
        style={{ background: 'var(--background)' }}
        id="main-content"
      >
        <Outlet context={{ user, onLogout }} />
        <footer className="mt-12 pt-6 border-t border-outline-variant/30 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="font-mono text-[10px] text-on-surface-variant">
              Socratica AI — AI-Powered Coding Platform
            </div>
            <div className="font-mono text-[10px] text-on-surface-variant">
              Built for Learning
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
