import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { SECURITY_WINDOW_DAYS, SECURITY_WINDOW_HOURS } from '../../constants';
import { SkeletonTable, SkeletonCards } from './Skeletons.jsx';
import ConfirmModal from './ConfirmModal.jsx';

export default function SecurityTab({ secOverview, failedLogins, onForceLogout, loading }) {
  const [confirmUserId, setConfirmUserId] = useState(null);
  if (loading) return <><SkeletonCards count={4} /><SkeletonTable rows={5} cols={4} colSpan={5} /></>;
  return (
    <div className="space-y-6">
      {secOverview && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: `Failed Logins (${SECURITY_WINDOW_HOURS}h)`, value: secOverview.failedLogins24h, icon: 'error', color: 'text-error' },
          { label: `Failed Logins (${SECURITY_WINDOW_DAYS}d)`, value: secOverview.failedLogins7d, icon: 'warning', color: 'text-warning' },
          { label: `Unique IPs (${SECURITY_WINDOW_DAYS}d)`, value: secOverview.uniqueIPs7d, icon: 'lan', color: 'text-primary' },
          { label: `Force Logouts (${SECURITY_WINDOW_DAYS}d)`, value: secOverview.forcedLogouts7d, icon: 'logout', color: 'text-secondary' },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-container-highest"><Icon name={s.icon} size={20} className={s.color} /></div>
            <div><div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{s.label}</div><div className="font-sans text-2xl font-bold text-on-surface">{s.value}</div></div>
          </div>
        ))}
      </div>}
      {secOverview?.topAttemptedEmails?.length > 0 && <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
        <h3 className="font-sans text-sm font-semibold text-on-surface mb-3">Top Targeted Accounts ({SECURITY_WINDOW_DAYS}d)</h3>
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
                    {f.userId && <button onClick={() => setConfirmUserId(f.userId)} className="font-mono text-[10px] px-2 py-1 bg-warning/10 text-warning border border-warning/30 rounded hover:bg-warning/20"><Icon name="logout" size={12} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <ConfirmModal open={!!confirmUserId} title="Force Logout" message="Force logout this user? They will need to log in again." confirmLabel="Force Logout" onConfirm={() => { onForceLogout(confirmUserId); setConfirmUserId(null); }} onCancel={() => setConfirmUserId(null)} />
    </div>
  );
}
