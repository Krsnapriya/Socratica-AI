import { useState, useEffect } from 'react';
import {
  fetchAdminUsers, fetchAdminStats, updateAdminUserRole, fetchAdminLogs,
  createAdminUser, deleteAdminUser,
  fetchAdminCourses, createCourse, updateCourse, deleteCourse,
  fetchAdminProblems, createProblem, updateProblem, deleteProblem,
  fetchPermissions, createPermission, updatePermission, deletePermission,
  fetchSystemConfig, updateSystemConfig,
  fetchSecurityOverview, fetchFailedLogins, forceLogoutUser,
  fetchAdminNotifications, createNotification, deleteNotification,
} from '../api/api.js';
import Icon from '../components/ui/Icon.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'users', label: 'Users', icon: 'group' },
  { key: 'courses', label: 'Courses', icon: 'school' },
  { key: 'problems', label: 'Problems', icon: 'code' },
  { key: 'compiler', label: 'Compiler', icon: 'terminal' },
  { key: 'ai', label: 'AI Mentor', icon: 'smart_toy' },
  { key: 'audit', label: 'Audit Logs', icon: 'receipt_long' },
  { key: 'security', label: 'Security', icon: 'security' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications' },
  { key: 'permissions', label: 'Permissions', icon: 'manage_accounts' },
];

