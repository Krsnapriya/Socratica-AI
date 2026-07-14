import Icon from '../../components/ui/Icon.jsx';
import { SkeletonCards } from './Skeletons.jsx';
import { ACTIVE_SESSION_THRESHOLD_MINUTES, SECURITY_WINDOW_DAYS } from '../../constants';

export default function DashboardTab({ stats, recentLogs, loading }) {
  if (loading) return <SkeletonCards count={10} />;
  return (
    <div className="space-y-8">
      {stats && <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: 'group', color: 'text-primary' },
            { label: 'Logged In', value: stats.loggedInUsers ?? '—', icon: 'login', color: 'text-secondary' },
            { label: 'Submissions', value: stats.totalSubmissions, icon: 'send', color: 'text-tertiary' },
            { label: 'Pass Rate', value: `${stats.passRate}%`, icon: 'percent', color: 'text-secondary' },
            { label: `Active (${ACTIVE_SESSION_THRESHOLD_MINUTES}m)`, value: stats.activeSessions || 0, icon: 'battery_charging_full', color: 'text-warning' },
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
          { label: `Failed Logins (${SECURITY_WINDOW_DAYS}d)`, value: stats.failedLogins7d ?? 0, icon: 'report', color: 'text-error' },
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
            {recentLogs.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-xs">No failures</td></tr> : recentLogs.map(l => (
              <tr key={l._id} className="hover:bg-surface-container-low"><td className="px-6 py-4 text-xs text-on-surface-variant">{new Date(l.createdAt).toLocaleString()}</td><td className="px-6 py-4">{l.problemId}</td><td className="px-6 py-4 text-xs">{l.userId}</td><td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[10px] bg-error/10 text-error border border-error/30">{l.verdict}</span></td><td className="px-6 py-4 text-xs">{l.hint ? 'Yes' : 'No'}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
