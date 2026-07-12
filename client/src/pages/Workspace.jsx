import { useState, useEffect } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { fetchProblems, fetchProblem, fetchTemplate, submitCode } from '../api/api.js';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import VerdictDisplay from '../components/ui/VerdictDisplay.jsx';

const WORKSPACE_NAV = [
  { to: '/workspace', icon: 'code', label: 'Workspace' },
  { to: '/trajectory', icon: 'account_tree', label: 'Trajectory' },
  { to: '/analytics', icon: 'insights', label: 'Analytics' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];



export default function Workspace() {
  const [searchParams] = useSearchParams();
  const initialProblemId = searchParams.get('problem');

  const [problems, setProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState(initialProblemId || '');
  const [problemDetail, setProblemDetail] = useState(null);
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('python');
  const [output, setOutput] = useState(null); // null = idle
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outputError, setOutputError] = useState('');

  // 1. Fetch problem list
  useEffect(() => {
    async function loadProblems() {
      try {
        setLoadingProblems(true);
        const data = await fetchProblems();
        setProblems(data);
        if (data?.length > 0 && !selectedProblemId) {
          setSelectedProblemId(data[0].problemId);
        }
      } catch (err) {
        setOutputError(`Error loading problems: ${err.message}`);
      } finally {
        setLoadingProblems(false);
      }
    }
    loadProblems();
  }, []); // removed selectedProblemId dependency to avoid re-fetching on change

  // 2. Fetch problem detail
  useEffect(() => {
    if (!selectedProblemId) return;
    async function loadDetail() {
      try {
        setLoadingDetail(true);
        const detail = await fetchProblem(selectedProblemId);
        setProblemDetail(detail);
      } catch (err) {
        setOutputError(`Error loading problem: ${err.message}`);
      } finally {
        setLoadingDetail(false);
      }
    }
    loadDetail();
  }, [selectedProblemId]);

  // 3. Fetch starter template
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

  // 4. Submit
  async function handleSubmit() {
    if (!selectedProblemId || !code.trim()) return;
    try {
      setSubmitting(true);
      setOutput(null);
      setOutputError('');
      const response = await submitCode({
        code,
        language: lang,
        problemId: selectedProblemId,
        sessionId: localStorage.getItem('socratica-last-session-id') || undefined,
      });
      if (response.sessionId) {
        localStorage.setItem('socratica-last-session-id', response.sessionId);
      }
      setOutput(response);
    } catch (err) {
      setOutputError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const DIFFICULTY_STYLES = {
    easy: 'text-green-500 border-green-500 bg-green-500/10',
    medium: 'text-yellow-500 border-yellow-500 bg-yellow-500/10',
    hard: 'text-red-500 border-red-500 bg-red-500/10',
  };
  const diffStyle = DIFFICULTY_STYLES[problemDetail?.difficulty] || 'text-on-surface-variant border-outline-variant';

  return (
    <div className="flex overflow-hidden pt-16 h-screen w-full" style={{ background: 'var(--background)' }}>

      {/* ── Sidebar ── */}
      <aside
        className="h-full w-14 md:w-52 flex flex-col border-r shrink-0"
        style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}
      >
        <nav className="flex flex-col py-3 px-2 gap-0.5 border-b" style={{ borderColor: 'var(--outline-variant)' }} aria-label="Workspace navigation">
          {WORKSPACE_NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/workspace'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer
                ${isActive
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`
              }
            >
              <Icon name={icon} size={20} className="shrink-0" />
              <span className="hidden md:inline font-mono text-xs">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Problem list */}
        <div className="hidden md:flex flex-col flex-1 px-2 py-3 overflow-y-auto scrollbar-thin">
          <span className="font-mono text-[10px] text-on-surface font-bold uppercase tracking-wider px-2 mb-2">Problems</span>
          <div id="problem-list-sidebar" className="flex flex-col gap-0.5">
            {loadingProblems ? (
              <span className="font-mono text-xs text-outline py-2 px-2 animate-pulse">Loading…</span>
            ) : problems.length === 0 ? (
              <span className="font-mono text-xs text-outline py-2 px-2">No problems found</span>
            ) : (
              problems.map((prob) => (
                <button
                  key={prob.problemId}
                  onClick={() => setSelectedProblemId(prob.problemId)}
                  className={`text-left font-mono text-xs py-2 px-2 rounded-lg transition-all
                    ${selectedProblemId === prob.problemId
                      ? 'bg-surface-container-high text-primary font-semibold border-l-2 border-primary pl-1.5'
                      : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                    }`}
                >
                  {prob.title}
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Problem Panel */}
        <section
          className="w-[28%] min-w-[260px] border-r flex flex-col"
          style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}
          aria-label="Problem description"
        >
          <div className="h-10 border-b flex items-center px-4 shrink-0 gap-2" style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}>
            <span className="font-mono text-xs text-on-surface uppercase tracking-wider font-bold">Problem</span>
            {/* Mobile select */}
            <select
              id="problem-select"
              value={selectedProblemId}
              onChange={e => setSelectedProblemId(e.target.value)}
              className="md:hidden ml-auto bg-surface-container border border-outline-variant text-xs py-1 px-2 rounded font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Select problem"
            >
              {problems.map(p => <option key={p.problemId} value={p.problemId}>{p.title}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
            {loadingDetail ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-3 skeleton rounded-full w-1/3" />
                <div className="h-5 skeleton rounded-full w-3/4" />
                <div className="h-3 skeleton rounded-full" />
                <div className="h-3 skeleton rounded-full w-5/6" />
                <div className="h-3 skeleton rounded-full w-2/3" />
              </div>
            ) : problemDetail ? (
              <div id="problem-content" className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span id="p-difficulty" className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-medium border uppercase ${diffStyle}`}>
                    {problemDetail.difficulty}
                  </span>
                  {problemDetail.category && (
                    <span id="p-category" className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-medium bg-primary/15 text-primary border border-primary/30 uppercase">
                      {problemDetail.category}
                    </span>
                  )}
                  {problemDetail.estimatedMinutes && (
                    <span className="font-mono text-[10px] text-on-surface-variant flex items-center gap-1">
                      <Icon name="schedule" size={12} />
                      ~{problemDetail.estimatedMinutes}min
                    </span>
                  )}
                </div>
                <h2 id="p-title" className="font-sans text-xl font-semibold text-on-surface">{problemDetail.title}</h2>
                {/* Use statement OR description — whichever is available */}
                <p id="p-description" className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">
                  {problemDetail.statement || problemDetail.description}
                </p>
                {problemDetail.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-outline-variant/40">
                    {problemDetail.tags.map(tag => (
                      <span key={tag} className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="font-mono text-xs text-outline">Select a problem to view description.</span>
            )}
          </div>
        </section>

        {/* Code Editor */}
        <section
          className="flex-1 flex flex-col min-w-0 border-r"
          style={{ background: 'var(--surface-container-lowest)', borderColor: 'var(--outline-variant)' }}
          aria-label="Code editor"
        >
          <div className="h-10 border-b flex items-center justify-between shrink-0 px-3 gap-3" style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}>
            <select
              id="lang-select"
              className="bg-surface-container border border-outline-variant text-xs py-1.5 px-2 rounded font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              value={lang}
              onChange={e => setLang(e.target.value)}
              aria-label="Select language"
            >
              <option value="python">Python 3.10</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++20</option>
            </select>
            <div className="flex items-center gap-1.5 font-mono text-xs text-on-surface-variant">
              <Icon name="security" size={14} className="text-secondary shrink-0" />
              <span className="hidden sm:inline">Sandbox · 256MB · no-network</span>
            </div>
          </div>
          <div className="flex flex-1 overflow-hidden">
            <Editor
              height="100%"
              theme="vs-dark"
              language={lang === 'cpp' ? 'cpp' : lang === 'javascript' ? 'javascript' : 'python'}
              value={code}
              onChange={val => setCode(val || '')}
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                minimap: { enabled: false },
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>
        </section>

        {/* Console / Output */}
        <section
          className="w-[30%] min-w-[260px] flex flex-col"
          style={{ background: 'var(--surface-container-low)' }}
          aria-label="Console output"
        >
          <div className="h-10 border-b flex items-center justify-between px-4 shrink-0" style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}>
            <span className="font-mono text-xs text-on-surface uppercase tracking-wider font-bold flex items-center gap-2">
              <Icon name="terminal" size={16} />
              Console
            </span>
            {output && (
              <button
                onClick={() => { setOutput(null); setOutputError(''); }}
                className="font-mono text-[10px] text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-wider"
                aria-label="Clear output"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin" role="log" aria-live="polite" aria-label="Execution output">
            {submitting ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant">
                <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
                <span className="font-mono text-xs">Running in sandbox…</span>
              </div>
            ) : output ? (
              <VerdictDisplay
                verdict={output.verdict}
                hint={output.hint}
                tier2Result={output.tier2Result}
                error={outputError}
              />
            ) : outputError ? (
              <VerdictDisplay error={outputError} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-on-surface-variant">
                <Icon name="terminal" size={32} className="text-outline" />
                <span className="font-mono text-xs text-outline">Run or submit your code to see results.</span>
              </div>
            )}
          </div>

          <div className="p-3 border-t shrink-0 flex gap-2" style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}>
            <Button variant="secondary" className="flex-1" onClick={handleSubmit} disabled={submitting || !selectedProblemId}>
              {submitting ? 'Running…' : 'Run Code'}
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={submitting || !selectedProblemId}>
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