const ROLE_OPTIONS = ['super_admin', 'admin', 'instructor', 'student', 'guest'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingProblem, setEditingProblem] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '', role: 'student' });
  const [permissions, setPermissions] = useState([]);
  const [editingPerm, setEditingPerm] = useState(null);
  const [config, setConfig] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [secOverview, setSecOverview] = useState(null);
  const [failedLogins, setFailedLogins] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [newNotif, setNewNotif] = useState({ type: 'broadcast', title: '', message: '', audience: 'all', link: '' });
  const [showNewNotif, setShowNewNotif] = useState(false);
  const [logFilter, setLogFilter] = useState({ type: 'all', action: '', days: 7 });
  const [usersForLogout, setUsersForLogout] = useState(null);
  const { addToast } = useToast();

  function loadDashboard() {
    setLoading(true);
    Promise.all([fetchAdminUsers(page, search), fetchAdminStats(), fetchAdminLogs(1)])
      .then(([uData, sData, lData]) => {
        setUsers(uData.users || []); setTotalPages(uData.pages || 1);
        setStats(sData); setLogs(lData?.logs || []);
      }).catch(() => addToast('Failed to load dashboard', 'error'))
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

  function loadLogs() {
    setLoading(true);
    fetchAdminLogs(1, logFilter).then(d => { setLogs(d?.logs || []); setTotalPages(d.pages || 1); }).catch(() => addToast('Failed to load logs', 'error')).finally(() => setLoading(false));
  }

  function loadSecurity() {
    setLoading(true);
    Promise.all([fetchSecurityOverview(), fetchFailedLogins(1)]).then(([o, f]) => { setSecOverview(o); setFailedLogins(f.logs || []); }).catch(() => addToast('Failed to load security data', 'error')).finally(() => setLoading(false));
  }

  function loadNotifs() {
    setLoading(true);
    fetchAdminNotifications(1).then(d => setNotifs(d?.notifications || [])).catch(() => addToast('Failed to load notifications', 'error')).finally(() => setLoading(false));
  }

  function loadConfig() {
    setLoading(true);
    fetchSystemConfig().then(setConfig).catch(() => addToast('Failed to load config', 'error')).finally(() => setLoading(false));
  }

  async function handleSaveConfig(key) {
    setSavingConfig(true);
    try {
      await updateSystemConfig(key, config[key]);
      addToast(`${key} config saved`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save', 'error');
    }
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
    if (!confirm('Delete this permission?')) return;
    try { await deletePermission(id); addToast('Permission deleted', 'success'); loadPermissions(); }
    catch (err) { addToast('Failed', 'error'); }
  }

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'permissions') loadPermissions();
    if (tab === 'compiler' || tab === 'ai') loadConfig();
    if (tab === 'audit') loadLogs();
    if (tab === 'security') loadSecurity();
    if (tab === 'notifications') loadNotifs();
  }, [tab, page]);

  useEffect(() => { if (tab === 'courses') loadCourses(); }, [tab]);
  useEffect(() => { if (tab === 'problems') loadProblems(); }, [tab]);

  async function handleRoleChange(userId, newRole) {
    try {
      const updatedUser = await updateAdminUserRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: updatedUser.role } : u));
      addToast('Role updated', 'success');
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    try {
      await createAdminUser(newUser);
      setShowAddUser(false); setNewUser({ email: '', password: '', displayName: '', role: 'student' });
      addToast('User created', 'success'); loadDashboard();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleDeleteUser(id) {
    if (!confirm('Delete this user and all their submissions?')) return;
    try { await deleteAdminUser(id); addToast('User deleted', 'success'); loadDashboard(); }
    catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleSaveCourse(e) {
    e.preventDefault();
    const form = e.target; const fd = new FormData(form);
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
    } catch (err) { addToast('Failed', 'error'); }
  }

  async function handleDeleteCourse(id) {
    if (!confirm('Delete this course and its modules?')) return;
    try { await deleteCourse(id); addToast('Course deleted', 'success'); loadCourses(); }
    catch (err) { addToast('Failed', 'error'); }
  }

  async function handleSaveProblem(e) {
    e.preventDefault();
    const form = e.target; const fd = new FormData(form);
    const data = {
      problemId: fd.get('problemId'), title: fd.get('title'), statement: fd.get('statement'),
      category: fd.get('category'), difficulty: fd.get('difficulty'),
      tags: fd.get('tags') ? fd.get('tags').split(',').map(t => t.trim()) : [],
      starterCode: { python: fd.get('python_starter') || '', javascript: fd.get('javascript_starter') || '', cpp: fd.get('cpp_starter') || '' },
      oracleSolutions: { python: fd.get('python_oracle') || '', javascript: fd.get('javascript_oracle') || '', cpp: fd.get('cpp_oracle') || '' },
      testCases: [{ input: fd.get('test_input') || '[]', expected: fd.get('test_expected') || '[]' }],
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
    if (!confirm('Delete this problem?')) return;
    try { await deleteProblem(id); addToast('Problem deleted', 'success'); loadProblems(); }
    catch (err) { addToast('Failed', 'error'); }
  }

  async function handleForceLogout(userId) {
    if (!confirm('Force logout this user? They will need to log in again.')) return;
    try { await forceLogoutUser(userId); addToast('User force logged out', 'success'); loadSecurity(); }
    catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleCreateNotif(e) {
    e.preventDefault();
    try {
      await createNotification(newNotif);
      setShowNewNotif(false); setNewNotif({ type: 'broadcast', title: '', message: '', audience: 'all', link: '' });
      addToast('Notification sent', 'success'); loadNotifs();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleDeleteNotif(id) {
    if (!confirm('Delete this notification?')) return;
    try { await deleteNotification(id); addToast('Notification deleted', 'success'); loadNotifs(); }
    catch (err) { addToast('Failed', 'error'); }
  }

  const loader = <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-outline-variant border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="page-enter p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="font-sans text-3xl font-bold text-primary tracking-tight flex items-center gap-2 mb-4">
          <Icon name="admin_panel_settings" size={28} /> Admin Console
        </h1>
        <div className="flex gap-1 bg-surface-container-low border border-outline-variant rounded-lg p-1 w-fit flex-wrap" role="tablist">
          {tabs.map(t => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-mono text-xs font-medium transition-all ${tab === t.key ? 'bg-surface-container text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <Icon name={t.icon} size={16} /> {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div className="space-y-8">
          {stats && <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: 'group', color: 'text-primary' },
                { label: 'Logged In', value: stats.loggedInUsers ?? '—', icon: 'login', color: 'text-secondary' },
                { label: 'Submissions', value: stats.totalSubmissions, icon: 'send', color: 'text-tertiary' },
                { label: 'Pass Rate', value: `${stats.passRate}%`, icon: 'percent', color: 'text-secondary' },
                { label: 'Active (15m)', value: stats.activeSessions || 0, icon: 'battery_charging_full', color: 'text-warning' },
                { label: 'Courses', value: stats.totalCourses ?? 0, icon: 'school', color: 'text-primary' },
                { label: 'Problems', value: stats.totalProblems ?? 0, icon: 'code', color: 'text-on-surface' },
                { label: 'Modules', value: stats.totalModules ?? 0, icon: 'layers', color: 'text-tertiary' },
                { label: 'Reg. Today', value: stats.registrationsToday ?? 0, icon: 'person_add', color: 'text-secondary' },
                { label: 'This Week', value: stats.registrationsThisWeek ?? 0, icon: 'trending_up', color: 'text-primary' },
              ].map(s => (
                <div key={s.label} className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-container-highest"><Icon name={s.icon} size={20} className={s.color} /></div>
                  <div><div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{s.label}</div><div className="font-sans text-2xl font-bold text-on-surface">{s.value}</div></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {stats.submissionsByLanguage && <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
                <h3 className="font-sans text-sm font-semibold text-on-surface mb-3">Submissions by Language</h3>
                {Object.entries(stats.submissionsByLanguage).map(([lang, count]) => (
                  <div key={lang} className="flex items-center justify-between py-1.5 border-b border-outline-variant/30 last:border-0">
                    <span className="font-mono text-xs text-on-surface capitalize">{lang}</span>
                    <span className="font-mono text-xs text-on-surface-variant">{count}</span>
                  </div>
                ))}
              </div>}
              {stats.submissionsByVerdict && <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
                <h3 className="font-sans text-sm font-semibold text-on-surface mb-3">Submissions by Verdict</h3>
                {Object.entries(stats.submissionsByVerdict).map(([v, count]) => (
                  <div key={v} className="flex items-center justify-between py-1.5 border-b border-outline-variant/30 last:border-0">
                    <span className="font-mono text-xs text-on-surface capitalize">{v.replace('_', ' ')}</span>
                    <span className={`font-mono text-xs ${v === 'pass' ? 'text-green-500' : 'text-error'}`}>{count}</span>
                  </div>
                ))}
              </div>}
              {stats.usersByRole && <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
                <h3 className="font-sans text-sm font-semibold text-on-surface mb-3">Users by Role</h3>
                {Object.entries(stats.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between py-1.5 border-b border-outline-variant/30 last:border-0">
                    <span className="font-mono text-xs text-on-surface capitalize">{role.replace('_', ' ')}</span>
                    <span className="font-mono text-xs text-on-surface-variant">{count}</span>
                  </div>
                ))}
              </div>}
            </div>
          </>}

          {stats && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Submissions Today', value: stats.submissionsToday ?? 0, icon: 'today', color: 'text-primary' },
              { label: 'Failed Logins (7d)', value: stats.failedLogins7d ?? 0, icon: 'report', color: 'text-error' },
              { label: 'Passed Submissions', value: stats.passedSubmissions ?? 0, icon: 'check_circle', color: 'text-secondary' },
              { label: 'Failed/Errors', value: (stats.totalSubmissions - stats.passedSubmissions) || 0, icon: 'bug_report', color: 'text-warning' },
            ].map(s => (
              <div key={s.label} className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-surface-container-highest"><Icon name={s.icon} size={18} className={s.color} /></div>
                <div><div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{s.label}</div><div className="font-sans text-xl font-bold text-on-surface">{s.value}</div></div>
              </div>
            ))}
          </div>}

          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <h2 className="font-sans text-lg font-semibold text-on-surface">Recent Failures</h2>
            </div>
            <table className="w-full text-left font-mono text-sm">
              <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
                <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Problem</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Verdict</th><th className="px-6 py-4">Hint</th></tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {logs.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-xs">No failures</td></tr> : logs.map(l => (
                  <tr key={l._id} className="hover:bg-surface-container-low"><td className="px-6 py-4 text-xs text-on-surface-variant">{new Date(l.createdAt).toLocaleString()}</td><td className="px-6 py-4">{l.problemId}</td><td className="px-6 py-4 text-xs">{l.userId}</td><td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[10px] bg-error/10 text-error border border-error/30">{l.verdict}</span></td><td className="px-6 py-4 text-xs">{l.hint ? 'Yes' : 'No'}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {/* ── USERS ── */}
      {tab === 'users' && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap justify-between items-center gap-3">
            <h2 className="font-sans text-lg font-semibold text-on-surface">User Management</h2>
            <div className="flex items-center gap-2">
              <form onSubmit={e => { e.preventDefault(); setPage(1); loadDashboard(); }} className="flex items-center gap-2">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="bg-surface-container border border-outline-variant rounded px-3 py-1.5 font-mono text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-36" />
                <button type="submit" className="font-mono text-xs px-3 py-1.5 bg-primary-container text-white rounded hover:opacity-90">Search</button>
              </form>
              <button onClick={() => setShowAddUser(true)} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add User</button>
            </div>
          </div>
          {showAddUser && (
            <form onSubmit={handleCreateUser} className="p-4 border-b border-outline-variant bg-surface-container-low grid grid-cols-1 sm:grid-cols-5 gap-3">
              <input placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required className="bg-surface-container border border-outline-variant rounded px-3 py-1.5 font-mono text-xs text-on-surface" />
              <input placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required className="bg-surface-container border border-outline-variant rounded px-3 py-1.5 font-mono text-xs text-on-surface" />
              <input placeholder="Display Name" value={newUser.displayName} onChange={e => setNewUser({...newUser, displayName: e.target.value})} className="bg-surface-container border border-outline-variant rounded px-3 py-1.5 font-mono text-xs text-on-surface" />
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="bg-surface-container border border-outline-variant rounded px-3 py-1.5 font-mono text-xs text-on-surface">
                {ROLE_OPTIONS.filter(r => r !== 'guest').map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90">Create</button>
                <button type="button" onClick={() => setShowAddUser(false)} className="font-mono text-xs px-3 py-1.5 bg-surface-container border border-outline-variant rounded hover:bg-surface-container-high">Cancel</button>
              </div>
            </form>
          )}
          <table className="w-full text-left font-mono text-sm">
            <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
              <tr><th className="px-6 py-4 font-medium">User</th><th className="px-6 py-4 font-medium">Role</th><th className="px-6 py-4 font-medium text-right">Submissions</th><th className="px-6 py-4 font-medium text-right">Last Login</th><th className="px-6 py-4 font-medium">Joined</th><th className="px-6 py-4 font-medium text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-surface-container-low group">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{(u.displayName || u.email)[0].toUpperCase()}</div><div className="min-w-0"><div className="font-sans font-medium text-on-surface truncate">{u.displayName || 'No Name'}</div><div className="text-xs text-on-surface-variant truncate">{u.email}</div></div></div></td>
                  <td className="px-6 py-4"><select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)} className="bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary">{ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}</select></td>
                  <td className="px-6 py-4 text-right text-on-surface">{u.submissionsCount || 0}</td>
                  <td className="px-6 py-4 text-right text-on-surface-variant text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteUser(u._id)} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20 transition-colors"><Icon name="delete" size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-center items-center gap-3">
            <button onClick={() => { setPage(page - 1); }} disabled={page <= 1} className="font-mono text-xs px-3 py-1.5 bg-surface-container border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container-high">Previous</button>
            <span className="font-mono text-xs text-on-surface-variant">Page {page} of {totalPages}</span>
            <button onClick={() => { setPage(page + 1); }} disabled={page >= totalPages} className="font-mono text-xs px-3 py-1.5 bg-surface-container border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container-high">Next</button>
          </div>}
        </section>
      )}

      {/* ── COURSES ── */}
      {tab === 'courses' && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h2 className="font-sans text-lg font-semibold text-on-surface">Course Management</h2>
            <button onClick={() => setEditingCourse({})} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add Course</button>
          </div>
          {loading ? loader : (
            <table className="w-full text-left font-mono text-sm">
              <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
                <tr><th className="px-6 py-4">Title</th><th className="px-6 py-4">Order</th><th className="px-6 py-4">Modules</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {courses.map(c => (
                  <tr key={c._id} className="hover:bg-surface-container-low group">
                    <td className="px-6 py-4"><div className="font-sans font-medium text-on-surface">{c.title}</div>{c.description && <div className="text-xs text-on-surface-variant truncate max-w-xs">{c.description}</div>}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">{c.order}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">{(c.modules || []).length}</td>
                    <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditingCourse(c)} className="font-mono text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20"><Icon name="edit" size={12} /></button>
                      <button onClick={() => handleDeleteCourse(c._id)} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20"><Icon name="delete" size={12} /></button>
                    </div></td>
                  </tr>
                ))}
                {courses.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant text-xs">No courses</td></tr>}
              </tbody>
            </table>
          )}
          {editingCourse !== null && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingCourse(null)}>
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="font-sans text-lg font-semibold text-on-surface mb-4">{editingCourse._id ? 'Edit Course' : 'Create Course'}</h3>
                <form onSubmit={handleSaveCourse} className="space-y-3">
                  <input name="title" defaultValue={editingCourse.title || ''} placeholder="Course Title" required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                  <textarea name="description" defaultValue={editingCourse.description || ''} placeholder="Description" rows={2} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                  <div className="flex gap-3"><input name="icon" defaultValue={editingCourse.icon || ''} placeholder="Icon name" className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" /><input name="order" type="number" defaultValue={editingCourse.order || 0} placeholder="Order" className="w-24 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" /></div>
                  <input name="instructorId" defaultValue={editingCourse.instructorId || ''} placeholder="Instructor User ID" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                  <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant"><input name="isPublished" type="checkbox" defaultChecked={editingCourse.isPublished !== false} className="rounded border-outline-variant" /> Published</label>
                  <div className="flex gap-3 pt-2"><button type="submit" className="flex-1 py-2.5 bg-primary text-white font-mono text-xs font-bold uppercase rounded-lg hover:opacity-90">Save</button><button type="button" onClick={() => setEditingCourse(null)} className="flex-1 py-2.5 bg-surface-container border border-outline-variant font-mono text-xs rounded-lg hover:bg-surface-container-high">Cancel</button></div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── PROBLEMS ── */}
      {tab === 'problems' && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h2 className="font-sans text-lg font-semibold text-on-surface">Problem Management</h2>
            <button onClick={() => setEditingProblem({})} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add Problem</button>
          </div>
          {loading ? loader : (
            <table className="w-full text-left font-mono text-sm">
              <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
                <tr><th className="px-6 py-4">Problem ID</th><th className="px-6 py-4">Title</th><th className="px-6 py-4">Difficulty</th><th className="px-6 py-4">Category</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {problems.map(p => (
                  <tr key={p._id} className="hover:bg-surface-container-low group">
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{p.problemId}</td>
                    <td className="px-6 py-4"><div className="font-sans font-medium text-on-surface">{p.title}</div></td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${p.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : p.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>{p.difficulty}</span></td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">{p.category}</td>
                    <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditingProblem(p)} className="font-mono text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20"><Icon name="edit" size={12} /></button>
                      <button onClick={() => handleDeleteProblem(p._id)} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20"><Icon name="delete" size={12} /></button>
                    </div></td>
                  </tr>
                ))}
                {problems.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-xs">No problems</td></tr>}
              </tbody>
            </table>
          )}
          {editingProblem !== null && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingProblem(null)}>
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="font-sans text-lg font-semibold text-on-surface mb-4">{editingProblem._id ? 'Edit Problem' : 'Create Problem'}</h3>
                <form onSubmit={handleSaveProblem} className="space-y-3">
                  <div className="flex gap-3"><input name="problemId" defaultValue={editingProblem.problemId || ''} placeholder="Problem ID (e.g. two-sum)" required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" /><input name="title" defaultValue={editingProblem.title || ''} placeholder="Title" required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" /></div>
                  <textarea name="statement" defaultValue={editingProblem.statement || ''} placeholder="Problem statement (markdown)" rows={3} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                  <div className="flex gap-3">
                    <select name="category" defaultValue={editingProblem.category || ''} required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono"><option value="">Category</option><option>Arrays & Hashing</option><option>Two Pointers</option><option>Searching & Sorting</option><option>Dynamic Programming</option><option>Math & DP</option><option>Stacks & Linked Lists</option><option>Greedy Algorithms</option></select>
                    <select name="difficulty" defaultValue={editingProblem.difficulty || ''} required className="w-32 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono"><option value="">Difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
                    <input name="tags" defaultValue={(editingProblem.tags || []).join(', ')} placeholder="Tags (comma sep)" className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                  </div>
                  <details className="border border-outline-variant rounded-lg"><summary className="px-3 py-2 cursor-pointer font-mono text-xs text-on-surface-variant hover:text-on-surface">Starter Code</summary>
                    <div className="p-3 space-y-2"><textarea name="python_starter" defaultValue={editingProblem.starterCode?.python || ''} placeholder="Python starter code" rows={2} className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" /><textarea name="javascript_starter" defaultValue={editingProblem.starterCode?.javascript || ''} placeholder="JavaScript starter code" rows={2} className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" /><textarea name="cpp_starter" defaultValue={editingProblem.starterCode?.cpp || ''} placeholder="C++ starter code" rows={2} className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" /></div>
                  </details>
                  <details className="border border-outline-variant rounded-lg"><summary className="px-3 py-2 cursor-pointer font-mono text-xs text-on-surface-variant hover:text-on-surface">Oracle Solutions</summary>
                    <div className="p-3 space-y-2"><textarea name="python_oracle" defaultValue={editingProblem.oracleSolutions?.python || ''} placeholder="Python oracle" rows={2} className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" /><textarea name="javascript_oracle" defaultValue={editingProblem.oracleSolutions?.javascript || ''} placeholder="JavaScript oracle" rows={2} className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" /><textarea name="cpp_oracle" defaultValue={editingProblem.oracleSolutions?.cpp || ''} placeholder="C++ oracle" rows={2} className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" /></div>
                  </details>
                  <div className="border border-outline-variant rounded-lg p-3 space-y-2">
                    <div className="font-mono text-xs text-on-surface-variant mb-1">Test Cases</div>
                    <div className="flex gap-2"><input name="test_input" defaultValue={JSON.stringify((editingProblem.testCases || [{ input: [] }])[0]?.input)} placeholder='[[2,7,11,15], 9]' className="flex-1 bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" /><input name="test_expected" defaultValue={JSON.stringify((editingProblem.testCases || [{ expected: [] }])[0]?.expected)} placeholder='[0,1]' className="flex-1 bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" /></div>
                  </div>
                  <div className="flex gap-3"><input name="moduleId" defaultValue={editingProblem.moduleId || ''} placeholder="Module ID" className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" /><input name="authorId" defaultValue={editingProblem.authorId || ''} placeholder="Author User ID" className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" /></div>
                  <div className="flex gap-3 pt-2"><button type="submit" className="flex-1 py-2.5 bg-primary text-white font-mono text-xs font-bold uppercase rounded-lg hover:opacity-90">Save</button><button type="button" onClick={() => setEditingProblem(null)} className="flex-1 py-2.5 bg-surface-container border border-outline-variant font-mono text-xs rounded-lg hover:bg-surface-container-high">Cancel</button></div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── COMPILER ── */}
      {tab === 'compiler' && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h2 className="font-sans text-lg font-semibold text-on-surface">Compiler Management</h2>
            <button onClick={() => handleSaveConfig('compiler')} disabled={savingConfig} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-1"><Icon name="save" size={14} /> {savingConfig ? 'Saving...' : 'Save Changes'}</button>
          </div>
          {loading ? loader : (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-sans text-sm font-semibold text-on-surface mb-3">Supported Languages</h3>
                <div className="space-y-4">
                  {['python', 'cpp', 'javascript'].map(lang => {
                    const lc = config?.compiler?.languages?.[lang] || {};
                    return (
                      <div key={lang} className="bg-surface-container border border-outline-variant rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-sm font-semibold text-on-surface capitalize">{lang}</span>
                          <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
                            <input type="checkbox" checked={lc.enabled !== false} onChange={e => setConfig({ ...config, compiler: { ...config.compiler, languages: { ...config.compiler?.languages, [lang]: { ...lc, enabled: e.target.checked } } } })} className="rounded border-outline-variant" /> Enabled
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Memory (MB)</label><input type="number" value={lc.memoryMb || 256} onChange={e => setConfig({ ...config, compiler: { ...config.compiler, languages: { ...config.compiler?.languages, [lang]: { ...lc, memoryMb: parseInt(e.target.value) } } } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
                          <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Timeout (ms)</label><input type="number" value={lc.timeoutMs || 8000} onChange={e => setConfig({ ...config, compiler: { ...config.compiler, languages: { ...config.compiler?.languages, [lang]: { ...lc, timeoutMs: parseInt(e.target.value) } } } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-outline-variant pt-4">
                <h3 className="font-sans text-sm font-semibold text-on-surface mb-2">Infrastructure</h3>
                <div className="font-mono text-xs text-on-surface-variant space-y-1">
                  <p>Sandbox images: socratica/sandbox-python, socratica/sandbox-cpp, socratica/sandbox-javascript</p>
                  <p>Execution engine: Docker containers (configured in languageConfigs.js)</p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── AI MENTOR ── */}
      {tab === 'ai' && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h2 className="font-sans text-lg font-semibold text-on-surface">AI Mentor Management</h2>
            <button onClick={() => handleSaveConfig('ai')} disabled={savingConfig} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-1"><Icon name="save" size={14} /> {savingConfig ? 'Saving...' : 'Save Changes'}</button>
          </div>
          {loading ? loader : (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
                  <h3 className="font-sans text-sm font-semibold text-on-surface">Provider</h3>
                  <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">AI Provider</label><input value={config?.ai?.provider || 'nvidia'} onChange={e => setConfig({ ...config, ai: { ...config.ai, provider: e.target.value } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
                  <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Base URL</label><input value={config?.ai?.baseUrl || ''} onChange={e => setConfig({ ...config, ai: { ...config.ai, baseUrl: e.target.value } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
                </div>
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
                  <h3 className="font-sans text-sm font-semibold text-on-surface">Model</h3>
                  <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Model Name</label><input value={config?.ai?.model || ''} onChange={e => setConfig({ ...config, ai: { ...config.ai, model: e.target.value } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
                  <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Max Tokens</label><input type="number" value={config?.ai?.maxTokens || 1024} onChange={e => setConfig({ ...config, ai: { ...config.ai, maxTokens: parseInt(e.target.value) } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4">
                  <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
                    <input type="checkbox" checked={config?.ai?.enabled !== false} onChange={e => setConfig({ ...config, ai: { ...config.ai, enabled: e.target.checked } })} className="rounded border-outline-variant" /> AI Mentor Enabled
                  </label>
                </div>
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4">
                  <label className="font-mono text-[10px] text-on-surface-variant uppercase">Temperature</label>
                  <input type="number" step="0.05" min="0" max="2" value={config?.ai?.temperature ?? 0.7} onChange={e => setConfig({ ...config, ai: { ...config.ai, temperature: parseFloat(e.target.value) } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" />
                </div>
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4">
                  <label className="font-mono text-[10px] text-on-surface-variant uppercase">Rate Limit (req/min)</label>
                  <input type="number" value={config?.ai?.rateLimitPerMinute ?? 10} onChange={e => setConfig({ ...config, ai: { ...config.ai, rateLimitPerMinute: parseInt(e.target.value) } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" />
                </div>
              </div>
              <div className="border-t border-outline-variant pt-4">
                <h3 className="font-sans text-sm font-semibold text-on-surface mb-2">API Key</h3>
                <div className="font-mono text-xs text-on-surface-variant space-y-1">
                  <p>Status: {config?.ai?.hasApiKey ? '✅ Configured' : '❌ Not Set'}</p>
                  <p className="text-warning">Set via VERCEL_ENV or .env: NVIDIA_API_KEY</p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── AUDIT LOGS ── */}
      {tab === 'audit' && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap justify-between items-center gap-3">
            <h2 className="font-sans text-lg font-semibold text-on-surface">Audit Logs</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={logFilter.type} onChange={e => setLogFilter({ ...logFilter, type: e.target.value })} className="bg-surface-container border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface">
                <option value="all">All Types</option>
                <option value="audit">Audit Only</option>
                <option value="submissions">Submissions Only</option>
              </select>
              <input type="number" value={logFilter.days} onChange={e => setLogFilter({ ...logFilter, days: parseInt(e.target.value) })} min={1} max={90} className="bg-surface-container border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface w-16" placeholder="Days" />
              <button onClick={() => { setPage(1); loadLogs(); }} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90">Filter</button>
            </div>
          </div>
          {loading ? loader : (
            <table className="w-full text-left font-mono text-sm">
              <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
                <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Action</th><th className="px-6 py-4">Resource</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {logs.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant text-xs">No logs</td></tr> : logs.map(l => (
                  <tr key={l._id} className="hover:bg-surface-container-low">
                    <td className="px-6 py-4 text-xs text-on-surface-variant">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] ${l.logType === 'audit' ? 'bg-secondary/10 text-secondary border border-secondary/30' : 'bg-primary/10 text-primary border border-primary/30'}`}>{l.logType || 'audit'}</span></td>
                    <td className="px-6 py-4 text-on-surface">{l.action}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">{l.resource}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">{typeof l.userId === 'object' ? l.userId?._id || l.userId?.toString().slice(-6) : l.userId?.toString().slice(-6) || (l.userId || '')}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] ${l.success !== false ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-error/10 text-error border border-error/30'}`}>{l.success !== false ? 'Success' : 'Failed'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {totalPages > 1 && <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-center items-center gap-3">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="font-mono text-xs px-3 py-1.5 bg-surface-container border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container-high">Previous</button>
            <span className="font-mono text-xs text-on-surface-variant">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="font-mono text-xs px-3 py-1.5 bg-surface-container border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container-high">Next</button>
          </div>}
        </section>
      )}

      {/* ── SECURITY ── */}
      {tab === 'security' && (
        <div className="space-y-6">
          {secOverview && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Failed Logins (24h)', value: secOverview.failedLogins24h, icon: 'error', color: 'text-error' },
              { label: 'Failed Logins (7d)', value: secOverview.failedLogins7d, icon: 'warning', color: 'text-warning' },
              { label: 'Unique IPs (7d)', value: secOverview.uniqueIPs7d, icon: 'lan', color: 'text-primary' },
              { label: 'Force Logouts (7d)', value: secOverview.forcedLogouts7d, icon: 'logout', color: 'text-secondary' },
            ].map(s => (
              <div key={s.label} className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-container-highest"><Icon name={s.icon} size={20} className={s.color} /></div>
                <div><div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{s.label}</div><div className="font-sans text-2xl font-bold text-on-surface">{s.value}</div></div>
              </div>
            ))}
          </div>}

          {secOverview?.topAttemptedEmails?.length > 0 && <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
            <h3 className="font-sans text-sm font-semibold text-on-surface mb-3">Top Targeted Accounts (7d)</h3>
            <div className="space-y-2">
              {secOverview.topAttemptedEmails.map((e, i) => (
                <div key={e._id} className="flex items-center justify-between py-1.5 border-b border-outline-variant/30 last:border-0">
                  <span className="font-mono text-xs text-on-surface"><span className="text-on-surface-variant w-6 inline-block">#{i + 1}</span> {e._id}</span>
                  <span className="font-mono text-xs text-error">{e.count} attempts</span>
                </div>
              ))}
            </div>
          </div>}

          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <h2 className="font-sans text-lg font-semibold text-on-surface">Failed Login Attempts</h2>
            </div>
            {loading ? loader : (
              <table className="w-full text-left font-mono text-sm">
                <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
                  <tr><th className="px-6 py-4">Time</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">IP</th><th className="px-6 py-4">Reason</th><th className="px-6 py-4">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {failedLogins.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-xs">No failed logins</td></tr> : failedLogins.map(f => (
                    <tr key={f._id} className="hover:bg-surface-container-low">
                      <td className="px-6 py-4 text-xs text-on-surface-variant">{new Date(f.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 text-on-surface">{f.email}</td>
                      <td className="px-6 py-4 text-on-surface-variant text-xs">{f.ip}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[10px] bg-error/10 text-error border border-error/30">{f.reason?.replace('_', ' ')}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {f.userId && <button onClick={() => handleForceLogout(f.userId)} className="font-mono text-[10px] px-2 py-1 bg-warning/10 text-warning border border-warning/30 rounded hover:bg-warning/20"><Icon name="logout" size={12} /></button>}
                          {usersForLogout === null && <button onClick={() => setUsersForLogout(f.userId || f.email)} className="font-mono text-[10px] px-2 py-1 bg-surface-container border border-outline-variant rounded hover:bg-surface-container-high text-on-surface-variant"><Icon name="person_off" size={12} /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === 'settings' && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h2 className="font-sans text-lg font-semibold text-on-surface">System Settings</h2>
            <button onClick={() => handleSaveConfig('platform')} disabled={savingConfig} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-1"><Icon name="save" size={14} /> {savingConfig ? 'Saving...' : 'Save Changes'}</button>
          </div>
          {loading ? loader : (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
                  <h3 className="font-sans text-sm font-semibold text-on-surface">Branding</h3>
                  <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Site Name</label>
                    <input value={config?.platform?.siteName || ''} onChange={e => setConfig({ ...config, platform: { ...config.platform, siteName: e.target.value } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
                </div>
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
                  <h3 className="font-sans text-sm font-semibold text-on-surface">Features</h3>
                  <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant py-1">
                    <input type="checkbox" checked={config?.platform?.allowRegistration !== false} onChange={e => setConfig({ ...config, platform: { ...config.platform, allowRegistration: e.target.checked } })} className="rounded border-outline-variant" /> Allow Registration
                  </label>
                  <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant py-1">
                    <input type="checkbox" checked={config?.platform?.maintenanceMode === true} onChange={e => setConfig({ ...config, platform: { ...config.platform, maintenanceMode: e.target.checked } })} className="rounded border-outline-variant" /> Maintenance Mode
                  </label>
                </div>
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
                  <h3 className="font-sans text-sm font-semibold text-on-surface">Defaults</h3>
                  <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Default Role</label>
                    <select value={config?.platform?.defaultRole || 'student'} onChange={e => setConfig({ ...config, platform: { ...config.platform, defaultRole: e.target.value } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1">
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select></div>
                  <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Session Duration (hours)</label>
                    <input type="number" value={config?.platform?.sessionDurationHours || 24} onChange={e => setConfig({ ...config, platform: { ...config.platform, sessionDurationHours: parseInt(e.target.value) } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
                </div>
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
                  <h3 className="font-sans text-sm font-semibold text-on-surface">AI Features</h3>
                  <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
                    <input type="checkbox" checked={config?.ai?.enabled !== false} onChange={e => setConfig({ ...config, ai: { ...config.ai, enabled: e.target.checked } })} className="rounded border-outline-variant" /> AI Mentor Enabled
                  </label>
                  <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant py-1">
                    <input type="checkbox" checked={config?.platform?.enableAIHints !== false} onChange={e => setConfig({ ...config, platform: { ...config.platform, enableAIHints: e.target.checked } })} className="rounded border-outline-variant" /> Hints & Explanations
                  </label>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === 'notifications' && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h2 className="font-sans text-lg font-semibold text-on-surface">Notifications</h2>
            <button onClick={() => setShowNewNotif(true)} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Send Notification</button>
          </div>
          {showNewNotif && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="font-sans text-lg font-semibold text-on-surface mb-4">New Notification</h3>
                <form onSubmit={handleCreateNotif} className="space-y-3">
                  <div className="flex gap-3">
                    <select value={newNotif.type} onChange={e => setNewNotif({...newNotif, type: e.target.value})} className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                      <option value="broadcast">Broadcast</option><option value="info">Info</option><option value="warning">Warning</option><option value="announcement">Announcement</option>
                    </select>
                    <select value={newNotif.audience} onChange={e => setNewNotif({...newNotif, audience: e.target.value})} className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                      <option value="all">All Users</option><option value="students">Students</option><option value="instructors">Instructors</option><option value="admins">Admins</option>
                    </select>
                  </div>
                  <input placeholder="Title" value={newNotif.title} onChange={e => setNewNotif({...newNotif, title: e.target.value})} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                  <textarea placeholder="Message" value={newNotif.message} onChange={e => setNewNotif({...newNotif, message: e.target.value})} required rows={3} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                  <input placeholder="Link (optional)" value={newNotif.link} onChange={e => setNewNotif({...newNotif, link: e.target.value})} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 py-2.5 bg-primary text-white font-mono text-xs font-bold uppercase rounded-lg hover:opacity-90">Send</button>
                    <button type="button" onClick={() => setShowNewNotif(false)} className="flex-1 py-2.5 bg-surface-container border border-outline-variant font-mono text-xs rounded-lg hover:bg-surface-container-high">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {loading ? loader : (
            <table className="w-full text-left font-mono text-sm">
              <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
                <tr><th className="px-6 py-4">Sent</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Title</th><th className="px-6 py-4">Audience</th><th className="px-6 py-4">Active</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {notifs.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant text-xs">No notifications</td></tr> : notifs.map(n => (
                  <tr key={n._id} className="hover:bg-surface-container-low group">
                    <td className="px-6 py-4 text-xs text-on-surface-variant">{new Date(n.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] ${n.type === 'warning' ? 'bg-warning/10 text-warning border border-warning/30' : n.type === 'announcement' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-surface-container border border-outline-variant text-on-surface-variant'}`}>{n.type}</span></td>
                    <td className="px-6 py-4"><div className="font-sans font-medium text-on-surface">{n.title}</div>{n.message && <div className="text-xs text-on-surface-variant truncate max-w-xs">{n.message}</div>}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">{n.audience}</td>
                    <td className="px-6 py-4">{n.active ? <span className="text-green-500 text-xs">Active</span> : <span className="text-on-surface-variant text-xs">Inactive</span>}</td>
                    <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteNotif(n._id)} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20"><Icon name="delete" size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* ── PERMISSIONS ── */}
      {tab === 'permissions' && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h2 className="font-sans text-lg font-semibold text-on-surface">Role Permissions (RBAC)</h2>
            <button onClick={() => setEditingPerm({})} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add Permission</button>
          </div>
          {loading ? loader : (
            <table className="w-full text-left font-mono text-sm">
              <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
                <tr><th className="px-6 py-4">Role</th><th className="px-6 py-4">Resource</th><th className="px-6 py-4">Actions</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {permissions.map(p => (
                  <tr key={p._id} className="hover:bg-surface-container-low group">
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${p.role === 'super_admin' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/30' : p.role === 'admin' ? 'bg-primary/10 text-primary border border-primary/30' : p.role === 'instructor' ? 'bg-secondary/10 text-secondary border border-secondary/30' : 'bg-on-surface/10 text-on-surface border border-on-surface/30'}`}>{p.role}</span></td>
                    <td className="px-6 py-4 text-on-surface">{p.resource}</td>
                    <td className="px-6 py-4"><div className="flex gap-1 flex-wrap">{(p.actions || []).map(a => <span key={a} className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container border border-outline-variant text-on-surface-variant">{a}</span>)}</div></td>
                    <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingPerm(p)} className="font-mono text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20"><Icon name="edit" size={12} /></button>
                      <button onClick={() => handleDeletePerm(p._id)} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20"><Icon name="delete" size={12} /></button>
                    </div></td>
                  </tr>
                ))}
                {permissions.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant text-xs">No permissions configured</td></tr>}
              </tbody>
            </table>
          )}
          {editingPerm !== null && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingPerm(null)}>
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="font-sans text-lg font-semibold text-on-surface mb-4">{editingPerm._id ? 'Edit Permission' : 'Create Permission'}</h3>
                <form onSubmit={handleSavePerm} className="space-y-3">
                  <select name="role" defaultValue={editingPerm.role || ''} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                  <input name="resource" defaultValue={editingPerm.resource || ''} placeholder="Resource (e.g. users, courses, problems)" required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                  <input name="resourceId" defaultValue={editingPerm.resourceId === '*' ? '' : editingPerm.resourceId || ''} placeholder="Resource ID (* for all)" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                  <input name="actions" defaultValue={(editingPerm.actions || []).join(', ')} placeholder="Actions: create, read, update, delete, manage, access" required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 py-2.5 bg-primary text-white font-mono text-xs font-bold uppercase rounded-lg hover:opacity-90">Save</button>
                    <button type="button" onClick={() => setEditingPerm(null)} className="flex-1 py-2.5 bg-surface-container border border-outline-variant font-mono text-xs rounded-lg hover:bg-surface-container-high">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
