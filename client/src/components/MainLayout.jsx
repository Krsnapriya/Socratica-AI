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
      </main>
    </div>
  );
}
