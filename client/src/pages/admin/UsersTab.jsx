import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { usePublicConfig } from '../../contexts/PublicConfigContext.jsx';
import { ROLE_OPTIONS as FALLBACK_ROLES, DEFAULT_ROLE } from '../../constants';
import { SkeletonTable } from './Skeletons.jsx';
import { Pagination } from './AdminUI.jsx';
import ConfirmModal from './ConfirmModal.jsx';

export default function UsersTab({ users, userPage, userTotalPages, userSearch, setUserSearch, setUserPage, onSearch, onAdd, onDelete, onRoleChange, loading }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '', role: DEFAULT_ROLE });
  const [confirmId, setConfirmId] = useState(null);
  const pc = usePublicConfig();
  const roleOptions = pc?.roles?.map(r => r.name) || FALLBACK_ROLES;

  const handleCreate = (e) => {
    e.preventDefault();
    onAdd(newUser, () => { setShowAdd(false); setNewUser({ email: '', password: '', displayName: '', role: DEFAULT_ROLE }); });
  };

  if (loading) return <SkeletonTable rows={8} cols={5} colSpan={6} />;

  return (
    <>
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap justify-between items-center gap-3">
        <h2 className="font-sans text-lg font-semibold text-on-surface">User Management</h2>
        <div className="flex items-center gap-2">
          <form onSubmit={e => { e.preventDefault(); setUserPage(1); onSearch(); }} className="flex items-center gap-2">
            <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search..." className="bg-surface-container border border-outline-variant rounded px-3 py-1.5 font-mono text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-36" />
            <button type="submit" className="font-mono text-xs px-3 py-1.5 bg-primary-container text-white rounded hover:opacity-90">Search</button>
          </form>
          <button onClick={() => setShowAdd(true)} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add User</button>
        </div>
      </div>
      {showAdd && (
        <form onSubmit={handleCreate} className="p-4 border-b border-outline-variant bg-surface-container-low grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required className="bg-surface-container border border-outline-variant rounded px-3 py-1.5 font-mono text-xs text-on-surface" />
          <input placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required className="bg-surface-container border border-outline-variant rounded px-3 py-1.5 font-mono text-xs text-on-surface" />
          <input placeholder="Display Name" value={newUser.displayName} onChange={e => setNewUser({...newUser, displayName: e.target.value})} className="bg-surface-container border border-outline-variant rounded px-3 py-1.5 font-mono text-xs text-on-surface" />
          <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="bg-surface-container border border-outline-variant rounded px-3 py-1.5 font-mono text-xs text-on-surface">
            {roleOptions.filter(r => r !== 'guest').map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90">Create</button>
            <button type="button" onClick={() => setShowAdd(false)} className="font-mono text-xs px-3 py-1.5 bg-surface-container border border-outline-variant rounded hover:bg-surface-container-high">Cancel</button>
          </div>
        </form>
      )}
      <table className="w-full text-left font-mono text-sm">
        <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
          <tr><th className="px-6 py-4 font-medium">User</th><th className="px-6 py-4 font-medium">Role</th><th className="px-6 py-4 font-medium text-right">Submissions</th><th className="px-6 py-4 font-medium text-right">Last Login</th><th className="px-6 py-4 font-medium">Joined</th><th className="px-6 py-4 font-medium text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {(users || []).map(u => (
            <tr key={u._id} className="hover:bg-surface-container-low group">
              <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{(u.displayName || u.email)[0].toUpperCase()}</div><div className="min-w-0"><div className="font-sans font-medium text-on-surface truncate">{u.displayName || 'No Name'}</div><div className="text-xs text-on-surface-variant truncate">{u.email}</div></div></div></td>
              <td className="px-6 py-4"><select value={u.role} onChange={e => onRoleChange(u._id, e.target.value)} className="bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary">{roleOptions.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}</select></td>
              <td className="px-6 py-4 text-right text-on-surface">{u.submissionsCount || 0}</td>
              <td className="px-6 py-4 text-right text-on-surface-variant text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}</td>
              <td className="px-6 py-4 text-on-surface-variant text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="px-6 py-4 text-right"><button onClick={() => setConfirmId(u._id)} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20 transition-colors"><Icon name="delete" size={12} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={userPage} totalPages={userTotalPages} onPrev={() => setUserPage(userPage - 1)} onNext={() => setUserPage(userPage + 1)} />
      <ConfirmModal open={!!confirmId} title="Delete User" message="Delete this user and all their submissions?" danger confirmLabel="Delete" onConfirm={() => { onDelete(confirmId); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
    </>
  );
}
