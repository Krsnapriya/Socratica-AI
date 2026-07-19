import { useState, useEffect, useCallback } from 'react';
import { NavLink, useSearchParams, useOutletContext } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { fetchProblems, fetchProblem, fetchTemplate, runCode, runSamples, submitSolution } from '../api/api.js';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import VerdictDisplay from '../components/ui/VerdictDisplay.jsx';
import AIMentorPanel from '../components/AIMentorPanel.jsx';
import SessionAnalysis from '../components/SessionAnalysis.jsx';
import { WORKSPACE_NAV } from '../navigation';
import { LANGUAGES } from '../constants';

const DIFFICULTY_STYLES = {
  easy: 'text-green-500 border-green-500 bg-green-500/10',
  medium: 'text-yellow-500 border-yellow-500 bg-yellow-500/10',
  hard: 'text-red-500 border-red-500 bg-red-500/10',
};

function TestCaseRow({ tc, index }) {
  return (
    <div className={`rounded-lg border p-3 ${tc.passed ? 'border-secondary/30 bg-secondary/5' : 'border-error/30 bg-error/5'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${tc.passed ? 'bg-secondary text-white' : 'bg-error text-white'}`}>
          {tc.passed ? '✓' : '✗'}
        </span>
        <span className="font-mono text-xs text-on-surface-variant">Test {index + 1}</span>
        {tc.category && tc.category !== 'sample' && (
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-surface-container-highest text-outline uppercase">{tc.category}</span>
        )}
        {tc.description && <span className="font-mono text-[10px] text-outline ml-auto">{tc.description}</span>}
      </div>
      <div className="grid grid-cols-1 gap-2 font-mono text-[11px]">
        <div>
          <span className="text-outline uppercase text-[9px] tracking-wider">Input</span>
          <pre className="mt-0.5 p-2 rounded bg-surface-container-lowest text-on-surface overflow-x-auto whitespace-pre-wrap">{tc.input || '(stdin)'}</pre>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-outline uppercase text-[9px] tracking-wider">Expected</span>
            <pre className="mt-0.5 p-2 rounded bg-surface-container-lowest text-on-surface overflow-x-auto whitespace-pre-wrap">{tc.expectedOutput}</pre>
          </div>
          <div>
            <span className="text-outline uppercase text-[9px] tracking-wider">Your Output</span>
            <pre className={`mt-0.5 p-2 rounded overflow-x-auto whitespace-pre-wrap ${tc.passed ? 'bg-surface-container-lowest text-on-surface' : 'bg-error/10 text-error'}`}>{tc.actualOutput || tc.error || '(no output)'}</pre>
          </div>
        </div>
      </div>
      {(tc.elapsed_ms > 0 || tc.max_memory_bytes > 0) && (
        <div className="mt-2 flex gap-3 font-mono text-[10px] text-outline">
          {tc.elapsed_ms > 0 && <span>{tc.elapsed_ms}ms</span>}
          {tc.max_memory_bytes > 0 && <span>{Math.round(tc.max_memory_bytes / 1024)}KB</span>}
        </div>
      )}
    </div>
  );
}

