import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { NOTIFICATION_TYPES, NOTIFICATION_AUDIENCES, NOTIFICATION_TYPE_STYLES } from '../../constants';
import { SkeletonTable } from './Skeletons.jsx';
import { Modal, FormActions } from './AdminUI.jsx';
import ConfirmModal from './ConfirmModal.jsx';

export default function NotificationsTab({ notifs, showNewNotif, setShowNewNotif, newNotif, setNewNotif, onCreate, onDelete, loading }) {
  const [confirmId, setConfirmId] = useState(null);
  if (loading) return <SkeletonTable rows={5} cols={5} colSpan={6} />;
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
        <h2 className="font-sans text-lg font-semibold text-on-surface">Notifications</h2>
        <button onClick={() => setShowNewNotif(true)} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Send Notification</button>
      </div>
      {showNewNotif && (
        <Modal title="New Notification" onClose={() => setShowNewNotif(false)}>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="flex gap-3">
              <select value={newNotif.type} onChange={e => setNewNotif({...newNotif, type: e.target.value})} className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                {NOTIFICATION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <select value={newNotif.audience} onChange={e => setNewNotif({...newNotif, audience: e.target.value})} className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                {NOTIFICATION_AUDIENCES.map(a => <option key={a} value={a}>{a === 'all' ? 'All Users' : a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
              </select>
            </div>
            <input placeholder="Title" value={newNotif.title} onChange={e => setNewNotif({...newNotif, title: e.target.value})} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
            <textarea placeholder="Message" value={newNotif.message} onChange={e => setNewNotif({...newNotif, message: e.target.value})} required rows={3} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
            <input placeholder="Link (optional)" value={newNotif.link} onChange={e => setNewNotif({...newNotif, link: e.target.value})} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
            <FormActions onCancel={() => setShowNewNotif(false)} saveLabel="Send" />
          </form>
        </Modal>
      )}
      <table className="w-full text-left font-mono text-sm">
        <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
          <tr><th className="px-6 py-4">Sent</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Title</th><th className="px-6 py-4">Audience</th><th className="px-6 py-4">Active</th><th className="px-6 py-4 text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {(notifs || []).length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant text-xs">No notifications</td></tr> : (notifs || []).map(n => {
            const nts = NOTIFICATION_TYPE_STYLES[n.type] || NOTIFICATION_TYPE_STYLES.info;
            return (
              <tr key={n._id} className="hover:bg-surface-container-low group">
                <td className="px-6 py-4 text-xs text-on-surface-variant">{new Date(n.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] ${nts.bg} ${nts.text} border ${nts.border}`}>{n.type}</span></td>
                <td className="px-6 py-4"><div className="font-sans font-medium text-on-surface">{n.title}</div>{n.message && <div className="text-xs text-on-surface-variant truncate max-w-xs">{n.message}</div>}</td>
                <td className="px-6 py-4 text-on-surface-variant text-xs">{n.audience}</td>
                <td className="px-6 py-4">{n.active ? <span className="text-green-500 text-xs">Active</span> : <span className="text-on-surface-variant text-xs">Inactive</span>}</td>
                <td className="px-6 py-4 text-right"><button onClick={() => setConfirmId(n._id)} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20"><Icon name="delete" size={12} /></button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ConfirmModal open={!!confirmId} title="Delete Notification" message="Delete this notification?" danger confirmLabel="Delete" onConfirm={() => { onDelete(confirmId); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
    </section>
  );
}
