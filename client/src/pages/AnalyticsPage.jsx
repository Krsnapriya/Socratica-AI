import { useState, useEffect } from 'react';
import Icon from '../components/ui/Icon.jsx';
import { fetchStats, fetchRecentActivity } from '../api/api.js';

// ── SVG Radar Chart ────────────────────────────────────────────────────────────
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

  // Grid polygons
  const gridPolygons = Array.from({ length: levels }).map((_, lvl) => {
    const rad = (r * (lvl + 1)) / levels;
    const pts = data.map((_, i) => {
      const p = polarToCartesian(i * angleStep, rad);
      return `${p.x},${p.y}`;
    });
    return pts.join(' ');
  });

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const p = polarToCartesian(i * angleStep, r * (d.value / 100));
    return `${p.x},${p.y}`;
  });

  // Axis lines & labels
  const axes = data.map((d, i) => {
    const inner = polarToCartesian(i * angleStep, 0);
    const outer = polarToCartesian(i * angleStep, r + 16);
    const label = polarToCartesian(i * angleStep, r + 28);
    return { inner, outer, label, name: d.name, value: d.value };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px] mx-auto" aria-label="Skill radar chart">
      {/* Grid */}
      {gridPolygons.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="var(--outline-variant)"
          strokeWidth="0.8"
          opacity={0.6}
        />
      ))}

      {/* Axes */}
      {axes.map((ax, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={ax.outer.x} y2={ax.outer.y}
          stroke="var(--outline-variant)"
          strokeWidth="0.8"
          opacity={0.5}
        />
      ))}

      {/* Data fill */}
      <polygon
        points={dataPoints.join(' ')}
        fill="var(--primary)"
        fillOpacity="0.15"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {data.map((d, i) => {
        const p = polarToCartesian(i * angleStep, r * (d.value / 100));
        return (
          <circle key={i} cx={p.x} cy={p.y} r="4"
            fill="var(--primary)" stroke="var(--surface-container-low)" strokeWidth="2" />
        );
      })}

      {/* Labels */}
      {axes.map((ax, i) => (
        <text
          key={i}
          x={ax.label.x}
          y={ax.label.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
          fill="var(--on-surface-variant)"
          style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
        >
          {ax.name}
        </text>
      ))}
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
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
            <Icon name="trending_up" size={16} />
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, a] = await Promise.all([fetchStats(), fetchRecentActivity(20)]);
        setStats(s && typeof s === 'object' && !Array.isArray(s) ? s : { total: 0, passRate: 0, solved: 0, streak: 0, attempted: 0, avgTimeMs: 0, langCounts: {} });
        setActivity(Array.isArray(a) ? a : []);
      } catch {
        setStats({ total: 0, passRate: 0, solved: 0, streak: 0, attempted: 0, avgTimeMs: 0, langCounts: {} });
        setActivity([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Build radar data from stats
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

  // Milestones from activity
  const milestones = activity.filter(s => s.verdict === 'pass').slice(0, 5);
  const verdictDot = { pass: 'bg-secondary', fail: 'bg-error', timeout: 'bg-tertiary', compile_error: 'bg-error' };

  return (
    <div className="page-enter space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-col gap-1">
        <h1 className="font-sans text-[32px] md:text-[40px] font-bold text-on-surface tracking-tight">Performance Analytics</h1>
        <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
          Real-time cognitive growth metrics
        </p>
      </header>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KPICard
          label="Total Submissions"
          icon="send"
          iconColor="text-primary"
          value={stats?.total ?? 0}
          subLabel={stats?.total ? `${stats.passRate}% pass rate` : 'No submissions yet'}
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

      {/* ── Radar + Milestones ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Radar Chart */}
        <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-sans text-xl font-semibold text-on-surface">Skill Breakdown</h2>
            <span className="font-mono text-xs text-on-surface-variant px-2 py-1 rounded border border-outline-variant">
              Based on {stats?.total || 0} submissions
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="h-40 w-40 skeleton rounded-full" />
            </div>
          ) : stats?.total === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-64 gap-3">
              <Icon name="insights" size={40} className="text-outline" />
              <p className="text-on-surface-variant text-sm">Submit code to see your skill breakdown.</p>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-64">
              <RadarChart data={radarData} />
            </div>
          )}

          {/* Language distribution bar */}
          {stats?.total > 0 && !loading && (
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-outline-variant/50">
              {[
                { lang: 'Python', key: 'python', color: 'bg-primary' },
                { lang: 'JavaScript', key: 'javascript', color: 'bg-secondary' },
                { lang: 'C++', key: 'cpp', color: 'bg-tertiary' },
              ].map(({ lang, key, color }) => {
                const count = langCounts[key] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between font-mono text-[10px] text-on-surface-variant mb-1 uppercase tracking-wider">
                      <span>{lang}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%`, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Milestones */}
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
                <p className="text-on-surface-variant text-sm">No passing submissions yet.</p>
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

      {/* ── Complexity Heatmap ── */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-sans text-xl font-semibold text-on-surface">Submission History Heatmap</h2>
          <span className="font-mono text-xs text-on-surface-variant">Last 24 sessions</span>
        </div>
        <div className="h-48 bg-surface-container-lowest rounded-xl border border-outline-variant/50 relative overflow-hidden">
          <div className="absolute inset-0 p-4 flex flex-col">
            <div className="flex-1 flex gap-2">
              <div className="flex items-center justify-center w-4">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase -rotate-90 whitespace-nowrap tracking-wider">Complexity</span>
              </div>
              <div className="flex-1 grid grid-cols-[repeat(24,1fr)] grid-rows-[repeat(6,1fr)] gap-px" role="img" aria-label="Submission heatmap">
                {Array.from({ length: 144 }).map((_, i) => {
                  const heatmapData = stats?.heatmap || [];
                  // If we have less than 144 items, we align them to the end (most recent at bottom-right)
                  const offset = 144 - heatmapData.length;
                  const dataIndex = i - offset;
                  
                  let verdict = null;
                  if (dataIndex >= 0 && dataIndex < heatmapData.length) {
                    verdict = heatmapData[dataIndex];
                  }

                  const isPass = verdict === 'pass';
                  const isFail = verdict && verdict !== 'pass';
                  
                  // Empty state for cells without data
                  const op = loading ? 5 : isPass ? 80 : isFail ? 40 : 5;
                  const color = isPass ? 'var(--secondary)' : isFail ? 'var(--error)' : 'var(--outline-variant)';
                  
                  return (
                    <div key={i} className="rounded-[1px]" style={{ background: `${color}`, opacity: op / 100 }} />
                  );
                })}
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center pl-6">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Sessions</span>
              <div className="flex items-center gap-3 font-mono text-[10px] text-on-surface-variant">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--secondary)' }} />Pass</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--error)' }} />Fail</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
