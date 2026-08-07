import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button.jsx';
import Icon from './ui/Icon.jsx';
import { fetchSession, fetchSessionAnalysis } from '../api/api.js';
import { LANGUAGES, STORAGE_KEYS } from '../constants';

const VERDICT_META = {
  pass: { icon: 'check_circle', color: 'text-secondary', label: 'Pass', dot: 'bg-secondary' },
  fail: { icon: 'cancel', color: 'text-error', label: 'Fail', dot: 'bg-error' },
  timeout: { icon: 'timer_off', color: 'text-tertiary', label: 'TLE', dot: 'bg-tertiary' },
  compile_error: { icon: 'code_off', color: 'text-error', label: 'CE', dot: 'bg-error' },
  memory_exceeded: { icon: 'memory', color: 'text-tertiary', label: 'MLE', dot: 'bg-tertiary' },
  runtime_error: { icon: 'report_problem', color: 'text-error', label: 'RE', dot: 'bg-error' },
  presentation_error: { icon: 'warning', color: 'text-tertiary', label: 'PE', dot: 'bg-tertiary' },
};

function extractFunction(oracleCode, lang) {
  if (!oracleCode) return '// Oracle solution not available';
  const lines = oracleCode.split('\n');
  if (lang === 'python') {
    const start = lines.findIndex(l => l.startsWith('def '));
    if (start === -1) return oracleCode;
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
    let braces = 0, end = start;
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
    let braces = 0, end = start;
    for (let i = start; i < lines.length; i++) {
      braces += (lines[i].match(/{/g) || []).length - (lines[i].match(/}/g) || []).length;
      end = i;
      if (braces === 0 && i > start) break;
    }
    return lines.slice(start, end + 1).join('\n').trim();
  }
  return oracleCode;
}

function CodeBlock({ code, title }) {
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
          {lines.map((line, i) => (
            <div
              key={i}
              className="flex font-mono text-[11px] leading-5"
            >
                <span className="inline-block w-8 text-right pr-2 text-outline select-none shrink-0 border-r border-outline-variant/20">
                  {i + 1}
                </span>
                <span className="pl-3 pr-4 whitespace-pre text-on-surface-variant">
                  {line || ' '}
                </span>
              </div>
            ))}
        </pre>
      </div>
    </div>
  );
}

