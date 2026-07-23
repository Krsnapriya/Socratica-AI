import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { usePublicConfig } from '../../contexts/PublicConfigContext.jsx';
import { ROLE_OPTIONS as FALLBACK_ROLES, ROLE_BADGE_STYLES, PLATFORM_MODULES } from '../../constants';
import { SkeletonTable } from './Skeletons.jsx';
import ConfirmModal from './ConfirmModal.jsx';

export default function ModuleAccessTab({ permissions, _editingPerm, setEditingPerm, onSave, onDelete, loading }) {
  const [confirmId, setConfirmId] = useState(null);
  const pc = usePublicConfig();
  const roleOptions = pc?.roles?.map(r => r.name) || FALLBACK_ROLES;

  const getModuleAccess = (role) => {
    return permissions
      .filter(p => p.role === role && p.resource === 'module_access')
      .map(p => ({ resourceId: p.resourceId, actions: p.actions }));
  };

  const hasAccess = (role, moduleKey, action = 'access') => {
    const access = getModuleAccess(role);
    return access.some(a => a.resourceId === moduleKey && a.actions.includes(action));
  };

  const toggleAccess = (role, moduleKey, action = 'access') => {
    const currentAccess = getModuleAccess(role);
    const existingIndex = currentAccess.findIndex(a => a.resourceId === moduleKey);
    
    let updatedAccess;
    if (existingIndex >= 0) {
      updatedAccess = [...currentAccess];
      if (updatedAccess[existingIndex].actions.includes(action)) {
        updatedAccess[existingIndex].actions = updatedAccess[existingIndex].actions.filter(a => a !== action);
        if (updatedAccess[existingIndex].actions.length === 0) {
          updatedAccess.splice(existingIndex, 1);
        }
      } else {
        updatedAccess[existingIndex].actions.push(action);
      }
    } else {
      updatedAccess = [...currentAccess, { resourceId: moduleKey, actions: [action] }];
    }
    
    // Save each permission entry
    updatedAccess.forEach((access, _index) => {
      const permData = {
        role,
        resource: 'module_access',
        resourceId: access.resourceId,
        actions: access.actions,
      };
      
      const existingPerm = permissions.find(p => 
        p.role === role && 
        p.resource === 'module_access' && 
        p.resourceId === access.resourceId
      );
      
      if (existingPerm) {
        onSave({ preventDefault: () => {}, target: { elements: {
          role: { value: permData.role },
          resource: { value: permData.resource },
          resourceId: { value: permData.resourceId },
          actions: { value: permData.actions.join(',') }
        }}});
      } else {
        // Create new permission
        onSave({ preventDefault: () => {}, target: { elements: {
          role: { value: permData.role },
          resource: { value: permData.resource },
          resourceId: { value: permData.resourceId },
          actions: { value: permData.actions.join(',') }
        }}});
      }
    });
    
    // If we removed an access, we need to delete it
    if (currentAccess.length > updatedAccess.length) {
      const removed = currentAccess.find(a => !updatedAccess.some(ua => ua.resourceId === a.resourceId));
      if (removed) {
        const permToDelete = permissions.find(p => 
          p.role === role && 
          p.resource === 'module_access' && 
          p.resourceId === removed.resourceId
        );
        if (permToDelete) {
          onDelete(permToDelete._id);
        }
      }
    }
  };

  if (loading) return <SkeletonTable rows={8} cols={4} colSpan={4} />;

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low">
        <h2 className="font-sans text-lg font-semibold text-on-surface">Module-Level Access Control</h2>
        <p className="font-mono text-xs text-on-surface-variant mt-1">
          Configure which platform modules each role can access. Super Admin has access to all modules.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Role</th>
              {PLATFORM_MODULES.map(m => (
                <th key={m.key} className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Icon name={m.icon} size={16} />
                    <span className="hidden sm:inline">{m.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {roleOptions
              .filter(r => r !== 'guest' && r !== 'super_admin')
              .map(role => {
                const rbs = ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.student;
                return (
                  <tr key={role} className="hover:bg-surface-container-low">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${rbs.bg} ${rbs.text} border ${rbs.border}`}>
                        {role.replace('_', ' ')}
                      </span>
                    </td>
                    {PLATFORM_MODULES.map(module => (
                      <td key={module.key} className="px-4 py-4 text-center">
                        <label className="flex items-center justify-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasAccess(role, module.key)}
                            onChange={() => toggleAccess(role, module.key)}
                            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                          />
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-outline-variant bg-surface-container-low">
        <h3 className="font-sans text-sm font-semibold text-on-surface mb-3">Detailed Permission Management</h3>
        <p className="font-mono text-xs text-on-surface-variant mb-3">
          Use the Permissions tab for granular resource/action permissions. This tab provides a simplified module-level view.
        </p>
        
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
            <tr><th className="px-6 py-4">Role</th><th className="px-6 py-4">Module</th><th className="px-6 py-4">Actions</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {permissions
              .filter(p => p.resource === 'module_access')
              .map(p => {
                const rbs = ROLE_BADGE_STYLES[p.role] || ROLE_BADGE_STYLES.student;
                const moduleInfo = PLATFORM_MODULES.find(m => m.key === p.resourceId) || { label: p.resourceId };
                return (
                  <tr key={p._id} className="hover:bg-surface-container-low group">
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${rbs.bg} ${rbs.text} border ${rbs.border}`}>{p.role}</span></td>
                    <td className="px-6 py-4 text-on-surface">{moduleInfo.label}</td>
                    <td className="px-6 py-4"><div className="flex gap-1 flex-wrap">{(p.actions || []).map(a => <span key={a} className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container border border-outline-variant text-on-surface-variant">{a}</span>)}</div></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setConfirmId(p._id)} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20"><Icon name="delete" size={12} /></button>
                    </td>
                  </tr>
                );
              })}
            {permissions.filter(p => p.resource === 'module_access').length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant text-xs">No module access permissions configured</td></tr>
            )}
          </tbody>
        </table>

        <button
          onClick={() => setEditingPerm({ resource: 'module_access', resourceId: PLATFORM_MODULES[0].key, actions: ['access'] })}
          className="mt-3 font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"
        >
          <Icon name="add" size={14} /> Add Module Access Permission
        </button>
      </div>

      <ConfirmModal open={!!confirmId} title="Delete Module Access" message="Remove this module access permission?" danger confirmLabel="Delete" onConfirm={() => { onDelete(confirmId); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
    </section>
  );
}