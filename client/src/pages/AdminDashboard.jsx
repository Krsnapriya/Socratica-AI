import { useState, useEffect, Suspense, lazy } from 'react';
import {
  fetchAdminUsers, fetchAdminStats, updateAdminUserRole, fetchAdminLogs,
  createAdminUser, deleteAdminUser,
  fetchAdminCourses, createCourse, updateCourse, deleteCourse,
  fetchAdminProblems, createProblem, updateProblem, deleteProblem,
  fetchPermissions, createPermission, updatePermission, deletePermission,
  fetchSystemConfig, updateSystemConfig,
  fetchSecurityOverview, fetchFailedLogins, forceLogoutUser,
  fetchAdminNotifications, createNotification, deleteNotification,
  fetchAdminReferenceSolutions, createAdminReferenceSolution, updateAdminReferenceSolution, deleteAdminReferenceSolution,
} from '../api/api.js';
import Icon from '../components/ui/Icon.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { ADMIN_TABS } from '../navigation';
import { SOLUTION_VARIANTS } from '../constants';
import { AdminErrorBoundary } from './admin/index.js';

const DashboardTab = lazy(() => import('./admin/DashboardTab.jsx'));
const UsersTab = lazy(() => import('./admin/UsersTab.jsx'));
const CoursesTab = lazy(() => import('./admin/CoursesTab.jsx'));
const ProblemsTab = lazy(() => import('./admin/ProblemsTab.jsx'));
const CompilerTab = lazy(() => import('./admin/CompilerTab.jsx'));
const AITab = lazy(() => import('./admin/AITab.jsx'));
const AuditTab = lazy(() => import('./admin/AuditTab.jsx'));
const SecurityTab = lazy(() => import('./admin/SecurityTab.jsx'));
const SettingsTab = lazy(() => import('./admin/SettingsTab.jsx'));
const NotificationsTab = lazy(() => import('./admin/NotificationsTab.jsx'));
const PermissionsTab = lazy(() => import('./admin/PermissionsTab.jsx'));

function TabSkeleton() {
  return <div className="space-y-4 p-4"><div className="h-8 bg-surface-container-low rounded w-1/3 animate-pulse" /><div className="h-40 bg-surface-container-low rounded animate-pulse" /></div>;
}