function DivergenceSection({ round }) {
  const divStep = round.divergenceStep;
  let explanation = '';
  if (divStep != null && round.tier === 1) {
    explanation = `Your code diverged from the expected behavior at step ${divStep}. The trace shows your program's state at this point differs from the oracle — likely an incorrect calculation, missing update, or wrong branch taken.`;
  } else if (round.verdict === 'timeout') {
    explanation = `Your solution exceeded the time limit. This typically indicates an inefficient algorithm. Consider the time complexity of your approach.`;
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

function WhatIsTrajectory({ onClose }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="info" size={16} className="text-primary" />
          <span className="font-sans text-sm font-semibold text-on-surface">What is a Trajectory?</span>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
          <Icon name="close" size={16} />
        </button>
      </div>
      <p className="text-on-surface-variant text-xs leading-relaxed">
        A trajectory shows your complete journey through a problem — every attempt,
        every code change, and exactly where your solution diverges from the expert's approach.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/30">
          <div className="font-mono text-[10px] text-secondary font-bold uppercase mb-1">Pass</div>
          <p className="font-mono text-[10px] text-on-surface-variant">Your code produced correct output for all test cases.</p>
        </div>
        <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/30">
          <div className="font-mono text-[10px] text-error font-bold uppercase mb-1">Fail</div>
          <p className="font-mono text-[10px] text-on-surface-variant">Your code didn't match expected output for some test cases.</p>
        </div>
        <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/30">
          <div className="font-mono text-[10px] text-primary font-bold uppercase mb-1">Divergence</div>
          <p className="font-mono text-[10px] text-on-surface-variant">The exact step where your trace differs from the oracle's trace.</p>
        </div>
        <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/30">
          <div className="font-mono text-[10px] text-tertiary font-bold uppercase mb-1">Oracle</div>
          <p className="font-mono text-[10px] text-on-surface-variant">The expert solution for comparison with your approach.</p>
        </div>
      </div>
    </div>
  );
}

function CodeLine({ num, content, type }) {
  const bg = type === 'highlight' ? 'bg-warning/20 border-l-2 border-warning'
    : type === 'divergence' ? 'bg-error/15 border-l-2 border-error'
    : type === 'comment' ? 'opacity-50'
    : '';
  return (
    <div className={`flex font-mono text-xs leading-6 px-3 ${bg}`}>
      <span className="w-10 text-right pr-3 text-on-surface-variant select-none shrink-0">{num}</span>
      <span className="whitespace-pre overflow-x-auto">{content}</span>
    </div>
  );
}

export default function TrajectoryViewer() {
  const navigate = useNavigate();
  const [rounds, setRounds] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(null);
  const [selectedRoundIdx, setSelectedRoundIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [rightTab, setRightTab] = useState('deviation');

  const sessionId = localStorage.getItem(STORAGE_KEYS.LAST_SESSION_ID);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetchSession(sessionId).catch(() => []),
      fetchSessionAnalysis(sessionId).catch(() => null),
    ]).then(([roundsData, analysisData]) => {
      const r = roundsData || [];
      setRounds(r);
      setAnalysis(analysisData);
      if (r.length > 0) {
        setSelectedRound(r[0]);
        setSelectedRoundIdx(0);
      }
    }).finally(() => setLoading(false));
  }, [sessionId]);

  function selectRound(round, idx) {
    setSelectedRound(round);
    setSelectedRoundIdx(idx);
    setStep(0);
  }

  const currentAnalysisRound = analysis?.rounds?.[selectedRoundIdx] || null;
  const oracleCode = analysis?.oracleCode || null;
  const oracleFunctionCode = extractFunction(oracleCode, analysis?.language);

  const snapshots = currentAnalysisRound?.traceLog || [];
  const hasSnapshots = snapshots.length > 0;
  const currentSnapshot = hasSnapshots ? snapshots[Math.min(step, snapshots.length - 1)] : null;
  const currentHighlightLine = currentSnapshot?.line || 0;
  const currentLocals = currentSnapshot?.locals || {};
  const currentSnapshotStep = currentSnapshot?.step || 0;

  const divergenceLine = currentAnalysisRound?.divergenceStep != null && currentAnalysisRound?.tier === 1
    ? (() => {
        const divSnap = snapshots.find(s => s.step === currentAnalysisRound.divergenceStep);
        return divSnap?.line || 0;
      })()
    : 0;

  const codeLines = selectedRound?.code
    ? selectedRound.code.split('\n').map((content, i) => {
        const lineNum = i + 1;
        const isCurrentStep = hasSnapshots && lineNum === currentHighlightLine;
        const isDivergence = divergenceLine > 0 && lineNum === divergenceLine;
        const type = isCurrentStep ? 'highlight'
          : isDivergence ? 'divergence'
          : content.trim().startsWith('#') || content.trim().startsWith('//') ? 'comment'
          : content.includes('while') || content.includes('for') || content.includes('if') ? 'highlight'
          : 'normal';
        return { num: lineNum, content, type };
      })
    : [];

  const lastLine = codeLines.length;
  const maxStep = hasSnapshots ? snapshots.length - 1 : lastLine;
  const currentStep = Math.min(step, maxStep);

  return (
    <section className="bg-surface-container-low border border-outline-variant rounded-xl flex flex-col overflow-hidden">
      <header className="px-5 pt-5 pb-4 border-b border-outline-variant shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-sans text-xl font-semibold text-on-surface flex items-center gap-2">
            <Icon name="account_tree" size={20} className="text-primary" />
            Session Trajectory
          </h2>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="font-mono text-[10px] text-primary hover:underline flex items-center gap-1"
          >
            <Icon name="help_outline" size={14} />
            {showHelp ? 'Hide Help' : 'What is this?'}
          </button>
        </div>

        {showHelp && <WhatIsTrajectory onClose={() => setShowHelp(false)} />}

        {!showHelp && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <Icon name="timeline" size={16} />
              Session Overview
              {analysis && (
                <span className="ml-2 font-mono text-[10px] px-2 py-0.5 rounded-md border border-outline-variant text-on-surface-variant">
                  {analysis.title} · {analysis.language} · {analysis.totalRounds} rounds
                </span>
              )}
              {analysis?.hasPass && (
                <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-mono text-[9px] font-bold border border-secondary/30">PASSED</span>
              )}
            </span>
            <span className="flex-1" />
            <Button variant="primary" size="sm" onClick={() => navigate('/workspace')}>
              <Icon name="play_arrow" size={14} />
              New Submission
            </Button>
          </div>
        )}

        {!showHelp && (
          loading ? (
            <div className="h-4 skeleton rounded w-48 mt-3" />
          ) : !sessionId ? (
            <div className="text-center py-6">
              <Icon name="account_tree" size={32} className="text-outline mx-auto mb-3" />
              <p className="text-on-surface-variant text-sm mb-2">No trajectory data yet.</p>
              <p className="font-mono text-xs text-outline mb-4">Submit a solution in the Workspace to see your execution path.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/workspace')}>
                <Icon name="play_arrow" size={14} />
                Open Workspace
              </Button>
            </div>
          ) : rounds.length === 0 ? (
            <p className="text-on-surface-variant text-sm mt-3">Session data unavailable.</p>
          ) : (
            <div className="flex items-center gap-2 flex-wrap mt-3">
              {rounds.map((r, i) => {
                const meta = VERDICT_META[r.verdict] || VERDICT_META.fail;
                return (
                  <div key={r._id} className="flex items-center gap-1">
                    {i > 0 && <div className="w-8 h-px bg-outline-variant" />}
                    <button
                      onClick={() => selectRound(r, i)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all border-2
                        ${selectedRound?._id === r._id ? 'border-primary scale-110' : 'border-transparent scale-100'}
                        ${meta.dot}`}
                      title={`Round ${i + 1}: ${r.verdict}`}
                    >
                      {i + 1}
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </header>

      <div className="flex flex-1 flex-col md:flex-row gap-4 p-4 min-h-[540px] overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0">
          <div
            className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden"
            aria-label="Code trace viewer"
          >
            <div className="h-10 bg-surface-container border-b border-outline-variant flex items-center px-4 justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Icon name="code" size={16} className="text-on-surface-variant" />
                <span className="font-mono text-xs text-on-surface">
                  {selectedRound ? `solution.${LANGUAGES.find(l => l.id === selectedRound.language)?.ext?.slice(1) || 'py'}` : 'solution.py'}
                </span>
                {currentAnalysisRound?.divergenceStep != null && currentAnalysisRound?.tier === 1 && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-error/10 text-error border border-error/20">
                    divergence @ step {currentAnalysisRound.divergenceStep}
                  </span>
                )}
              </div>
              {selectedRound && (
                <span className="font-mono text-[10px] text-outline px-2 py-0.5 rounded-md border border-outline-variant">
                  {LANGUAGES.find(l => l.id === selectedRound.language)?.label || selectedRound.language}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-auto py-4 scrollbar-thin">
              {loading ? (
                <div className="p-4 space-y-2 animate-pulse">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-4 skeleton rounded w-full" />)}
                </div>
              ) : codeLines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant">
                  <Icon name="code" size={36} className="text-outline" />
                  <p className="text-sm">No code to display.</p>
                  <p className="font-mono text-xs text-outline">Submit code in the Workspace to see it here.</p>
                </div>
              ) : hasSnapshots ? (
                <div>
                  {codeLines.map(line => <CodeLine key={line.num} {...line} />)}
                </div>
              ) : (
                codeLines.filter(line => line.num <= currentStep).map(line => <CodeLine key={line.num} {...line} />)
              )}
            </div>
          </div>

          {codeLines.length > 0 && (
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-3 flex flex-col gap-2.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Previous step"
                  >
                    <Icon name="skip_previous" size={20} />
                  </button>
                  <button
                    onClick={() => setStep(s => Math.min(maxStep, s + 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:opacity-90 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{ background: 'var(--primary-container)' }}
                    aria-label="Next step"
                  >
                    <Icon name="play_arrow" size={24} />
                  </button>
                  <button
                    onClick={() => setStep(s => Math.min(maxStep, s + 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Next step"
                  >
                    <Icon name="skip_next" size={20} />
                  </button>
                </div>
                <div className="flex-1" />
                <div className="flex gap-4 font-mono text-xs text-outline">
                  {hasSnapshots ? (
                    <span>Step {currentStep + 1}/{snapshots.length}{currentSnapshotStep > 0 ? ` (exec step ${currentSnapshotStep})` : ''}</span>
                  ) : (
                    <span>Line {currentStep}/{lastLine}</span>
                  )}
                  {currentSnapshot?.function && (
                    <span className="text-primary">{currentSnapshot.function}()</span>
                  )}
                  {selectedRound?.verdict && (
                    <span className={selectedRound.verdict === 'pass' ? 'text-secondary' : 'text-error'}>
                      {selectedRound.verdict.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-outline w-4 text-right select-none">0</span>
                <div className="relative flex-1 h-3 flex items-center cursor-pointer" onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  setStep(Math.round(pct * maxStep));
                }}>
                  <div className="absolute h-1.5 w-full rounded-full" style={{ background: 'var(--surface-container-highest)' }} />
                  <div className="absolute h-1.5 rounded-full" style={{ width: `${(currentStep / Math.max(maxStep, 1)) * 100}%`, background: 'var(--primary)' }} />
                  <div className="absolute w-3 h-3 rounded-full bg-white shadow-md z-10" style={{ left: `${(currentStep / Math.max(maxStep, 1)) * 100}%`, transform: 'translateX(-50%)' }} />
                </div>
                <span className="font-mono text-[10px] text-outline w-6 text-left select-none">{maxStep}</span>
              </div>

              {hasSnapshots && Object.keys(currentLocals).length > 0 && (
                <div className="mt-1 p-2.5 rounded-lg bg-surface-container-highest border border-outline-variant/30">
                  <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider font-bold">
                    Variables at step {currentStep + 1}
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {Object.entries(currentLocals).slice(0, 10).map(([k, v]) => (
                      <div key={k} className="font-mono text-[10px] flex items-baseline gap-1 truncate">
                        <span className="text-primary font-bold shrink-0">{k}</span>
                        <span className="text-outline">=</span>
                        <span className="text-on-surface truncate">{JSON.stringify(v)}</span>
                      </div>
                    ))}
                    {Object.keys(currentLocals).length > 10 && (
                      <div className="font-mono text-[9px] text-outline">+{Object.keys(currentLocals).length - 10} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full md:w-[42%] min-w-[300px] flex flex-col gap-4 overflow-hidden">
          <div
            className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl flex flex-col overflow-hidden"
            aria-label="Divergence analysis"
          >
            <div className="h-10 bg-surface-container border-b border-outline-variant flex items-center shrink-0">
              {[
                { id: 'deviation', label: 'Deviation', icon: 'account_tree' },
                { id: 'oracle', label: 'Oracle', icon: 'school' },
                { id: 'performance', label: 'Performance', icon: 'speed' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setRightTab(t.id)}
                  className={`flex-1 h-full flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-colors border-b-2 ${
                    rightTab === t.id ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'
                  }`}
                >
                  <Icon name={t.icon} size={12} />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex-1 p-5 overflow-auto scrollbar-thin space-y-4">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-4 skeleton rounded w-1/2" />
                </div>
              ) : !selectedRound ? (
                <div className="text-center py-8">
                  <Icon name="analytics" size={32} className="text-outline mx-auto mb-3" />
                  <p className="text-on-surface-variant text-sm mb-2">No analysis data yet.</p>
                  <p className="font-mono text-xs text-outline">Select a round to see detailed analysis.</p>
                </div>
              ) : (
                <>
                  {rightTab === 'deviation' && (
                    <>
                      {currentAnalysisRound ? (
                        <DivergenceSection
                          round={currentAnalysisRound}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <Icon name="account_tree" size={32} className="text-outline mx-auto mb-3" />
                          <p className="font-mono text-xs text-outline">Divergence data not available for this round.</p>
                        </div>
                      )}

                      {analysis?.divergences?.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                            All Divergence Points
                          </span>
                          {analysis.divergences.map((d, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-surface-container-highest border border-outline-variant/30">
                              <span className="font-mono text-[10px] text-on-surface-variant">Round {d.round}</span>
                              <span className="font-mono text-[10px] text-primary">Step {d.step}</span>
                              <span className="font-mono text-[9px] text-outline">Tier {d.tier}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedRound.verdict !== 'pass' && (
                        <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon name="lightbulb" size={14} className="text-secondary" />
                            <span className="font-mono text-[10px] text-secondary uppercase tracking-wider font-bold">Next Steps</span>
                          </div>
                          <ul className="text-on-surface-variant text-xs space-y-1.5 font-mono">
                            <li className="flex items-start gap-2">
                              <Icon name="check" size={12} className="text-secondary mt-0.5 shrink-0" />
                              Review the divergence analysis above
                            </li>
                            <li className="flex items-start gap-2">
                              <Icon name="check" size={12} className="text-secondary mt-0.5 shrink-0" />
                              Compare your code with the Oracle tab
                            </li>
                            <li className="flex items-start gap-2">
                              <Icon name="check" size={12} className="text-secondary mt-0.5 shrink-0" />
                              Try fixing the code at the divergence point
                            </li>
                          </ul>
                          <button
                            onClick={() => navigate(`/workspace?problem=${analysis?.problemId || selectedRound?.problemId}`)}
                            className="mt-3 w-full bg-secondary text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                          >
                            <Icon name="refresh" size={14} />
                            Try Again
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {rightTab === 'oracle' && (
                    <>
                      {oracleCode ? (
                        <>
                          <div className="bg-surface-container-high border border-secondary/25 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon name="school" size={14} className="text-secondary" />
                              <span className="font-mono text-[10px] text-secondary font-bold uppercase tracking-wider">Oracle Approach</span>
                            </div>
                            <p className="text-on-surface-variant text-xs leading-relaxed font-mono">
                              The oracle demonstrates the optimal approach for this problem. Study the algorithm, understand its time/space complexity, and compare it with your attempt.
                            </p>
                          </div>
                          <CodeBlock
                            code={oracleFunctionCode}
                            title="Oracle Solution"
                          />
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Icon name="school" size={32} className="text-outline mx-auto mb-3" />
                          <p className="font-mono text-xs text-outline">Oracle solution not available for this problem.</p>
                        </div>
                      )}

                      {currentAnalysisRound && (
                        <div className="space-y-2">
                          <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                            Your Code (Round {currentAnalysisRound.round})
                          </span>
                          <CodeBlock
                            code={currentAnalysisRound.code}
                            title={`Your Solution — ${VERDICT_META[currentAnalysisRound.verdict]?.label || currentAnalysisRound.verdict}`}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {rightTab === 'performance' && (
                    <>
                      <div className="space-y-1">
                        <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Verdict</div>
                        <div className={`font-mono text-sm font-bold ${selectedRound.verdict === 'pass' ? 'text-secondary' : 'text-error'}`}>
                          {selectedRound.verdict.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>

                      {selectedRound.tier2Result && (
                        <div className="space-y-2">
                          <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Performance Comparison</div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: 'Your Time', value: `${selectedRound.tier2Result.studentTimeMs}ms`, desc: 'How long your code took' },
                              { label: 'Oracle Time', value: `${selectedRound.tier2Result.oracleTimeMs}ms`, desc: 'Expert solution time' },
                              { label: 'Your Memory', value: `${selectedRound.tier2Result.studentMemMb}MB`, desc: 'Memory your code used' },
                              { label: 'Oracle Memory', value: `${selectedRound.tier2Result.oracleMemMb}MB`, desc: 'Expert memory usage' },
                            ].map(({ label, value, desc }) => (
                              <div key={label} className="bg-surface-container rounded-lg p-3 border border-outline-variant">
                                <div className="font-mono text-[9px] text-on-surface-variant uppercase mb-1">{label}</div>
                                <div className="font-mono text-sm font-bold text-on-surface">{value}</div>
                                <div className="font-mono text-[9px] text-outline mt-0.5">{desc}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedRound.tier != null && (
                        <div className="bg-surface-container rounded-lg p-3 border border-outline-variant">
                          <div className="font-mono text-[9px] text-on-surface-variant uppercase mb-1">Analysis Tier</div>
                          <div className="font-mono text-sm font-bold text-on-surface">
                            Tier {selectedRound.tier}
                            <span className="text-[10px] font-normal text-on-surface-variant ml-2">
                              {selectedRound.tier === 1 ? '(trace-level divergence)' : '(performance comparison only)'}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedRound.hint && (
                        <div className="bg-surface-container border border-primary/25 rounded-xl p-4 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl" aria-hidden="true" />
                          <div className="pl-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon name="auto_awesome" size={14} className="text-primary" />
                              <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-bold">AI Mentor Hint</span>
                            </div>
                            <p className="text-on-surface-variant text-xs leading-relaxed font-mono whitespace-pre-wrap">{selectedRound.hint}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-background border border-outline-variant/50 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0">
            <Icon name="security" size={14} className="text-secondary shrink-0" />
            <span className="font-mono text-[11px] text-on-surface-variant">Sandbox · Network-isolated · 256MB RAM · 2s CPU cap</span>
          </div>
        </div>
      </div>
    </section>
  );
}
