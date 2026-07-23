import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { fetchSession } from '../api/api.js';
import { TRAJECTORY_SIDEBAR } from '../navigation';

function CodeLine({ num, content, type }) {
  const lineClass = type === 'highlight'
    ? 'bg-primary/10 border-l-2 border-primary'
    : type === 'divergence'
      ? 'bg-tertiary/10 border-l-2 border-tertiary'
      : 'border-l-2 border-transparent';

  const numColor = type === 'highlight' ? 'text-primary'
    : type === 'divergence' ? 'text-tertiary'
    : 'text-outline-variant';

  const textColor = type === 'comment' ? 'text-outline italic'
    : type === 'divergence' ? 'text-tertiary'
    : 'text-on-surface-variant';

  return (
    <div className={`flex font-mono text-[13px] leading-6 ${lineClass}`}>
      <span className={`w-10 text-right pr-4 shrink-0 select-none ${numColor}`}>{num}</span>
      <span className={`pl-2 ${textColor}`}>{content}</span>
    </div>
  );
}

function RoundCard({ sub, index }) {
  const colors = {
    pass: 'text-secondary border-secondary/40 bg-secondary/5',
    fail: 'text-error border-error/40 bg-error/5',
    timeout: 'text-tertiary border-tertiary/40 bg-tertiary/5',
    compile_error: 'text-error border-error/40 bg-error/5',
    memory_exceeded: 'text-tertiary border-tertiary/40 bg-tertiary/5',
  };
  const icons = {
    pass: 'check_circle', fail: 'cancel', timeout: 'timer_off',
    compile_error: 'code_off', memory_exceeded: 'memory',
  };
  const labels = {
    pass: 'Pass', fail: 'Fail', timeout: 'TLE',
    compile_error: 'CE', memory_exceeded: 'MLE',
  };

  const cls = colors[sub.verdict] || 'text-on-surface-variant border-outline-variant bg-transparent';

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${cls} cursor-pointer hover:opacity-80 transition-opacity`}>
      <Icon name={icons[sub.verdict] || 'help'} size={14} />
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wider">{labels[sub.verdict] || sub.verdict}</div>
        <div className="font-mono text-[9px] text-on-surface-variant truncate">Round {index + 1} · {sub.language}</div>
      </div>
      {sub.tier2Result && (
        <span className="font-mono text-[9px] text-on-surface-variant shrink-0">{sub.tier2Result.studentTimeMs}ms</span>
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
        every code change, and how your solution compares to an expert's approach.
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
          <div className="font-mono text-[10px] text-tertiary font-bold uppercase mb-1">Timeout</div>
          <p className="font-mono text-[10px] text-on-surface-variant">Your code took too long to execute (exceeded 2 seconds).</p>
        </div>
        <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/30">
          <div className="font-mono text-[10px] text-error font-bold uppercase mb-1">Compile Error</div>
          <p className="font-mono text-[10px] text-on-surface-variant">Your code couldn't be compiled. Check syntax errors.</p>
        </div>
      </div>
    </div>
  );
}

export default function TrajectoryViewPage() {
  const navigate = useNavigate();
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(null);
  const [step, setStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const sessionId = localStorage.getItem('socratica-last-session-id');

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    fetchSession(sessionId)
      .then(data => {
        setRounds(data || []);
        if (data?.length > 0) setSelectedRound(data[0]);
      })
      .catch(() => setRounds([]))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const codeLines = selectedRound?.code
    ? selectedRound.code.split('\n').map((content, i) => {
        const type = content.trim().startsWith('#') || content.trim().startsWith('//')
          ? 'comment'
          : content.includes('while') || content.includes('for') || content.includes('if')
            ? 'highlight'
            : 'normal';
        return { num: i + 1, content, type };
      })
    : [];

  const lastLine = codeLines.length;
  const currentStep = Math.min(step, lastLine);

  return (
    <div className="flex overflow-hidden pt-16 h-screen w-full" style={{ background: 'var(--background)' }}>

      <aside
        className="hidden md:flex w-56 flex-col border-r shrink-0"
        style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
          <h2 className="font-sans text-lg font-semibold text-primary">Trajectory</h2>
          <p className="font-mono text-xs text-on-surface-variant mt-0.5 uppercase tracking-wider">
            {sessionId ? 'Last Session' : 'No Session'}
          </p>
        </div>
        <nav className="flex flex-col py-3 px-2 gap-0.5 flex-1 overflow-y-auto scrollbar-thin" aria-label="Trajectory navigation">
          {TRAJECTORY_SIDEBAR.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon name={icon} size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {rounds.length > 0 && (
          <div className="p-3 border-t" style={{ borderColor: 'var(--outline-variant)' }}>
            <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
              Session Rounds ({rounds.length})
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
              {rounds.map((r, i) => (
                <button key={r._id} className="w-full text-left" onClick={() => setSelectedRound(r)}>
                  <RoundCard sub={r} index={i} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t shrink-0" style={{ borderColor: 'var(--outline-variant)' }}>
          <Button variant="primary" className="w-full font-bold" onClick={() => navigate('/workspace')}>
            <Icon name="play_arrow" size={18} />
            New Session
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden p-4 gap-4">

        <section className="bg-surface-container-low border border-outline-variant rounded-xl p-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <Icon name="timeline" size={16} />
              Session Overview
              {selectedRound && (
                <span className="ml-2 font-mono text-[10px] px-2.5 py-1 rounded-md border font-medium uppercase"
                  style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)', borderColor: 'var(--primary-container)' }}>
                  {selectedRound.language.toUpperCase()}
                </span>
              )}
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
            loading ? (
              <div className="h-4 skeleton rounded w-48" />
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
              <p className="text-on-surface-variant text-sm">Session data unavailable.</p>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {rounds.map((r, i) => {
                  const dot = { pass: 'bg-secondary', fail: 'bg-error', timeout: 'bg-tertiary', compile_error: 'bg-error' };
                  return (
                    <div key={r._id} className="flex items-center gap-1">
                      {i > 0 && <div className="w-8 h-px bg-outline-variant" />}
                      <button
                        onClick={() => setSelectedRound(r)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all border-2
                          ${selectedRound?._id === r._id ? 'border-primary scale-110' : 'border-transparent scale-100'}
                          ${dot[r.verdict] || 'bg-outline'}`}
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
        </section>

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0">
            <div
              id="trajectory-detail"
              className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden"
              aria-label="Code trace viewer"
            >
              <div className="h-10 bg-surface-container border-b border-outline-variant flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Icon name="code" size={16} className="text-on-surface-variant" />
                  <span className="font-mono text-xs text-on-surface">
                    {selectedRound ? `solution.${selectedRound.language === 'python' ? 'py' : selectedRound.language === 'javascript' ? 'js' : 'cpp'}` : 'solution.py'}
                  </span>
                </div>
                {selectedRound && (
                  <span className="font-mono text-[10px] text-outline px-2 py-0.5 rounded-md border border-outline-variant">
                    {selectedRound.language === 'python' ? 'Python 3.10' : selectedRound.language === 'javascript' ? 'JavaScript' : 'C++20'}
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
                ) : (
                  codeLines.map(line => <CodeLine key={line.num} {...line} />)
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
                      onClick={() => setStep(s => Math.min(lastLine, s + 1))}
                      className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:opacity-90 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={{ background: 'var(--primary-container)' }}
                      aria-label="Next step"
                    >
                      <Icon name="play_arrow" size={24} />
                    </button>
                    <button
                      onClick={() => setStep(s => Math.min(lastLine, s + 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label="Next step"
                    >
                      <Icon name="skip_next" size={20} />
                    </button>
                  </div>
                  <div className="flex-1" />
                  <div className="flex gap-4 font-mono text-xs text-outline">
                    <span>Line {currentStep}/{lastLine}</span>
                    {selectedRound?.verdict && (
                      <span className={selectedRound.verdict === 'pass' ? 'text-secondary' : 'text-error'}>
                        {selectedRound.verdict.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-outline w-4 text-right select-none">0</span>
                  <div className="relative flex-1 h-3 flex items-center cursor-pointer" onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    setStep(Math.round(pct * lastLine));
                  }}>
                    <div className="absolute h-1.5 w-full rounded-full" style={{ background: 'var(--surface-container-highest)' }} />
                    <div className="absolute h-1.5 rounded-full" style={{ width: `${(currentStep / Math.max(lastLine, 1)) * 100}%`, background: 'var(--primary)' }} />
                    <div className="absolute w-3 h-3 rounded-full bg-white shadow-md z-10" style={{ left: `${(currentStep / Math.max(lastLine, 1)) * 100}%`, transform: 'translateX(-50%)' }} />
                  </div>
                  <span className="font-mono text-[10px] text-outline w-6 text-left select-none">{lastLine}</span>
                </div>
              </div>
            )}
          </div>

          <div className="w-[42%] min-w-[300px] flex flex-col gap-4 overflow-hidden">
            <div
              id="trajectory-insight"
              className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl flex flex-col overflow-hidden"
              aria-label="Divergence analysis"
            >
              <div className="h-10 bg-surface-container border-b border-outline-variant flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Icon name="speed" size={16} className="text-tertiary" />
                  <span className="font-mono text-xs text-tertiary uppercase tracking-wide font-bold">Outcome Analysis</span>
                </div>
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

                    {selectedRound.verdict !== 'pass' && (
                      <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="lightbulb" size={14} className="text-secondary" />
                          <span className="font-mono text-[10px] text-secondary uppercase tracking-wider font-bold">Next Steps</span>
                        </div>
                        <ul className="text-on-surface-variant text-xs space-y-1.5 font-mono">
                          <li className="flex items-start gap-2">
                            <Icon name="check" size={12} className="text-secondary mt-0.5 shrink-0" />
                            Review the AI hint above for specific guidance
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="check" size={12} className="text-secondary mt-0.5 shrink-0" />
                            Compare your code with the performance metrics
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="check" size={12} className="text-secondary mt-0.5 shrink-0" />
                            Try optimizing your approach and submit again
                          </li>
                        </ul>
                        <button 
                          onClick={() => navigate(`/workspace?problem=${submission?.problemId}`)}
                          className="mt-3 w-full bg-secondary text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                          <Icon name="refresh" size={14} />
                          Try Again
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-background border border-outline-variant/50 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0">
              <Icon name="security" size={14} className="text-secondary shrink-0" />
              <span className="font-mono text-[11px] text-on-surface-variant">Sandbox · Network-isolated · 256MB RAM · 2s CPU cap</span>
            </div>

            <Button variant="primary" className="w-full py-3 shrink-0 font-bold" onClick={() => navigate('/workspace')}>
              <Icon name="play_arrow" size={18} />
              New Submission
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
