import Icon from './Icon.jsx';

// ── Verdict configuration ─────────────────────────────────────────────────────
const VERDICT_CONFIG = {
  pass: {
    label: 'Passed',
    icon: 'check_circle',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
    description: 'All test cases passed!',
  },
  fail: {
    label: 'Wrong Answer',
    icon: 'cancel',
    color: 'text-error',
    bg: 'bg-error/10',
    border: 'border-error/30',
    description: 'Some test cases did not pass.',
  },
  timeout: {
    label: 'Time Limit Exceeded',
    icon: 'timer_off',
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
    border: 'border-tertiary/30',
    description: 'Your solution took too long to execute.',
  },
  compile_error: {
    label: 'Compile Error',
    icon: 'code_off',
    color: 'text-error',
    bg: 'bg-error/10',
    border: 'border-error/30',
    description: 'Your code could not be compiled.',
  },
  memory_exceeded: {
    label: 'Memory Limit Exceeded',
    icon: 'memory',
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
    border: 'border-tertiary/30',
    description: 'Your solution exceeded the memory limit.',
  },
  recursion_limit_exceeded: {
    label: 'Recursion Limit Exceeded',
    icon: 'all_inclusive',
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
    border: 'border-tertiary/30',
    description: 'Maximum recursion depth was exceeded. Check for infinite recursion.',
  },
  system_judge_error: {
    label: 'Judge Error',
    icon: 'report_problem',
    color: 'text-on-surface-variant',
    bg: 'bg-surface-container',
    border: 'border-outline-variant',
    description: 'The sandbox encountered an infrastructure failure. This is not your fault — please retry.',
  },
};

// Fallback for unknown/future verdicts
const FALLBACK_CONFIG = {
  label: 'Unknown',
  icon: 'help_outline',
  color: 'text-on-surface-variant',
  bg: 'bg-surface-container',
  border: 'border-outline-variant',
  description: 'An unexpected verdict was returned.',
};

// ── Performance comparison bar ────────────────────────────────────────────────
function PerfBar({ label, value, unit, maxValue }) {
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{label}</span>
        <span className="font-mono text-xs font-bold text-on-surface">{value} {unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-container-lowest overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/60 transition-all duration-700"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={maxValue}
        />
      </div>
    </div>
  );
}

const AGENT_LABELS = {
  compilerError: { label: 'Compiler Agent', icon: 'code_off', color: 'text-error' },
  runtimeError: { label: 'Runtime Agent', icon: 'bug_report', color: 'text-tertiary' },
  wrongAnswer: { label: 'Analysis Agent', icon: 'analytics', color: 'text-error' },
  correctAnswer: { label: 'Review Agent', icon: 'check_circle', color: 'text-secondary' },
  hint: { label: 'Mentor Agent', icon: 'lightbulb', color: 'text-primary' },
  codeReview: { label: 'Review Agent', icon: 'rate_review', color: 'text-secondary' },
  learningSummary: { label: 'Summary Agent', icon: 'school', color: 'text-tertiary' },
};

