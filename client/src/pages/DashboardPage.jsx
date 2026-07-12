import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Icon from '../components/ui/Icon.jsx';
import { fetchStats, fetchRecentActivity, fetchCourses } from '../api/api.js';

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, icon, iconColor, children }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col justify-between gap-4">
      <div className="flex justify-between items-start">
        <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">{label}</span>
        <Icon name={icon} size={20} className={iconColor} />
      </div>
      {children}
    </div>
  );
}

function ProgressRow({ label, value, colorClass, percent }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-xs mb-1.5">
        <span className="text-on-surface">{label}</span>
        <span className={colorClass}>{value}</span>
      </div>
      <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')} transition-all duration-700`}
          style={{ width: percent }}
        />
      </div>
    </div>
  );
}

function ModuleCard({ icon, iconColor, title, description, progress, progressColor, status, badge, badgeVariant }) {
  const isLocked = status === 'locked';
  return (
    <article className={`bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary cursor-pointer group'}`}>
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 rounded-lg bg-surface-container-lowest border border-outline-variant flex items-center justify-center">
          <Icon name={icon} size={20} className={iconColor} />
        </div>
        <Badge variant={badgeVariant}>{badge}</Badge>
      </div>
      <div className="flex-1">
        <h4 className="font-sans text-base font-semibold text-on-surface mb-1">{title}</h4>
        <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
      </div>
      <div>
        <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden mb-2">
          <div className={`h-full rounded-full ${progressColor} transition-all duration-700`} style={{ width: progress }} />
        </div>
        <div className="flex justify-between items-center">
          {isLocked
            ? <span className="font-mono text-xs text-outline flex items-center gap-1"><Icon name="lock" size={14} />Locked</span>
            : <span className={`font-mono text-xs ${progressColor.replace('bg-', 'text-')}`}>{progress} Complete</span>
          }
          {!isLocked && (
            <button className="font-mono text-[10px] text-primary hover:text-primary-fixed uppercase tracking-wider transition-colors group-hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
              {progress === '100%' ? 'Review' : 'Resume'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function ActivityItem({ dotColor, timeLabel, timeColor, title, verdict, problemId }) {
  const verdictColors = {
    pass: 'text-secondary',
    fail: 'text-error',
    timeout: 'text-tertiary',
    compile_error: 'text-error',
    memory_exceeded: 'text-tertiary',
  };
  const verdictLabels = {
    pass: '✓ Passed',
    fail: '✗ Failed',
    timeout: '⏱ Timeout',
    compile_error: '✗ Compile Error',
    memory_exceeded: '✗ Memory Exceeded',
  };

  return (
    <div className="relative pl-7 pb-6 last:pb-0">
      <div className="absolute left-[5px] top-[14px] bottom-0 w-px bg-outline-variant/50 last:hidden" aria-hidden="true" />
      <div className={`absolute left-0 top-[3px] w-3 h-3 rounded-full border-2 border-surface-container-low ${dotColor}`} aria-hidden="true" />
      <div className={`font-mono text-xs ${timeColor} mb-0.5`}>{timeLabel}</div>
      <h5 className="text-on-surface text-sm font-semibold mb-1">{title}</h5>
      {verdict && (
        <span className={`font-mono text-xs ${verdictColors[verdict] || 'text-on-surface-variant'}`}>
          {verdictLabels[verdict] || verdict}
        </span>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="relative pl-7 pb-6">
      <div className="absolute left-0 top-[3px] w-3 h-3 rounded-full skeleton" />
      <div className="h-2 skeleton w-20 mb-1.5 rounded" />
      <div className="h-3 skeleton w-40 rounded" />
    </div>
  );
}

// ── Relative time helper ──────────────────────────────────────────────────────
function relativeTime(dateStr) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const verdictDot = { pass: 'bg-secondary', fail: 'bg-error', timeout: 'bg-tertiary', compile_error: 'bg-error', memory_exceeded: 'bg-tertiary' };
const verdictTimeColor = { pass: 'text-secondary', fail: 'text-error', timeout: 'text-tertiary', compile_error: 'text-error', memory_exceeded: 'text-tertiary' };

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useOutletContext() || {};
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, a, c] = await Promise.all([fetchStats(), fetchRecentActivity(8), fetchCourses()]);
        setStats(s);
        setActivity(a);
        setCourses(c);
      } catch {
        // If backend is down, show zeros
        setStats({ total: 0, passRate: 0, solved: 0, streak: 0, attempted: 0, avgTimeMs: 0, langCounts: {} });
        setActivity([]);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'there';

  return (
    <div className="page-enter space-y-8">
      {/* ── Page Header ── */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-sans text-[32px] md:text-[40px] font-bold text-on-surface leading-tight tracking-tight">
            Welcome back, {displayName}
          </h1>
          <p className="text-on-surface-variant text-base mt-1">Master core concepts through systematic exploration.</p>
        </div>
        <Link to="/workspace">
          <Button variant="primary">
            <Icon name="play_arrow" size={18} />
            Start Coding
          </Button>
        </Link>
      </header>

      {/* ── Email Verification Banner ── */}
      {user && user.emailVerified === false && (
        <div className="bg-warning/10 border border-warning/40 rounded-xl px-5 py-4 flex items-center gap-3">
          <Icon name="mail_outline" size={20} className="text-warning shrink-0" />
          <div className="flex-1">
            <p className="font-sans text-sm font-semibold text-warning">Email not verified</p>
            <p className="font-mono text-xs text-on-surface-variant mt-0.5">Check your inbox for the verification link. Some features may be limited until you verify.</p>
          </div>
          <Link to="/verify-email" className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 shrink-0">Resend</Link>
        </div>
      )}

      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden rounded-2xl border border-outline-variant" style={{ minHeight: '280px' }}>
        <div className="absolute inset-0 z-0 hero-gradient" aria-hidden="true" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary opacity-[0.06] rounded-full blur-[120px] hero-glow-orb" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary opacity-[0.05] rounded-full blur-[100px] hero-glow-orb" aria-hidden="true" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="auto_awesome" size={18} filled className="text-tertiary" />
              <span className="font-mono text-xs text-tertiary uppercase tracking-widest">Differential Learning Engine</span>
            </div>
            <h2 className="font-sans text-[28px] md:text-[36px] font-bold text-on-surface leading-tight tracking-tight mb-3">
              Learn code the way<br />AI <span className="text-primary">traces</span> it.
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-lg mb-6">
              Socratica compares your execution traces against oracle paths —
              detecting divergences, measuring convergence, and mentoring you through the gap.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Link to="/workspace">
                <Button variant="primary">
                  <Icon name="play_arrow" size={18} />
                  Start Tracing
                </Button>
              </Link>
              <Link to="/trajectory">
                <Button variant="secondary">
                  <Icon name="account_tree" size={16} />
                  View Trajectory
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats ring */}
          <div className="w-full md:w-auto shrink-0 flex items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="var(--surface-container-highest)" strokeWidth="2.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="var(--primary)"
                  strokeDasharray={`${stats ? stats.passRate : 0}, 100`}
                  strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {loading
                  ? <div className="h-8 w-12 skeleton rounded" />
                  : <span className="font-sans text-3xl font-bold text-on-surface leading-none">{stats?.passRate ?? 0}%</span>
                }
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">Pass Rate</span>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes heroGradient { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
          .hero-gradient { background:linear-gradient(-45deg,rgba(79,70,229,.08),rgba(186,206,153,.04),rgba(11,19,38,1),rgba(79,70,229,.05)); background-size:400% 400%; animation:heroGradient 12s ease infinite; }
          @keyframes orbFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-20px,10px) scale(.95)} }
          .hero-glow-orb { animation:orbFloat 8s ease-in-out infinite; }
        `}</style>
      </section>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Submissions', icon: 'send', color: 'text-primary', value: stats?.total ?? 0 },
          { label: 'Solved', icon: 'check_circle', color: 'text-secondary', value: stats?.solved ?? 0 },
          { label: 'Attempted', icon: 'pending', color: 'text-tertiary', value: stats?.attempted ?? 0 },
          { label: 'Day Streak', icon: 'local_fire_department', color: 'text-tertiary', value: stats?.streak ?? 0 },
        ].map(({ label, icon, color, value }) => (
          <div key={label} className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{label}</span>
              <Icon name={icon} size={18} className={color} />
            </div>
            {loading
              ? <div className="h-8 w-16 skeleton rounded" />
              : <span className="font-sans text-3xl font-bold text-on-surface">{value}</span>
            }
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Modules */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="font-sans text-2xl font-semibold text-on-surface">Core Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loading ? (
              <div className="text-on-surface-variant text-sm">Loading modules...</div>
            ) : courses.length === 0 ? (
              <div className="text-on-surface-variant text-sm">No courses found.</div>
            ) : (
              courses[0]?.modules?.slice(0, 4).map(mod => (
                <ModuleCard
                  key={mod._id}
                  icon="code" 
                  iconColor={mod.status === 'locked' ? 'text-outline' : 'text-primary'}
                  title={mod.title}
                  description={mod.description}
                  progress={mod.progress}
                  progressColor={mod.progress === '100%' ? "bg-secondary" : mod.progress === '0%' ? "bg-outline" : "bg-primary"}
                  badge={mod.status === 'locked' ? 'Locked' : mod.progress === '100%' ? 'Mastered' : 'Active'}
                  badgeVariant={mod.status === 'locked' ? 'error' : mod.progress === '100%' ? 'secondary' : 'primary'}
                  status={mod.status}
                />
              ))
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-4">
          <h2 className="font-sans text-2xl font-semibold text-on-surface">Recent Activity</h2>
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : activity.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="code" size={32} className="text-outline mx-auto mb-3" />
                <p className="text-on-surface-variant text-sm">No submissions yet.</p>
                <p className="font-mono text-xs text-outline mt-1">Solve your first problem to see activity here.</p>
                <Link to="/workspace" className="inline-block mt-4">
                  <Button variant="primary" size="sm">
                    <Icon name="play_arrow" size={14} />
                    Start Now
                  </Button>
                </Link>
              </div>
            ) : (
              activity.map((sub) => (
                <ActivityItem
                  key={sub._id}
                  dotColor={verdictDot[sub.verdict] || 'bg-outline'}
                  timeLabel={relativeTime(sub.createdAt)}
                  timeColor={verdictTimeColor[sub.verdict] || 'text-on-surface-variant'}
                  title={sub.problemTitle || sub.problemId}
                  verdict={sub.verdict}
                  problemId={sub.problemId}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
