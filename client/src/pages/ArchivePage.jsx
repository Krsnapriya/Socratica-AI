import { useState, useEffect } from 'react';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { fetchStats, fetchSolved } from '../api/api.js';

function ArchiveCard({ icon, date, title, description, actions, dashed = false }) {
  return (
    <article className={`bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col h-full transition-all duration-200 hover:border-primary/60 group
      ${dashed ? 'opacity-60 hover:opacity-100 border-dashed' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-container-highest)' }}>
          <Icon name={icon} size={22} className="text-primary" />
        </div>
        <span className="font-mono text-xs text-on-surface-variant px-2 py-1 rounded-md" style={{ background: 'var(--surface-container-highest)' }}>
          {date}
        </span>
      </div>
      <h3 className="font-sans text-base font-semibold text-on-surface mb-2">{title}</h3>
      <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-3 flex-1 mb-4">{description}</p>
      <div className="pt-3 border-t border-outline-variant/40 flex gap-2">
        {actions}
      </div>
    </article>
  );
}

export default function ArchivePage() {
  const [stats, setStats] = useState(null);
  const [solvedData, setSolvedData] = useState({ count: 0, problems: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchStats(), fetchSolved()])
      .then(([statsData, solvedResponse]) => {
        setStats(statsData);
        setSolvedData(solvedResponse);
      })
      .catch(() => {
        setStats({ solved: 0, total: 0, passRate: 0 });
        setSolvedData({ count: 0, problems: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  const masteredCount = stats?.solved ?? 0;

  return (
    <div className="page-enter space-y-8">
      {/* ── Header ── */}
      <header>
        <h1 className="font-sans text-[32px] md:text-[40px] font-bold text-on-surface tracking-tight mb-1">Archive Repository</h1>
        <p className="text-on-surface-variant text-base leading-relaxed max-w-2xl">
          Access mastered modules, solved problem records, and immutable records of your intellectual progression.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Stats ── */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          {/* Solved count */}
          <div className="bg-surface-container-high border border-outline-variant rounded-xl p-6 relative overflow-hidden group cursor-default">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden="true" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <Icon name="check_circle" size={28} className="text-secondary" />
              <span className="font-mono text-xs text-secondary bg-secondary/10 px-2 py-1 rounded-md">SOLVED</span>
            </div>
            <div className="relative z-10">
              {loading
                ? <div className="h-12 w-16 skeleton rounded" />
                : <p className="font-sans text-5xl font-bold text-on-surface leading-none">{masteredCount}</p>
              }
              <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mt-2">Problems Mastered</p>
            </div>
          </div>

          {/* Total submissions */}
          <div className="bg-surface-container-high border border-outline-variant rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <Icon name="send" size={24} className="text-primary" />
              <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">TOTAL</span>
            </div>
            {loading
              ? <div className="h-10 w-12 skeleton rounded" />
              : <p className="font-sans text-4xl font-bold text-on-surface leading-none">{stats?.total ?? 0}</p>
            }
            <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mt-2">Total Submissions</p>
          </div>

          {/* Pass rate */}
          <div className="bg-surface-container-high border border-outline-variant rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <Icon name="percent" size={24} className="text-tertiary" />
              <span className="font-mono text-xs text-tertiary bg-tertiary/10 px-2 py-1 rounded-md">RATE</span>
            </div>
            {loading
              ? <div className="h-10 w-12 skeleton rounded" />
              : <p className="font-sans text-4xl font-bold text-on-surface leading-none">{stats?.passRate ?? 0}%</p>
            }
            <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mt-2">Pass Rate</p>
          </div>
        </div>

        {/* ── Right Column: Archive Cards ── */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {loading ? (
             <div className="text-on-surface-variant text-sm">Loading archive...</div>
          ) : solvedData.problems.length === 0 ? (
             <div className="text-on-surface-variant text-sm">You haven't solved any problems yet.</div>
          ) : (
            solvedData.problems.map(problem => (
              <ArchiveCard
                key={problem.problemId}
                icon="terminal"
                date={problem.category}
                title={problem.title}
                description={problem.statement?.substring(0, 120) + "..."}
                actions={<>
                  <Button variant="primary" size="sm" onClick={() => window.location.href = `/workspace?problem=${problem.problemId}`}><Icon name="play_arrow" size={14} />Review</Button>
                </>}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
