import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { usePublicConfig } from '../../contexts/PublicConfigContext.jsx';
import { ROLE_OPTIONS as FALLBACK_ROLES, ROLE_BADGE_STYLES, PERMISSION_ACTIONS, PERMISSION_RESOURCES } from '../../constants';
import { SkeletonTable } from './Skeletons.jsx';
import { Modal, FormActions, EditDeleteButtons } from './AdminUI.jsx';
import ConfirmModal from './ConfirmModal.jsx';

export default function PermissionsTab({ permissions, editingPerm, setEditingPerm, onSave, onDelete, loading }) {
  const [confirmId, setConfirmId] = useState(null);
  const pc = usePublicConfig();
  const roleOptions = pc?.roles?.map(r => r.name) || FALLBACK_ROLES;
  if (loading) return <SkeletonTable rows={5} cols={3} colSpan={4} />;
  return (
    <>
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <h2 className="font-sans text-lg font-semibold text-on-surface">Role Permissions (RBAC)</h2>
          <p className="font-mono text-[10px] text-on-surface-variant">Define which roles can access, create, edit, or delete specific resources</p>
          <button onClick={() => setEditingPerm({})} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add Permission</button>
        </div>
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
            <tr><th className="px-6 py-4">Role</th><th className="px-6 py-4">Resource</th><th className="px-6 py-4">Permissions</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {(permissions || []).map(p => {
              const rbs = ROLE_BADGE_STYLES[p.role] || ROLE_BADGE_STYLES.student;
              return (
                <tr key={p._id} className="hover:bg-surface-container-low group">
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${rbs.bg} ${rbs.text} border ${rbs.border}`}>{p.role}</span></td>
                  <td className="px-6 py-4 text-on-surface">{p.resource}</td>
                  <td className="px-6 py-4"><div className="flex gap-1 flex-wrap">{(p.actions || []).map(a => <span key={a} className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container border border-outline-variant text-on-surface-variant">{a}</span>)}</div></td>
                  <td className="px-6 py-4 text-right"><EditDeleteButtons onEdit={() => setEditingPerm(p)} onDelete={() => setConfirmId(p._id)} /></td>
                </tr>
              );
            })}
            {(permissions || []).length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant text-xs">No permissions configured</td></tr>}
          </tbody>
        </table>
        {editingPerm != null && (
          <Modal title={editingPerm._id ? 'Edit Permission' : 'Create Permission'} onClose={() => setEditingPerm(null)}>
            <form onSubmit={onSave} className="space-y-3">
              <select name="role" defaultValue={editingPerm.role || ''} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                {roleOptions.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
              <select name="resource" defaultValue={editingPerm.resource || ''} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                <option value="">Select Resource</option>
                {PERMISSION_RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input name="resourceId" defaultValue={editingPerm.resourceId === '*' ? '' : editingPerm.resourceId || ''} placeholder="Resource ID (* for all)" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
              <input name="actions" defaultValue={(editingPerm.actions || []).join(', ')} placeholder={`Actions: ${PERMISSION_ACTIONS.join(', ')}`} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
              <FormActions onCancel={() => setEditingPerm(null)} />
            </form>
          </Modal>
        )}
      </section>
      <ConfirmModal open={!!confirmId} title="Delete Permission" message="Delete this permission?" danger confirmLabel="Delete" onConfirm={() => { onDelete(confirmId); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
    </>
  );
}
