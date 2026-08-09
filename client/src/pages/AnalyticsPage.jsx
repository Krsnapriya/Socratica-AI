import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import { fetchStats, fetchRecentActivity, fetchNextRecommendation } from '../api/api.js';
import TrajectoryViewer from '../components/TrajectoryViewer.jsx';

function RadarChart({ data }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;
  const levels = 4;
  const n = data.length;

  function polarToCartesian(angle, radius) {
    const rad = (Math.PI / 180) * (angle - 90);
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  const angleStep = 360 / n;

  const gridPolygons = Array.from({ length: levels }).map((_, lvl) => {
    const rad = (r * (lvl + 1)) / levels;
    const pts = data.map((_, i) => {
      const p = polarToCartesian(i * angleStep, rad);
      return `${p.x},${p.y}`;
    });
    return pts.join(' ');
  });

  const dataPoints = data.map((d, i) => {
    const p = polarToCartesian(i * angleStep, r * (d.value / 100));
    return `${p.x},${p.y}`;
  });

  const axes = data.map((d, i) => {
    const inner = polarToCartesian(i * angleStep, 0);
    const outer = polarToCartesian(i * angleStep, r + 16);
    const label = polarToCartesian(i * angleStep, r + 28);
    return { inner, outer, label, name: d.name, value: d.value };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px] mx-auto" aria-label="Skill radar chart">
      {gridPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="var(--outline-variant)" strokeWidth="0.8" opacity={0.6} />
      ))}
      {axes.map((ax, i) => (
        <line key={i} x1={cx} y1={cy} x2={ax.outer.x} y2={ax.outer.y} stroke="var(--outline-variant)" strokeWidth="0.8" opacity={0.5} />
      ))}
      <polygon points={dataPoints.join(' ')} fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => {
        const p = polarToCartesian(i * angleStep, r * (d.value / 100));
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--primary)" stroke="var(--surface-container-low)" strokeWidth="2" />;
      })}
      {axes.map((ax, i) => (
        <text key={i} x={ax.label.x} y={ax.label.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontFamily="JetBrains Mono, monospace" fill="var(--on-surface-variant)" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {ax.name}
        </text>
      ))}
    </svg>
  );
}