function ConfidenceBar({ label, score, color }) {
  const pct = Math.round((score ?? 0) * 100);
  const barColor = pct >= 70 ? 'bg-secondary/70' : pct >= 40 ? 'bg-tertiary/70' : 'bg-error/70';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{label}</span>
        <span className="font-mono text-[10px] font-bold text-on-surface">{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-surface-container-lowest overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function HintLevelBadge({ level }) {
  if (level == null) return null;
  const labels = ['Conceptual', 'Algorithm', 'Specific', 'Pseudocode', 'Detailed'];
  const label = labels[level - 1] || `Level ${level}`;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-mono text-[9px] uppercase tracking-wider">
      <Icon name="auto_awesome" size={10} />
      Level {level}: {label}
    </span>
  );
}

function OracleComparisonPanel({ comparison }) {
  if (!comparison) return null;
  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon name="compare_arrows" size={13} className="text-primary" />
        <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-bold">Approach Comparison</span>
      </div>
      {comparison.studentStrategy && (
        <div className="font-mono text-[11px]">
          <span className="text-on-surface-variant">Your approach: </span>
          <span className="text-on-surface font-semibold">{comparison.studentStrategy}</span>
        </div>
      )}
      {comparison.goldStrategy && (
        <div className="font-mono text-[11px]">
          <span className="text-on-surface-variant">Gold approach: </span>
          <span className="text-on-surface font-semibold">{comparison.goldStrategy}</span>
        </div>
      )}
      {comparison.feedback && (
        <p className="text-on-surface-variant text-[11px] leading-relaxed font-mono whitespace-pre-wrap">{comparison.feedback}</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VerdictDisplay({ verdict, hint, tier2Result, error, aiAnalysis, hintLevel }) {
  // Network / pre-verdict error
  if (error && !verdict) {
    return (
      <div className="bg-error/10 border border-error/30 text-error rounded-xl p-4" role="alert">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="error_outline" size={20} />
          <span className="font-mono text-xs font-bold uppercase">Submission Error</span>
        </div>
        <pre className="font-mono text-xs whitespace-pre-wrap overflow-x-auto">{error}</pre>
      </div>
    );
  }

  const config = VERDICT_CONFIG[verdict] ?? FALLBACK_CONFIG;

  // Compute max values for perf bars
  const maxTime = Math.max(tier2Result?.studentTimeMs ?? 0, tier2Result?.oracleTimeMs ?? 0, 1);
  const maxMem  = Math.max(tier2Result?.studentMemMb  ?? 0, tier2Result?.oracleMemMb  ?? 0, 1);

  // Only show perf panel for verdicts where it's meaningful
  const showPerf =
    tier2Result &&
    !['compile_error', 'system_judge_error', 'recursion_limit_exceeded'].includes(verdict);

  return (
    <div
      className={`rounded-xl p-4 border ${config.bg} ${config.border}`}
      role="status"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${config.border} border`}>
          <Icon name={config.icon} size={22} className={config.color} />
        </div>
        <div>
          <div className={`font-sans text-lg font-bold ${config.color}`}>{config.label}</div>
          <div className="font-mono text-xs text-on-surface-variant">{config.description}</div>
        </div>
      </div>

      {/* Performance panel */}
      {showPerf && (
        <div className="grid grid-cols-1 gap-3 mb-4 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/50">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <PerfBar label="Your Time"    value={tier2Result.studentTimeMs} unit="ms" maxValue={maxTime} />
            <PerfBar label="Oracle Time"  value={tier2Result.oracleTimeMs}  unit="ms" maxValue={maxTime} />
            <PerfBar label="Your Memory"  value={tier2Result.studentMemMb}  unit="MB" maxValue={maxMem}  />
            <PerfBar label="Oracle Memory" value={tier2Result.oracleMemMb}  unit="MB" maxValue={maxMem}  />
          </div>
          {/* Efficiency badge */}
          {verdict === 'pass' && tier2Result.studentTimeMs > 0 && tier2Result.oracleTimeMs > 0 && (
            <div className="text-center pt-1">
              <span className="font-mono text-[10px] text-on-surface-variant">
                Your solution ran at{' '}
                <strong className="text-on-surface">
                  {Math.round((tier2Result.oracleTimeMs / tier2Result.studentTimeMs) * 100)}%
                </strong>{' '}
                of oracle speed
              </span>
            </div>
          )}
        </div>
      )}

      {/* AI Mentor Hint */}
      {hint && (
        <div className="bg-surface-container border border-primary/25 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl" aria-hidden="true" />
          <div className="pl-2 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {aiAnalysis?.agent && AGENT_LABELS[aiAnalysis.agent] && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest border border-outline-variant/50 font-mono text-[9px] uppercase tracking-wider font-bold ${AGENT_LABELS[aiAnalysis.agent].color}`}>
                  <Icon name={AGENT_LABELS[aiAnalysis.agent].icon} size={10} />
                  {AGENT_LABELS[aiAnalysis.agent].label}
                </span>
              )}
              <HintLevelBadge level={hintLevel} />
            </div>
            <p className="text-on-surface-variant text-xs leading-relaxed font-mono whitespace-pre-wrap">
              {hint}
            </p>
            {aiAnalysis?.confidence && (
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-outline-variant/30">
                <ConfidenceBar label="Syntax" score={aiAnalysis.confidence.syntax} />
                <ConfidenceBar label="Logic" score={aiAnalysis.confidence.logic} />
                <ConfidenceBar label="Optimization" score={aiAnalysis.confidence.optimization} />
              </div>
            )}
            {aiAnalysis?.oracleComparison && (
              <OracleComparisonPanel comparison={aiAnalysis.oracleComparison} />
            )}
          </div>
        </div>
      )}

      {/* No hint callout — only for actionable failure verdicts */}
      {!hint && !['pass', 'system_judge_error'].includes(verdict) && (
        <div className="text-center py-2">
          <span className="font-mono text-xs text-on-surface-variant">
            No AI hint available for this submission.
          </span>
        </div>
      )}
    </div>
  );
}