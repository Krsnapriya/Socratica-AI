import { LOG_FILTER_TYPES, AUDIT_LOG_TYPE_STYLES } from '../../constants';
import { SkeletonTable } from './Skeletons.jsx';
import { Pagination } from './AdminUI.jsx';

export default function AuditTab({ auditLogs, auditPage, auditTotalPages, setAuditPage, logFilter, setLogFilter, onFilter, loading }) {
  if (loading) return <SkeletonTable rows={8} cols={5} colSpan={6} />;
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap justify-between items-center gap-3">
        <h2 className="font-sans text-lg font-semibold text-on-surface">Audit Logs</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={logFilter.type} onChange={e => setLogFilter({ ...logFilter, type: e.target.value })} className="bg-surface-container border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface">
            {LOG_FILTER_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
          </select>
          <input type="number" value={logFilter.days} onChange={e => setLogFilter({ ...logFilter, days: Math.max(1, parseInt(e.target.value) || 1) })} min={1} max={90} className="bg-surface-container border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface w-16" placeholder="Days" />
          <button onClick={() => { setAuditPage(1); onFilter(); }} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90">Filter</button>
        </div>
      </div>
      <table className="w-full text-left font-mono text-sm">
        <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
          <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Action</th><th className="px-6 py-4">Resource</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {(auditLogs || []).length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant text-xs">No logs</td></tr> : (auditLogs || []).map(l => {
            const ts = AUDIT_LOG_TYPE_STYLES[l.logType] || AUDIT_LOG_TYPE_STYLES.audit;
            return (
              <tr key={l._id} className="hover:bg-surface-container-low">
                <td className="px-6 py-4 text-xs text-on-surface-variant">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] ${ts.bg} ${ts.text} border ${ts.border}`}>{l.logType || 'audit'}</span></td>
                <td className="px-6 py-4 text-on-surface">{l.action}</td>
                <td className="px-6 py-4 text-on-surface-variant text-xs">{l.resource}</td>
                <td className="px-6 py-4 text-on-surface-variant text-xs">{typeof l.userId === 'object' ? l.userId?._id || l.userId?.toString().slice(-6) : l.userId?.toString().slice(-6) || (l.userId || '')}</td>
                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] ${l.success !== false ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-error/10 text-error border border-error/30'}`}>{l.success !== false ? 'Success' : 'Failed'}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pagination page={auditPage} totalPages={auditTotalPages} onPrev={() => setAuditPage(auditPage - 1)} onNext={() => setAuditPage(auditPage + 1)} />
    </section>
  );
}