function KPICard({ label, icon, iconColor, value, subLabel, subColor, loading }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">{label}</span>
        <Icon name={icon} size={20} className={iconColor} />
      </div>
      <div>
        {loading
          ? <div className="h-10 w-20 skeleton rounded" />
          : <span className="font-sans text-4xl font-bold text-on-surface block leading-none">{value}</span>
        }
        {subLabel && (
          <span className={`text-sm mt-2 flex items-center gap-1 ${subColor}`}>
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function MilestoneItem({ dotColor, time, title, meta }) {
  return (
    <div className="relative pl-7 pb-5 last:pb-0">
      <div className="absolute left-[5px] top-[14px] bottom-0 w-px bg-outline-variant/50 last:hidden" aria-hidden="true" />
      <div className={`absolute left-0 top-[3px] w-3 h-3 rounded-full border-2 border-surface-container-low ${dotColor}`} aria-hidden="true" />
      <span className="font-mono text-xs text-on-surface-variant block mb-0.5">{time}</span>
      <h4 className="text-on-surface text-sm font-semibold mb-0.5">{title}</h4>
      {meta && <p className="font-mono text-xs text-on-surface-variant opacity-80">{meta}</p>}
    </div>
  );
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, a, rec] = await Promise.allSettled([fetchStats(), fetchRecentActivity(20), fetchNextRecommendation()]);
        setStats(s.status === 'fulfilled' && s.value && typeof s.value === 'object' && !Array.isArray(s.value) ? s.value : { total: 0, passRate: 0, solved: 0, streak: 0, attempted: 0, avgTimeMs: 0, langCounts: {} });
        setActivity(a.status === 'fulfilled' && Array.isArray(a.value) ? a.value : []);
        setRecommendation(rec.status === 'fulfilled' && rec.value?.recommendation ? rec.value.recommendation : null);
      } catch {
        setStats({ total: 0, passRate: 0, solved: 0, streak: 0, attempted: 0, avgTimeMs: 0, langCounts: {} });
        setActivity([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const langCounts = stats?.langCounts || {};
  const total = Math.max(stats?.total || 1, 1);
  const radarData = [
    { name: 'Python', value: Math.min(100, Math.round(((langCounts.python || 0) / total) * 100)) },
    { name: 'JS', value: Math.min(100, Math.round(((langCounts.javascript || 0) / total) * 100)) },
    { name: 'C++', value: Math.min(100, Math.round(((langCounts.cpp || 0) / total) * 100)) },
    { name: 'Pass Rate', value: stats?.passRate || 0 },
    { name: 'Streak', value: Math.min(100, (stats?.streak || 0) * 10) },
    { name: 'Solved', value: Math.min(100, (stats?.solved || 0) * 20) },
  ];

  const milestones = activity.filter(s => s.verdict === 'pass').slice(0, 5);
  const verdictDot = { pass: 'bg-secondary', fail: 'bg-error', timeout: 'bg-tertiary', compile_error: 'bg-error' };

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">Dashboard</span>
            <Icon name="chevron_right" size={14} />
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface">Analytics</span>
          </div>
          <h1 className="font-sans text-[32px] md:text-[40px] font-bold text-on-surface tracking-tight">Analytics</h1>
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest mt-1">
            Track your coding progress and performance
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KPICard
          label="Total Submissions"
          icon="send"
          iconColor="text-primary"
          value={stats?.total ?? 0}
          subLabel={stats?.total ? `${stats.passRate}% pass rate` : 'Submit code to get started'}
          subColor="text-secondary"
          loading={loading}
        />
        <KPICard
          label="Problems Solved"
          icon="check_circle"
          iconColor="text-secondary"
          value={stats?.solved ?? 0}
          subLabel={stats?.attempted ? `of ${stats.attempted} attempted` : 'Start solving'}
          subColor="text-secondary"
          loading={loading}
        />
        <KPICard
          label="Avg Runtime"
          icon="speed"
          iconColor="text-tertiary"
          value={stats?.avgTimeMs ? `${stats.avgTimeMs}ms` : '—'}
          subLabel="On passing submissions"
          subColor="text-tertiary"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-sans text-xl font-semibold text-on-surface">Language Distribution</h2>
              <p className="font-mono text-[10px] text-on-surface-variant mt-1">Breakdown of submissions by programming language</p>
            </div>
            <span className="font-mono text-xs text-on-surface-variant px-2 py-1 rounded border border-outline-variant">
              {stats?.total || 0} submissions
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="h-40 w-40 skeleton rounded-full" />
            </div>
          ) : stats?.total === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-64 gap-3">
              <Icon name="insights" size={40} className="text-outline" />
              <p className="text-on-surface-variant text-sm">Submit code to see your language breakdown.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/workspace')}>
                <Icon name="play_arrow" size={14} />
                Start Coding
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-64">
              <RadarChart data={radarData} />
            </div>
          )}

          {stats?.total > 0 && !loading && (
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-outline-variant/50">
              {[
                { lang: 'Python', key: 'python', color: 'bg-primary', icon: 'terminal' },
                { lang: 'JavaScript', key: 'javascript', color: 'bg-secondary', icon: 'code' },
                { lang: 'C++', key: 'cpp', color: 'bg-tertiary', icon: 'memory' },
              ].map(({ lang, key, color, icon }) => {
                const count = langCounts[key] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={key} className="bg-surface-container rounded-lg p-3 border border-outline-variant/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name={icon} size={14} className="text-on-surface-variant" />
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{lang}</span>
                    </div>
                    <div className="font-sans text-2xl font-bold text-on-surface mb-1">{count}</div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%`, transition: 'width 1s ease' }} />
                    </div>
                    <div className="font-mono text-[10px] text-on-surface-variant mt-1">{pct}% of submissions</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col">
          <h2 className="font-sans text-xl font-semibold text-on-surface mb-5 flex items-center gap-2">
            <Icon name="flag" size={20} className="text-primary" />
            Recent Passes
          </h2>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loading ? (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="relative pl-7 pb-5">
                    <div className="absolute left-0 top-[3px] w-3 h-3 rounded-full skeleton" />
                    <div className="h-2 skeleton w-16 mb-1 rounded" />
                    <div className="h-3 skeleton w-32 rounded" />
                  </div>
                ))}
              </>
            ) : milestones.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="flag" size={32} className="text-outline mx-auto mb-2" />
                <p className="text-on-surface-variant text-sm mb-2">No passing submissions yet.</p>
                <p className="font-mono text-[10px] text-outline">Keep practicing to see your progress here.</p>
              </div>
            ) : (
              milestones.map((sub) => (
                <MilestoneItem
                  key={sub._id}
                  dotColor={verdictDot[sub.verdict] || 'bg-outline'}
                  time={relativeTime(sub.createdAt)}
                  title={sub.problemTitle || sub.problemId}
                  meta={`${sub.language.toUpperCase()} · ${sub.tier2Result?.studentTimeMs || 0}ms`}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="font-sans text-xl font-semibold text-on-surface">Submission History</h2>
            <p className="font-mono text-[10px] text-on-surface-variant mt-1">Your recent submissions with pass/fail status</p>
          </div>
          {!loading && activity.length > 0 && (
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span className="font-mono text-[10px] text-on-surface-variant">Passed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error" />
                <span className="font-mono text-[10px] text-on-surface-variant">Failed</span>
              </div>
            </div>
          )}
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 skeleton rounded" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="history" size={32} className="text-outline mx-auto mb-2" />
            <p className="text-on-surface-variant text-sm">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activity.slice(0, 10).map((sub) => (
              <div key={sub._id} className={`flex items-center gap-3 p-3 rounded-lg border ${sub.verdict === 'pass' ? 'border-secondary/30 bg-secondary/5' : 'border-error/30 bg-error/5'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${sub.verdict === 'pass' ? 'bg-secondary text-white' : 'bg-error text-white'}`}>
                  <Icon name={sub.verdict === 'pass' ? 'check' : 'close'} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-sm font-semibold text-on-surface truncate">{sub.problemTitle || sub.problemId}</div>
                  <div className="font-mono text-[10px] text-on-surface-variant">{relativeTime(sub.createdAt)} · {sub.language?.toUpperCase()}</div>
                </div>
                <span className={`font-mono text-xs font-bold ${sub.verdict === 'pass' ? 'text-secondary' : 'text-error'}`}>
                  {sub.verdict === 'pass' ? 'Passed' : sub.verdict === 'timeout' ? 'Timeout' : sub.verdict === 'compile_error' ? 'Compile Error' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {!loading && stats && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="lightbulb" size={16} className="text-primary" />
            <h3 className="font-sans text-sm font-semibold text-on-surface">Recommendations</h3>
          </div>
          <div className="space-y-2">
            {stats.total === 0 && (
              <p className="text-on-surface-variant text-xs font-mono">Start by solving your first problem in the Workspace.</p>
            )}
            {stats.total > 0 && stats.passRate < 50 && (
              <p className="text-on-surface-variant text-xs font-mono">Your pass rate is {stats.passRate}%. Review trajectory hints to understand common patterns.</p>
            )}
            {stats.passRate >= 50 && stats.solved < 10 && (
              <p className="text-on-surface-variant text-xs font-mono">Great start! Keep solving to build momentum. Try harder difficulty problems.</p>
            )}
            {stats.solved >= 10 && (
              <p className="text-on-surface-variant text-xs font-mono">Excellent progress! Consider exploring different language solutions.</p>
            )}
          </div>
        </div>
      )}

      {/* Recommended Next */}
      {!loading && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="lightbulb" size={16} className="text-primary" />
            <h3 className="font-sans text-sm font-semibold text-on-surface">Recommended Next</h3>
          </div>
          {recommendation ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border uppercase ${recommendation.difficulty === 'easy' ? 'text-green-500 border-green-500/30' : recommendation.difficulty === 'medium' ? 'text-yellow-500 border-yellow-500/30' : 'text-red-500 border-red-500/30'}`}>{recommendation.difficulty}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{recommendation.moduleTitle}</span>
                </div>
                <p className="font-sans text-lg font-semibold text-on-surface truncate mt-1">{recommendation.title}</p>
                {recommendation.reason && (
                  <p className="font-mono text-[11px] text-on-surface-variant mt-1.5 leading-snug">{recommendation.reason}</p>
                )}
                {recommendation.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {recommendation.tags.map(tag => (
                      <span key={tag} className="font-mono text-[9px] px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <Link to={`/workspace?problem=${recommendation.problemId}`}>
                <Button variant="primary" size="sm">
                  <Icon name="play_arrow" size={14} />
                  Solve Next
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-on-surface-variant">
              <Icon name="task_alt" size={24} className="text-secondary" />
              <p className="text-sm">You've solved everything in the curriculum — amazing! Explore new problems or review your trajectory below.</p>
            </div>
          )}
        </div>
      )}

      {/* Session Trajectory (merged) */}
      <TrajectoryViewer />

      {/* Export */}
      {!loading && stats && (
        <div className="flex justify-end">
          <button onClick={() => {
            const data = { total: stats.total, solved: stats.solved, passRate: stats.passRate, streak: stats.streak, exportedAt: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'analytics-export.json'; a.click();
            URL.revokeObjectURL(url);
          }} className="font-mono text-xs text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors">
            <Icon name="download" size={14} /> Export Data
          </button>
        </div>
      )}
    </div>
  );
}