export default function Workspace() {
  const [searchParams] = useSearchParams();
  const { user } = useOutletContext() || {};
  const initialProblemId = searchParams.get('problem');

  const [problems, setProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState(initialProblemId || '');
  const [problemDetail, setProblemDetail] = useState(null);
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('python');
  const [customInput, setCustomInput] = useState('');
  const [showInputPanel, setShowInputPanel] = useState(true);
  const [output, setOutput] = useState(null);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [rightTab, setRightTab] = useState('console');
  const [consoleTab, setConsoleTab] = useState('output');
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  const [executionMode, setExecutionMode] = useState(null);

  function startNewSession() {
    const newId = crypto.randomUUID();
    localStorage.setItem('socratica-last-session-id', newId);
    setMaxAttemptsReached(false);
    setOutput(null);
    setExecutionMode(null);
  }

  useEffect(() => {
    async function loadProblems() {
      try {
        setLoadingProblems(true);
        const data = await fetchProblems();
        const list = Array.isArray(data) ? data : data?.problems || [];
        setProblems(list);
        if (list.length > 0 && !selectedProblemId) {
          setSelectedProblemId(list[0].problemId);
        }
      } catch (err) {
        console.error('Error loading problems:', err);
      } finally {
        setLoadingProblems(false);
      }
    }
    loadProblems();
  }, []);

  useEffect(() => {
    if (!selectedProblemId) return;
    async function loadDetail() {
      try {
        setLoadingDetail(true);
        const detail = await fetchProblem(selectedProblemId);
        setProblemDetail(detail);
      } catch (err) {
        console.error('Error loading problem:', err);
      } finally {
        setLoadingDetail(false);
      }
    }
    loadDetail();
  }, [selectedProblemId]);

  useEffect(() => {
    if (!selectedProblemId) return;
    async function loadTemplate() {
      try {
        const { code: templateCode } = await fetchTemplate(selectedProblemId, lang);
        setCode(templateCode || '');
      } catch {
        setCode('');
      }
    }
    loadTemplate();
  }, [selectedProblemId, lang]);

  const handleRunCode = useCallback(async () => {
    if (!selectedProblemId || !code.trim()) return;
    try {
      setExecuting(true);
      setOutput(null);
      setMaxAttemptsReached(false);
      setExecutionMode('run');
      setConsoleTab('output');
      const result = await runCode({ code, language: lang, problemId: selectedProblemId, customInput });
      setOutput(result);
    } catch (err) {
      setOutput({ error: err.response?.data?.error || err.message });
    } finally {
      setExecuting(false);
    }
  }, [code, lang, selectedProblemId, customInput]);

  const handleRunSamples = useCallback(async () => {
    if (!selectedProblemId || !code.trim()) return;
    try {
      setExecuting(true);
      setOutput(null);
      setMaxAttemptsReached(false);
      setExecutionMode('samples');
      setConsoleTab('results');
      const result = await runSamples({ code, language: lang, problemId: selectedProblemId });
      setOutput(result);
    } catch (err) {
      setOutput({ error: err.response?.data?.error || err.message });
    } finally {
      setExecuting(false);
    }
  }, [code, lang, selectedProblemId]);

  const handleSubmit = useCallback(async () => {
    if (!selectedProblemId || !code.trim()) return;
    try {
      setExecuting(true);
      setOutput(null);
      setMaxAttemptsReached(false);
      setExecutionMode('submit');
      setConsoleTab('verdict');
      const result = await submitSolution({
        code, language: lang, problemId: selectedProblemId,
        sessionId: localStorage.getItem('socratica-last-session-id') || undefined,
      });
      if (result.sessionId) {
        localStorage.setItem('socratica-last-session-id', result.sessionId);
      }
      if (result.error && result.error.includes('Max')) {
        setMaxAttemptsReached(true);
      }
      setOutput(result);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      if (msg.includes('Max')) {
        setMaxAttemptsReached(true);
      } else {
        setOutput({ error: msg });
      }
    } finally {
      setExecuting(false);
    }
  }, [code, lang, selectedProblemId]);

  const diffStyle = DIFFICULTY_STYLES[problemDetail?.difficulty] || 'text-on-surface-variant border-outline-variant';

  return (
    <div className="flex overflow-hidden pt-16 h-screen w-full" style={{ background: 'var(--background)' }}>

      {/* Sidebar */}
      <aside className="h-full w-14 md:w-52 flex flex-col border-r shrink-0" style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}>
        <nav className="flex flex-col py-3 px-2 gap-0.5 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
          {WORKSPACE_NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/workspace'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer ${isActive ? 'bg-primary/15 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`
              }>
              <Icon name={icon} size={20} className="shrink-0" />
              <span className="hidden md:inline font-mono text-xs">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex flex-col flex-1 px-2 py-3 overflow-y-auto scrollbar-thin">
          <span className="font-mono text-[10px] text-on-surface font-bold uppercase tracking-wider px-2 mb-2">Problems</span>
          <div className="flex flex-col gap-0.5">
            {loadingProblems ? (
              <span className="font-mono text-xs text-outline py-2 px-2 animate-pulse">Loading…</span>
            ) : problems.length === 0 ? (
              <span className="font-mono text-xs text-outline py-2 px-2">No problems found</span>
            ) : (
              problems.map((prob) => (
                <button key={prob.problemId} onClick={() => setSelectedProblemId(prob.problemId)}
                  className={`text-left font-mono text-xs py-2 px-2 rounded-lg transition-all ${selectedProblemId === prob.problemId ? 'bg-surface-container-high text-primary font-semibold border-l-2 border-primary pl-1.5' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}>
                  {prob.title}
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Problem Panel */}
        <section className="w-[28%] min-w-[260px] border-r flex flex-col" style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}>
          <div className="h-10 border-b flex items-center px-4 shrink-0 gap-2" style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}>
            <span className="font-mono text-xs text-on-surface uppercase tracking-wider font-bold">Problem</span>
            <select value={selectedProblemId} onChange={e => setSelectedProblemId(e.target.value)}
              className="md:hidden ml-auto bg-surface-container border border-outline-variant text-xs py-1 px-2 rounded font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
              {problems.map(p => <option key={p.problemId} value={p.problemId}>{p.title}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
            {loadingDetail ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-3 skeleton rounded-full w-1/3" />
                <div className="h-5 skeleton rounded-full w-3/4" />
                <div className="h-3 skeleton rounded-full" />
              </div>
            ) : problemDetail ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-medium border uppercase ${diffStyle}`}>{problemDetail.difficulty}</span>
                  {problemDetail.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-medium bg-primary/15 text-primary border border-primary/30 uppercase">{problemDetail.category}</span>
                  )}
                  {problemDetail.estimatedMinutes && (
                    <span className="font-mono text-[10px] text-on-surface-variant flex items-center gap-1"><Icon name="schedule" size={12} />~{problemDetail.estimatedMinutes}min</span>
                  )}
                </div>
                <h2 className="font-sans text-xl font-semibold text-on-surface">{problemDetail.title}</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">{problemDetail.statement || problemDetail.description}</p>
                {problemDetail.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-outline-variant/40">
                    {problemDetail.tags.map(tag => (
                      <span key={tag} className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="font-mono text-xs text-outline">Select a problem to view description.</span>
            )}
          </div>
        </section>

        {/* Code Editor + Input Panel */}
        <section className="flex-1 flex flex-col min-w-0 border-r" style={{ background: 'var(--surface-container-lowest)', borderColor: 'var(--outline-variant)' }}>
          <div className="h-10 border-b flex items-center justify-between shrink-0 px-3 gap-3" style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}>
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="bg-surface-container border border-outline-variant text-xs py-1.5 px-2 rounded font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
              {LANGUAGES.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowInputPanel(!showInputPanel)}
                className={`font-mono text-[10px] px-2 py-1 rounded transition-colors ${showInputPanel ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}>
                <Icon name="input" size={12} className="inline mr-1" />Input
              </button>
              <div className="flex items-center gap-1.5 font-mono text-xs text-on-surface-variant">
                <Icon name="security" size={14} className="text-secondary shrink-0" />
                <span className="hidden sm:inline">Sandbox · no-network</span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden flex-col">
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                theme={(() => {
                  const t = user?.preferences?.theme || 'Socratica Dark';
                  if (t.includes('Light')) return 'vs';
                  if (t.includes('High Contrast')) return 'hc-black';
                  return 'vs-dark';
                })()}
                language={lang === 'cpp' ? 'cpp' : lang === 'javascript' ? 'javascript' : 'python'}
                value={code}
                onChange={val => setCode(val || '')}
                options={{
                  fontSize: parseInt(user?.preferences?.fontSize) || 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12 },
                  tabSize: parseInt(user?.preferences?.tabSize) || 4,
                }}
              />
            </div>

            {showInputPanel && (
              <div className="border-t flex flex-col" style={{ borderColor: 'var(--outline-variant)', height: '140px' }}>
                <div className="h-7 flex items-center px-3 border-b shrink-0" style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}>
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Custom Input (stdin)</span>
                </div>
                <textarea
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder="Enter input for your program (optional)..."
                  className="flex-1 w-full bg-transparent p-3 font-mono text-xs text-on-surface resize-none focus:outline-none placeholder:text-outline scrollbar-thin"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </section>

        {/* Right Panel — Console / AI Mentor */}
        <section className="w-[30%] min-w-[260px] flex flex-col" style={{ background: 'var(--surface-container-low)' }}>
          <div className="h-10 border-b flex items-center shrink-0" style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}>
            <button onClick={() => setRightTab('console')}
              className={`h-full px-4 font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 transition-colors border-b-2 ${rightTab === 'console' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}>
              <Icon name="terminal" size={14} />Console
            </button>
            <button onClick={() => setRightTab('mentor')}
              className={`h-full px-4 font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 transition-colors border-b-2 ${rightTab === 'mentor' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}>
              <Icon name="auto_awesome" size={14} />AI Mentor
            </button>
            {rightTab === 'console' && output && (
              <button onClick={() => { setOutput(null); setExecutionMode(null); }}
                className="ml-auto mr-3 font-mono text-[10px] text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-wider">Clear</button>
            )}
          </div>

          {rightTab === 'console' ? (
            <>
              {/* Console sub-tabs */}
              {output && executionMode === 'samples' && (
                <div className="h-8 border-b flex items-center shrink-0 px-2 gap-1" style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}>
                  {['results', 'output'].map(tab => (
                    <button key={tab} onClick={() => setConsoleTab(tab)}
                      className={`h-full px-3 font-mono text-[10px] uppercase tracking-wider rounded-t transition-colors ${consoleTab === tab ? 'bg-surface-container-lowest text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      {tab === 'results' ? `Test Results${output.results ? ` (${output.passedTests}/${output.totalTests})` : ''}` : 'Raw Output'}
                    </button>
                  ))}
                </div>
              )}
              {output && executionMode === 'submit' && output.totalTests > 0 && (
                <div className="h-8 border-b flex items-center shrink-0 px-2 gap-1" style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}>
                  {['results', 'verdict'].map(tab => (
                    <button key={tab} onClick={() => setConsoleTab(tab)}
                      className={`h-full px-3 font-mono text-[10px] uppercase tracking-wider rounded-t transition-colors ${consoleTab === tab ? 'bg-surface-container-lowest text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      {tab === 'results' ? `Test Results (${output.passedTests}/${output.totalTests})` : 'Verdict & Hint'}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin" role="log" aria-live="polite">
                {executing ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant">
                    <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
                    <span className="font-mono text-xs">
                      {executionMode === 'run' && 'Running code…'}
                      {executionMode === 'samples' && 'Running sample tests…'}
                      {executionMode === 'submit' && 'Submitting solution…'}
                      {!executionMode && 'Running in sandbox…'}
                    </span>
                  </div>
                ) : maxAttemptsReached ? (
                  <SessionAnalysis sessionId={localStorage.getItem('socratica-last-session-id')} onStartNewSession={startNewSession} />
                ) : output?.error ? (
                  <VerdictDisplay error={output.error} />
                ) : output ? (
                  executionMode === 'run' ? (
                    <div className="space-y-3">
                      {output.error && output.error !== 'timeout' && output.error !== 'compile_error' && (
                        <div className="bg-error/10 border border-error/30 rounded-lg p-3">
                          <span className="font-mono text-xs text-error font-bold uppercase">Error: {output.error}</span>
                        </div>
                      )}
                      {output.error === 'timeout' && (
                        <div className="bg-tertiary/10 border border-tertiary/30 rounded-lg p-3">
                          <span className="font-mono text-xs text-tertiary font-bold uppercase">Time Limit Exceeded</span>
                        </div>
                      )}
                      {output.error === 'compile_error' && (
                        <div className="bg-error/10 border border-error/30 rounded-lg p-3">
                          <span className="font-mono text-xs text-error font-bold uppercase">Compilation Failed</span>
                          <pre className="mt-2 font-mono text-[11px] text-error whitespace-pre-wrap">{output.stderr}</pre>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">stdout</span>
                          {output.stdout && (
                            <button onClick={() => navigator.clipboard.writeText(output.stdout)}
                              className="font-mono text-[10px] text-on-surface-variant hover:text-primary transition-colors">Copy</button>
                          )}
                        </div>
                        <pre className="mt-1 p-3 rounded-lg bg-surface-container-lowest text-on-surface font-mono text-xs overflow-x-auto whitespace-pre-wrap min-h-[60px]">{output.stdout || '(no output)'}</pre>
                      </div>
                      {output.stderr && output.error !== 'compile_error' && (
                        <div>
                          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">stderr</span>
                          <pre className="mt-1 p-3 rounded-lg bg-error/5 text-error font-mono text-xs overflow-x-auto whitespace-pre-wrap">{output.stderr}</pre>
                        </div>
                      )}
                      <div className="flex items-center gap-4 font-mono text-[10px] text-outline pt-1 border-t border-outline-variant/30">
                        {output.elapsed_ms > 0 && <span className="flex items-center gap-1"><Icon name="schedule" size={11} />{output.elapsed_ms}ms</span>}
                        {output.max_memory_bytes > 0 && <span className="flex items-center gap-1"><Icon name="memory" size={11} />{Math.round(output.max_memory_bytes / 1024)}KB</span>}
                        {output.exitCode != null && <span>exit {output.exitCode}</span>}
                        {output.fallback && <span className="text-tertiary">(local fallback)</span>}
                      </div>
                    </div>
                  ) : executionMode === 'samples' ? (
                    consoleTab === 'results' ? (
                      <div className="space-y-2">
                        {output.verdict === 'compile_error' ? (
                          <div className="bg-error/10 border border-error/30 rounded-lg p-3">
                            <span className="font-mono text-xs text-error font-bold uppercase">Compile Error</span>
                            <pre className="mt-2 font-mono text-[11px] text-error whitespace-pre-wrap">{output.compileError}</pre>
                          </div>
                        ) : (
                          <>
                            <div className={`flex items-center justify-between p-2 rounded-lg ${output.verdict === 'pass' ? 'bg-secondary/10 border border-secondary/30' : 'bg-error/10 border border-error/30'}`}>
                              <div className="flex items-center gap-2">
                                <Icon name={output.verdict === 'pass' ? 'check_circle' : 'cancel'} size={16} className={output.verdict === 'pass' ? 'text-secondary' : 'text-error'} />
                                <span className={`font-mono text-xs font-bold ${output.verdict === 'pass' ? 'text-secondary' : 'text-error'}`}>
                                  {output.passedTests}/{output.totalTests} tests passed
                                </span>
                              </div>
                              {output.results && (
                                <span className="font-mono text-[10px] text-outline">
                                  {output.results.reduce((sum, r) => sum + (r.elapsed_ms || 0), 0)}ms total
                                </span>
                              )}
                            </div>
                            {/* Progress bar */}
                            {output.totalTests > 0 && (
                              <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${output.verdict === 'pass' ? 'bg-secondary' : 'bg-error'}`}
                                  style={{ width: `${(output.passedTests / output.totalTests) * 100}%` }} />
                              </div>
                            )}
                            {(output.results || []).map((tc, i) => <TestCaseRow key={i} tc={tc} index={i} />)}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(output.results || []).map((tc, i) => (
                          <div key={i} className="rounded-lg border border-outline-variant/30 p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${tc.passed ? 'bg-secondary text-white' : 'bg-error text-white'}`}>
                                {tc.passed ? '✓' : '✗'}
                              </span>
                              <span className="font-mono text-[10px] text-on-surface-variant">Test {i + 1}</span>
                              {tc.elapsed_ms > 0 && <span className="font-mono text-[9px] text-outline ml-auto">{tc.elapsed_ms}ms</span>}
                            </div>
                            <pre className="p-2 rounded bg-surface-container-lowest text-on-surface font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">{tc.actualOutput || tc.error || '(no output)'}</pre>
                          </div>
                        ))}
                      </div>
                    )
                  ) : executionMode === 'submit' ? (
                    consoleTab === 'results' && output.totalTests > 0 ? (
                    <div className="space-y-3">
                      {/* Test results summary */}
                      <div className={`flex items-center justify-between p-2 rounded-lg ${output.verdict === 'pass' ? 'bg-secondary/10 border border-secondary/30' : 'bg-error/10 border border-error/30'}`}>
                        <div className="flex items-center gap-2">
                          <Icon name={output.verdict === 'pass' ? 'check_circle' : 'cancel'} size={16} className={output.verdict === 'pass' ? 'text-secondary' : 'text-error'} />
                          <span className={`font-mono text-xs font-bold ${output.verdict === 'pass' ? 'text-secondary' : 'text-error'}`}>
                            {output.passedTests}/{output.totalTests} tests passed
                          </span>
                        </div>
                        {output.testResults && (
                          <span className="font-mono text-[10px] text-outline">
                            {output.testResults.reduce((sum, r) => sum + (r.elapsed_ms || 0), 0)}ms total
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${output.verdict === 'pass' ? 'bg-secondary' : 'bg-error'}`}
                          style={{ width: `${(output.passedTests / output.totalTests) * 100}%` }} />
                      </div>
                      {/* Failed categories */}
                      {output.failedCategories?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {output.failedCategories.map((fc, i) => (
                            <span key={i} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-error/10 text-error border border-error/20 uppercase">
                              {fc.category}: {fc.failed}/{fc.total} failed
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Individual test results */}
                      {(output.testResults || []).map((tc, i) => <TestCaseRow key={i} tc={tc} index={i} />)}
                    </div>
                    ) : (
                    <VerdictDisplay
                      verdict={output.verdict}
                      hint={output.hint}
                      tier2Result={output.tier2Result}
                      aiAnalysis={output.aiAnalysis}
                      hintLevel={output.hintLevel}
                    />
                    )
                  ) : null
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-on-surface-variant">
                    <Icon name="terminal" size={32} className="text-outline" />
                    <span className="font-mono text-xs text-outline">Run or submit your code to see results.</span>
                  </div>
                )}
              </div>

              <div className="p-3 border-t shrink-0 flex gap-2" style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}>
                <Button variant="ghost" className="flex-1" onClick={handleRunCode} disabled={executing || !selectedProblemId}>
                  {executing && executionMode === 'run' ? 'Running…' : 'Run Code'}
                </Button>
                <Button variant="secondary" className="flex-1" onClick={handleRunSamples} disabled={executing || !selectedProblemId}>
                  {executing && executionMode === 'samples' ? 'Running…' : 'Run Samples'}
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={executing || !selectedProblemId}>
                  {executing && executionMode === 'submit' ? 'Submitting…' : 'Submit'}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-hidden">
              <AIMentorPanel code={code} language={lang} problemId={selectedProblemId} problemDetail={problemDetail} userRole={user?.role} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