export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');

  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);

  const [problems, setProblems] = useState([]);
  const [editingProblem, setEditingProblem] = useState(null);

  const [permissions, setPermissions] = useState([]);
  const [editingPerm, setEditingPerm] = useState(null);

  const [config, setConfig] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);

  const [secOverview, setSecOverview] = useState(null);
  const [failedLogins, setFailedLogins] = useState([]);

  const [notifs, setNotifs] = useState([]);
  const [showNewNotif, setShowNewNotif] = useState(false);
  const [newNotif, setNewNotif] = useState({ type: 'broadcast', title: '', message: '', audience: 'all', link: '' });

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [logFilter, setLogFilter] = useState({ type: 'all', action: '', days: 7 });

  const [refSolutions, setRefSolutions] = useState([]);
  const [editingRefSol, setEditingRefSol] = useState(null);
  const [showRefSolPanel, setShowRefSolPanel] = useState(false);

  function loadDashboard() {
    setLoading(true);
    Promise.all([fetchAdminStats(), fetchAdminLogs(1)])
      .then(([sData, lData]) => { setStats(sData); setRecentLogs(lData?.logs || []); })
      .catch(() => addToast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
  }

  function loadUsers() {
    setLoading(true);
    fetchAdminUsers(userPage, userSearch)
      .then(d => { setUsers(d.users || []); setUserTotalPages(d.pages || 1); })
      .catch(() => addToast('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  }

  function loadCourses() {
    setLoading(true);
    fetchAdminCourses().then(setCourses).catch(() => addToast('Failed to load courses', 'error')).finally(() => setLoading(false));
  }

  function loadProblems() {
    setLoading(true);
    fetchAdminProblems().then(setProblems).catch(() => addToast('Failed to load problems', 'error')).finally(() => setLoading(false));
  }

  function loadPermissions() {
    setLoading(true);
    fetchPermissions().then(d => setPermissions(d?.permissions || [])).catch(() => addToast('Failed to load permissions', 'error')).finally(() => setLoading(false));
  }

  function loadAuditLogs() {
    setLoading(true);
    fetchAdminLogs(auditPage, logFilter).then(d => {
      setAuditLogs(d?.logs || []);
      setAuditTotalPages(d.pages || 1);
    }).catch(() => addToast('Failed to load logs', 'error')).finally(() => setLoading(false));
  }

  function loadSecurity() {
    setLoading(true);
    Promise.all([fetchSecurityOverview(), fetchFailedLogins(1)])
      .then(([o, f]) => { setSecOverview(o); setFailedLogins(f.logs || []); })
      .catch(() => addToast('Failed to load security data', 'error'))
      .finally(() => setLoading(false));
  }

  function loadNotifs() {
    setLoading(true);
    fetchAdminNotifications(1).then(d => setNotifs(d?.notifications || [])).catch(() => addToast('Failed to load notifications', 'error')).finally(() => setLoading(false));
  }

  function loadConfig() {
    setLoading(true);
    fetchSystemConfig().then(setConfig).catch(() => addToast('Failed to load config', 'error')).finally(() => setLoading(false));
  }

  function loadRefSolutions() {
    fetchAdminReferenceSolutions().then(setRefSolutions).catch(() => addToast('Failed to load reference solutions', 'error'));
  }

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'users') loadUsers();
    if (tab === 'courses') loadCourses();
    if (tab === 'problems') { loadProblems(); loadRefSolutions(); }
    if (tab === 'compiler' || tab === 'ai') loadConfig();
    if (tab === 'audit') loadAuditLogs();
    if (tab === 'security') loadSecurity();
    if (tab === 'notifications') loadNotifs();
    if (tab === 'permissions') loadPermissions();
    if (tab === 'settings') loadConfig();
  }, [tab]);

  useEffect(() => { if (tab === 'users') loadUsers(); }, [userPage]);
  useEffect(() => { if (tab === 'audit') loadAuditLogs(); }, [auditPage]);

  async function handleRoleChange(userId, newRole) {
    try {
      const updatedUser = await updateAdminUserRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: updatedUser.role } : u));
      addToast('Role updated', 'success');
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleCreateUser(newUser, done) {
    try {
      await createAdminUser(newUser);
      done();
      addToast('User created', 'success');
      loadUsers();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleDeleteUser(id) {
    try { await deleteAdminUser(id); addToast('User deleted', 'success'); loadUsers(); }
    catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleSaveCourse(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      title: fd.get('title'), description: fd.get('description'),
      icon: fd.get('icon'), order: parseInt(fd.get('order')) || 0,
      instructorId: fd.get('instructorId') || undefined,
      isPublished: fd.get('isPublished') === 'on',
    };
    try {
      if (editingCourse._id) { await updateCourse(editingCourse._id, data); addToast('Course updated', 'success'); }
      else { await createCourse(data); addToast('Course created', 'success'); }
      setEditingCourse(null); loadCourses();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleDeleteCourse(id) {
    try { await deleteCourse(id); addToast('Course deleted', 'success'); loadCourses(); }
    catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleSaveProblem(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const parseJson = (raw, fallback) => { try { return JSON.parse(raw); } catch { return fallback; } };
    const data = {
      problemId: fd.get('problemId'), title: fd.get('title'), statement: fd.get('statement'),
      category: fd.get('category'), difficulty: fd.get('difficulty'),
      tags: fd.get('tags') ? fd.get('tags').split(',').map(t => t.trim()) : [],
      starterCode: { python: fd.get('python_starter') || '', javascript: fd.get('javascript_starter') || '', cpp: fd.get('cpp_starter') || '' },
      oracleSolutions: { python: fd.get('python_oracle') || '', javascript: fd.get('javascript_oracle') || '', cpp: fd.get('cpp_oracle') || '' },
      testCases: [{ input: parseJson(fd.get('test_input'), []), expected: parseJson(fd.get('test_expected'), []), visibility: 'public', weight: 1, categories: [] }],
      moduleId: fd.get('moduleId') || undefined,
      authorId: fd.get('authorId') || undefined,
    };
    try {
      if (editingProblem._id) { await updateProblem(editingProblem._id, data); addToast('Problem updated', 'success'); }
      else { await createProblem(data); addToast('Problem created', 'success'); }
      setEditingProblem(null); loadProblems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleDeleteProblem(id) {
    try { await deleteProblem(id); addToast('Problem deleted', 'success'); loadProblems(); }
    catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleSaveRefSol(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      problemId: fd.get('problemId'), language: fd.get('language'), code: fd.get('code'),
      variant: fd.get('variant') || SOLUTION_VARIANTS[0], notes: fd.get('notes') || '',
    };
    try {
      if (editingRefSol._id) { await updateAdminReferenceSolution(editingRefSol._id, data); addToast('Reference solution updated', 'success'); }
      else { await createAdminReferenceSolution(data); addToast('Reference solution created', 'success'); }
      setEditingRefSol(null); loadRefSolutions();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleDeleteRefSol(id) {
    try { await deleteAdminReferenceSolution(id); addToast('Reference solution deleted', 'success'); loadRefSolutions(); }
    catch (err) { addToast('Failed', 'error'); }
  }

  async function handleSaveConfig(key) {
    setSavingConfig(true);
    try { await updateSystemConfig(key, config[key]); addToast(`${key} config saved`, 'success'); }
    catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
    setSavingConfig(false);
  }

  async function handleSavePerm(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = { role: fd.get('role'), resource: fd.get('resource'), resourceId: fd.get('resourceId') || '*', actions: fd.get('actions').split(',').map(a => a.trim()) };
    try {
      if (editingPerm._id) { await updatePermission(editingPerm._id, data); addToast('Permission updated', 'success'); }
      else { await createPermission(data); addToast('Permission created', 'success'); }
      setEditingPerm(null); loadPermissions();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleDeletePerm(id) {
    try { await deletePermission(id); addToast('Permission deleted', 'success'); loadPermissions(); }
    catch (err) { addToast('Failed', 'error'); }
  }

  async function handleForceLogout(userId) {
    try { await forceLogoutUser(userId); addToast('User force logged out', 'success'); loadSecurity(); }
    catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleCreateNotif(e) {
    e.preventDefault();
    try {
      await createNotification(newNotif);
      setShowNewNotif(false);
      setNewNotif({ type: 'broadcast', title: '', message: '', audience: 'all', link: '' });
      addToast('Notification sent', 'success'); loadNotifs();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleDeleteNotif(id) {
    try { await deleteNotification(id); addToast('Notification deleted', 'success'); loadNotifs(); }
    catch (err) { addToast('Failed', 'error'); }
  }

  return (
    <AdminErrorBoundary>
      <div className="page-enter p-8 max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="font-sans text-3xl font-bold text-primary tracking-tight flex items-center gap-2 mb-4">
            <Icon name="admin_panel_settings" size={28} /> Admin Console
          </h1>
          <div className="flex gap-1 bg-surface-container-low border border-outline-variant rounded-lg p-1 w-fit flex-wrap" role="tablist">
            {ADMIN_TABS.map(t => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-mono text-xs font-medium transition-all ${tab === t.key ? 'bg-surface-container text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                <Icon name={t.icon} size={16} /> {t.label}
              </button>
            ))}
          </div>
        </header>

        <Suspense fallback={<TabSkeleton />}>
          {tab === 'dashboard' && <DashboardTab stats={stats} recentLogs={recentLogs} loading={loading} />}
          {tab === 'users' && <UsersTab users={users} userPage={userPage} userTotalPages={userTotalPages} userSearch={userSearch} setUserSearch={setUserSearch} setUserPage={setUserPage} onSearch={loadUsers} onAdd={handleCreateUser} onDelete={handleDeleteUser} onRoleChange={handleRoleChange} loading={loading} />}
          {tab === 'courses' && <CoursesTab courses={courses} editingCourse={editingCourse} setEditingCourse={setEditingCourse} onSave={handleSaveCourse} onDelete={handleDeleteCourse} loading={loading} />}
          {tab === 'problems' && <ProblemsTab problems={problems} editingProblem={editingProblem} setEditingProblem={setEditingProblem} refSolutions={refSolutions} editingRefSol={editingRefSol} setEditingRefSol={setEditingRefSol} showRefSolPanel={showRefSolPanel} setShowRefSolPanel={setShowRefSolPanel} onSaveProblem={handleSaveProblem} onDeleteProblem={handleDeleteProblem} onSaveRefSol={handleSaveRefSol} onDeleteRefSol={handleDeleteRefSol} loading={loading} />}
          {tab === 'compiler' && <CompilerTab config={config} setConfig={setConfig} onSave={handleSaveConfig} savingConfig={savingConfig} loading={loading} />}
          {tab === 'ai' && <AITab config={config} setConfig={setConfig} onSave={handleSaveConfig} savingConfig={savingConfig} loading={loading} userRole={user?.role} />}
          {tab === 'audit' && <AuditTab auditLogs={auditLogs} auditPage={auditPage} auditTotalPages={auditTotalPages} setAuditPage={setAuditPage} logFilter={logFilter} setLogFilter={setLogFilter} onFilter={loadAuditLogs} loading={loading} />}
          {tab === 'security' && <SecurityTab secOverview={secOverview} failedLogins={failedLogins} onForceLogout={handleForceLogout} loading={loading} />}
          {tab === 'settings' && <SettingsTab config={config} setConfig={setConfig} onSave={handleSaveConfig} savingConfig={savingConfig} loading={loading} />}
          {tab === 'notifications' && <NotificationsTab notifs={notifs} showNewNotif={showNewNotif} setShowNewNotif={setShowNewNotif} newNotif={newNotif} setNewNotif={setNewNotif} onCreate={handleCreateNotif} onDelete={handleDeleteNotif} loading={loading} />}
          {tab === 'permissions' && <PermissionsTab permissions={permissions} editingPerm={editingPerm} setEditingPerm={setEditingPerm} onSave={handleSavePerm} onDelete={handleDeletePerm} loading={loading} />}
        </Suspense>
      </div>
    </AdminErrorBoundary>
  );
}
