import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import Icon from './ui/Icon.jsx';
import Button from './ui/Button.jsx';
import { fetchSessionAnalysis } from '../api/api.js';

const VERDICT_META = {
  pass: { icon: 'check_circle', color: 'text-secondary', label: 'Pass' },
  fail: { icon: 'cancel', color: 'text-error', label: 'Wrong Answer' },
  timeout: { icon: 'timer_off', color: 'text-tertiary', label: 'TLE' },
  compile_error: { icon: 'code_off', color: 'text-error', label: 'Compile Error' },
  memory_exceeded: { icon: 'memory', color: 'text-tertiary', label: 'MLE' },
  recursion_limit_exceeded: { icon: 'all_inclusive', color: 'text-tertiary', label: 'Recursion Limit' },
  system_judge_error: { icon: 'report_problem', color: 'text-on-surface-variant', label: 'Judge Error' },
};

const LANG_MAP = { python: 'python', javascript: 'javascript', cpp: 'cpp' };

function CodeBlock({ code, language, title, highlightLines = [] }) {
  const lines = (code || '').split('\n');
  return (
    <div className="rounded-xl border border-outline-variant/40 overflow-hidden bg-surface-container-lowest">
      {title && (
        <div className="px-3 py-2 border-b border-outline-variant/30 flex items-center gap-2">
          <Icon name="code" size={13} className="text-primary" />
          <span className="font-mono text-[10px] text-on-surface font-bold uppercase tracking-wider">{title}</span>
        </div>
      )}
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin">
        <pre className="p-0 m-0">
          {lines.map((line, i) => {
            const isHighlighted = highlightLines.includes(i + 1);
            return (
              <div
                key={i}
                className={`flex font-mono text-[11px] leading-5 ${
                  isHighlighted ? 'bg-error/10 border-l-2 border-error' : ''
                }`}
              >
                <span className="inline-block w-8 text-right pr-2 text-outline select-none shrink-0 border-r border-outline-variant/20">
                  {i + 1}
                </span>
                <span className="pl-3 pr-4 whitespace-pre text-on-surface-variant">
                  {line || ' '}
                </span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

function DivergenceSection({ round, oracleCode, language }) {
  const oracleLines = (oracleCode || '').split('\n');
  const studentLines = (round.code || '').split('\n');
  const divStep = round.divergenceStep;

  let explanation = '';
  if (divStep != null && round.tier === 1) {
    explanation = `Your code diverged from the expected behavior at step ${divStep}. The trace shows your program's state at this point differs from the oracle — likely an incorrect calculation, missing update, or wrong branch taken.`;
  } else if (round.verdict === 'timeout') {
    explanation = `Your solution exceeded the time limit. This typically indicates an inefficient algorithm (e.g., O(2^n) recursion without memoization, or O(n^2) when O(n) is possible). Consider the time complexity of your approach.`;
  } else if (round.verdict === 'compile_error') {
    explanation = `Your code failed to compile. Check for syntax errors, missing semicolons, unmatched brackets, or type mismatches.`;
  } else {
    explanation = `Your output didn't match the expected result. Compare your solution with the oracle to identify the logical difference.`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/8 border border-primary/20">
        <Icon name="account_tree" size={16} className="text-primary mt-0.5 shrink-0" />
        <div>
          <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider">Divergence Analysis</span>
          <p className="text-on-surface-variant text-xs leading-relaxed mt-1">{explanation}</p>
        </div>
      </div>

      {divStep != null && round.tier === 1 && round.traceLog?.snapshots?.length > 0 && (
        <div className="space-y-2">
          <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
            State at divergence (step {divStep})
          </span>
          <div className="grid grid-cols-2 gap-2">
            {round.traceLog.snapshots
              .filter(s => s.step <= divStep + 2)
              .slice(-4)
              .map((snap, i) => (
                <div key={i} className="p-2 rounded-lg bg-surface-container-highest border border-outline-variant/30">
                  <span className="font-mono text-[9px] text-outline">Step {snap.step}</span>
                  {snap.locals && Object.keys(snap.locals).length > 0 && (
                    <div className="mt-1">
                      {Object.entries(snap.locals).slice(0, 5).map(([k, v]) => (
                        <div key={k} className="font-mono text-[10px]">
                          <span className="text-primary">{k}</span>
                          <span className="text-outline"> = </span>
                          <span className="text-on-surface">{JSON.stringify(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionAnalysis({ sessionId, onStartNewSession }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRound, setActiveRound] = useState(0);
  const [view, setView] = useState('overview');

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetchSessionAnalysis(sessionId)
      .then(d => {
        setData(d);
        if (d.bestAttempt) setActiveRound(d.bestAttempt.round - 1);
      })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
        <span className="font-mono text-xs text-on-surface-variant">Analyzing session…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <Icon name="error_outline" size={24} className="text-error" />
        <span className="font-mono text-xs text-on-surface-variant">{error}</span>
        <Button variant="secondary" size="sm" onClick={onStartNewSession}>New Session</Button>
      </div>
    );
  }

  if (!data) return null;

  const lang = data.language;
  const oracleFunctionCode = extractFunction(data.oracleCode, lang);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b" style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Icon name="analytics" size={16} className="text-primary" />
          <span className="font-mono text-xs text-primary font-bold uppercase tracking-wider">Session Analysis</span>
          {data.hasPass && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-mono text-[9px] font-bold border border-secondary/30">PASSED</span>
          )}
        </div>
        <p className="font-mono text-[10px] text-on-surface-variant">
          {data.title} · {data.language} · {data.totalRounds} rounds
        </p>
      </div>

      {/* View tabs */}
      <div className="shrink-0 flex border-b" style={{ borderColor: 'var(--outline-variant)' }}>
        {[
          { id: 'overview', label: 'Overview', icon: 'summarize' },
          { id: 'compare', label: 'Compare', icon: 'compare_arrows' },
          { id: 'oracle', label: 'Oracle', icon: 'school' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex-1 h-9 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-colors border-b-2 ${
              view === t.id ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'
            }`}
          >
            <Icon name={t.icon} size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {view === 'overview' && (
          <>
            {/* Attempts timeline */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Attempts</span>
              <div className="grid grid-cols-5 gap-1.5">
                {data.rounds.map((r, i) => {
                  const meta = VERDICT_META[r.verdict] || VERDICT_META.fail;
                  return (
                    <button
                      key={r.round}
                      onClick={() => { setActiveRound(i); setView('compare'); }}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        i === activeRound
                          ? 'border-primary bg-primary/10'
                          : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <Icon name={meta.icon} size={14} className={meta.color} />
                      <div className="font-mono text-[9px] text-on-surface-variant mt-1">R{r.round}</div>
                      <div className={`font-mono text-[9px] font-bold ${meta.color}`}>{meta.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Best attempt hint */}
            {data.bestAttempt?.hint && (
              <div className="bg-surface-container-high border border-outline-variant/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="auto_awesome" size={13} className="text-primary" />
                  <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider">
                    Hint from Round {data.bestAttempt.round}
                  </span>
                </div>
                <p className="text-on-surface-variant text-xs leading-relaxed font-mono whitespace-pre-wrap">{data.bestAttempt.hint}</p>
              </div>
            )}

            {/* Divergences */}
            {data.divergences.length > 0 && (
              <div className="space-y-2">
                <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Divergence Points</span>
                {data.divergences.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-surface-container-highest border border-outline-variant/30">
                    <span className="font-mono text-[10px] text-on-surface-variant">Round {d.round}</span>
                    <span className="font-mono text-[10px] text-primary">Step {d.step}</span>
                    <span className="font-mono text-[9px] text-outline">Tier {d.tier}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Performance summary */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Performance</span>
              <div className="grid grid-cols-2 gap-2">
                {data.rounds.filter(r => r.tier2Result?.studentTimeMs > 0).map(r => (
                  <div key={r.round} className="p-2 rounded-lg bg-surface-container-highest border border-outline-variant/30">
                    <div className="font-mono text-[9px] text-outline">Round {r.round}</div>
                    <div className="font-mono text-[10px] text-on-surface mt-1">
                      {r.tier2Result.studentTimeMs}ms / {r.tier2Result.oracleTimeMs}ms oracle
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'compare' && data.rounds[activeRound] && (
          <>
            <DivergenceSection
              round={data.rounds[activeRound]}
              oracleCode={data.oracleCode}
              language={lang}
            />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                  Your Code (Round {data.rounds[activeRound].round})
                </span>
                <span className={`font-mono text-[9px] font-bold ${VERDICT_META[data.rounds[activeRound].verdict]?.color || 'text-error'}`}>
                  {VERDICT_META[data.rounds[activeRound].verdict]?.label}
                </span>
              </div>
              <CodeBlock
                code={data.rounds[activeRound].code}
                language={LANG_MAP[lang]}
                title="Your Solution"
                highlightLines={data.rounds[activeRound].divergenceStep ? getHighlightLines(data.rounds[activeRound]) : []}
              />
            </div>
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-secondary font-bold uppercase tracking-wider">Oracle Solution</span>
              <CodeBlock
                code={oracleFunctionCode}
                language={LANG_MAP[lang]}
                title="Correct Solution"
              />
            </div>
          </>
        )}

        {view === 'oracle' && (
          <div className="space-y-4">
            <div className="bg-surface-container-high border border-secondary/25 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="school" size={14} className="text-secondary" />
                <span className="font-mono text-[10px] text-secondary font-bold uppercase tracking-wider">Oracle Approach</span>
              </div>
              <p className="text-on-surface-variant text-xs leading-relaxed font-mono">
                {getOracleExplanation(data.problemId, lang)}
              </p>
            </div>
            <CodeBlock
              code={oracleFunctionCode}
              language={LANG_MAP[lang]}
              title="Oracle Solution"
            />
            <div className="bg-surface-container border border-outline-variant/40 rounded-xl p-3">
              <span className="font-mono text-[10px] text-on-surface font-bold uppercase tracking-wider">Key Insights</span>
              <ul className="mt-2 space-y-1.5">
                {getKeyInsights(data.problemId).map((insight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon name="lightbulb" size={12} className="text-tertiary mt-0.5 shrink-0" />
                    <span className="text-on-surface-variant text-[11px] font-mono leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 p-3 border-t" style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}>
        <Button variant="primary" className="w-full" onClick={onStartNewSession}>
          <Icon name="refresh" size={14} />
          Start New Session
        </Button>
      </div>
    </div>
  );
}

function extractFunction(oracleCode, lang) {
  if (!oracleCode) return '// Oracle solution not available';
  const lines = oracleCode.split('\n');
  if (lang === 'python') {
    const start = lines.findIndex(l => l.startsWith('def '));
    if (start === -1) return oracleCode;
    let depth = 0;
    let end = start;
    for (let i = start; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '' && i > start) { end = i; break; }
      if (line.match(/^    /) || line.match(/^def /)) { end = i; }
      else if (line.trim() !== '' && i > start && !line.match(/^    /) && !line.match(/^#/)) { end = i - 1; break; }
      end = i;
    }
    return lines.slice(start, end + 1).join('\n').trim();
  }
  if (lang === 'javascript') {
    const start = lines.findIndex(l => l.match(/function\s+\w+/));
    if (start === -1) return oracleCode;
    let braces = 0;
    let end = start;
    for (let i = start; i < lines.length; i++) {
      braces += (lines[i].match(/{/g) || []).length - (lines[i].match(/}/g) || []).length;
      end = i;
      if (braces === 0 && i > start) break;
    }
    return lines.slice(start, end + 1).join('\n').trim();
  }
  if (lang === 'cpp') {
    const start = lines.findIndex(l => l.match(/^(vector|int|bool|void|string|long long|auto)\s/));
    if (start === -1) return oracleCode;
    let braces = 0;
    let end = start;
    for (let i = start; i < lines.length; i++) {
      braces += (lines[i].match(/{/g) || []).length - (lines[i].match(/}/g) || []).length;
      end = i;
      if (braces === 0 && i > start) break;
    }
    return lines.slice(start, end + 1).join('\n').trim();
  }
  return oracleCode;
}

function getHighlightLines(round) {
  if (!round.divergenceStep || !round.traceLog?.snapshots) return [];
  const snap = round.traceLog.snapshots.find(s => s.step === round.divergenceStep);
  if (snap?.line) return [snap.line];
  return [];
}

const ORACLE_EXPLANATIONS = {
  'two-sum': 'Uses a hash map to store each number and its index. For each element, checks if the complement (target - current) already exists in the map. This gives O(n) time complexity instead of the brute-force O(n²) approach.',
  'fibonacci': 'Uses bottom-up dynamic programming (iterative). Starts from base cases fib(0)=0, fib(1)=1 and builds up to fib(n) using constant O(1) space — no recursion overhead, no memoization dictionary needed.',
  'valid-parentheses': 'Uses a stack data structure. Pushes opening brackets, pops on closing brackets and checks for a match. A valid string results in an empty stack at the end.',
  'binary-search': 'Classic divide-and-conquer. Maintains a search window [lo, hi] and halves it each iteration by comparing the middle element with the target. O(log n) time complexity.',
  'reverse-linked-list': 'Iteratively reverses pointers by maintaining a previous pointer and rewiring each node\'s next pointer. O(n) time, O(1) space.',
  'valid-palindrome': 'First normalizes the string (lowercase, alphanumeric only), then checks if it equals its reverse. Python\'s string slicing makes this concise.',
  'reverse-string': 'Uses two-pointer technique or built-in reversal. For arrays, swaps elements from both ends moving inward.',
  'max-subarray': 'Kadane\'s algorithm. At each position, decides whether to extend the current subarray or start a new one. Tracks the global maximum throughout. O(n) time.',
  'contains-duplicate': 'Converts to a set and compares lengths. If they differ, duplicates exist. O(n) average time with hash set.',
  'bubble-sort': 'Nested loop comparison and swap. Outer loop runs n times, inner loop compares adjacent elements and swaps if out of order.',
  'climbing-stairs': 'Recognized as Fibonacci-like: ways(n) = ways(n-1) + ways(n-2). Uses two variables for O(1) space iterative solution.',
  'best-time-to-buy-and-sell-stock': 'Single pass tracking minimum price seen so far. At each day, calculates profit if sold today and updates maximum profit.',
  'longest-common-prefix': 'Takes the first string as prefix, then progressively shortens it by checking against each subsequent string until a match is found.',
};

const KEY_INSIGHTS = {
  'two-sum': ['Hash map gives O(n) vs brute-force O(n²)', 'Store complement, not the current number', 'Check before inserting to handle same element twice'],
  'fibonacci': ['Iterative DP is O(n) time, O(1) space vs recursive O(2^n)', 'Memoization avoids redundant subproblem computation', 'Base cases: fib(0)=0, fib(1)=1'],
  'valid-parentheses': ['Stack naturally handles nested structures', 'Push openers, pop and match on closers', 'Empty stack at end = valid'],
  'binary-search': ['Halves search space each step: O(log n)', 'Loop condition: lo <= hi', 'Avoid overflow: mid = lo + (hi - lo) / 2'],
  'default': ['Compare your approach with the oracle algorithm', 'Check time and space complexity', 'Test edge cases: empty input, single element, large inputs'],
};

function getOracleExplanation(problemId) {
  return ORACLE_EXPLANATIONS[problemId] || 'The oracle demonstrates the optimal approach for this problem. Study the algorithm, understand its time/space complexity, and compare it with your attempt.';
}

function getKeyInsights(problemId) {
  return KEY_INSIGHTS[problemId] || KEY_INSIGHTS['default'];
}
