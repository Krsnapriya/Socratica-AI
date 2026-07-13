import { useState, useEffect, useRef } from 'react';
import Icon from './ui/Icon.jsx';
import Button from './ui/Button.jsx';
import {
  aiChat,
  aiCodeReview,
  aiQuiz,
  aiReflect,
  fetchAIHistory,
} from '../api/api.js';
import {
  aiCodeReviewContextual,
  aiOracleComparison,
  aiLearningSummary,
  aiContextualHint,
  aiConfidence,
} from '../api/api.js';

const QUICK_ACTIONS = [
  { id: 'review', label: 'Code Review', icon: 'rate_review', color: 'text-secondary' },
  { id: 'quiz', label: 'Quiz Me', icon: 'quiz', color: 'text-tertiary' },
  { id: 'explain', label: 'Explain Approach', icon: 'lightbulb', color: 'text-primary' },
  { id: 'reflect', label: 'Reflect', icon: 'psychology', color: 'text-secondary' },
  { id: 'oracle', label: 'Compare to Gold', icon: 'compare_arrows', color: 'text-tertiary' },
  { id: 'hint', label: 'Contextual Hint', icon: 'tips_and_updates', color: 'text-primary' },
  { id: 'confidence', label: 'Confidence Check', icon: 'speed', color: 'text-secondary' },
];

function MarkdownText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="text-xs leading-relaxed font-mono whitespace-pre-wrap text-on-surface-variant">
      {lines.map((line, i) => {
        if (line.startsWith('```')) return <br key={i} />;
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-on-surface font-semibold">$1</strong>')
          .replace(/`([^`]+)`/g, '<code class="bg-surface-container-highest px-1 py-0.5 rounded text-primary text-[11px]">$1</code>');
        return <span key={i} dangerouslySetInnerHTML={{ __html: formatted + (i < lines.length - 1 ? '\n' : '') }} />;
      })}
    </div>
  );
}

export default function AIMentorPanel({ code, language, problemId, problemDetail }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!historyLoaded) {
      loadHistory();
      setHistoryLoaded(true);
    }
  }, []);

  async function loadHistory() {
    try {
      const hist = await fetchAIHistory(20);
      if (hist?.length > 0) {
        const mapped = hist.flatMap(msg => {
          const result = [];
          if (msg.role === 'user' || msg.role === 'assistant') {
            result.push({ role: msg.role, content: msg.content, ts: msg.createdAt });
          }
          return result;
        });
        if (mapped.length > 0) setMessages(mapped);
      }
    } catch { }
  }

  async function sendMessage(text, context = {}) {
    if (!text?.trim()) return;
    const userMsg = { role: 'user', content: text.trim(), ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const ctx = {
        problemId,
        code: code || undefined,
        language,
        ...context,
      };
      const sid = localStorage.getItem('socratica-last-session-id') || undefined;
      const res = await aiChat({
        message: text.trim(),
        sessionId: sid,
        context: ctx,
        style: 'mentoring',
      });
      if (res.sessionId) {
        localStorage.setItem('socratica-last-session-id', res.sessionId);
      }
      const aiMsg = { role: 'assistant', content: res.response || res.reply || 'No response.', ts: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errMsg = { role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, ts: new Date().toISOString() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleQuickAction(action) {
    switch (action) {
      case 'review': {
        if (!code?.trim()) {
          setMessages(prev => [...prev, { role: 'user', content: '(Code Review)', ts: new Date().toISOString() }, { role: 'assistant', content: 'Write some code first, then I can review it.', ts: new Date().toISOString() }]);
          return;
        }
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: '[Code Review]', ts: new Date().toISOString() }]);
        try {
          const res = await aiCodeReview({ code, language, problemId });
          setMessages(prev => [...prev, { role: 'assistant', content: res.review || res.feedback || 'No review available.', ts: new Date().toISOString() }]);
        } catch (err) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, ts: new Date().toISOString() }]);
        } finally {
          setLoading(false);
        }
        break;
      }
      case 'quiz': {
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: '[Generate Quiz]', ts: new Date().toISOString() }]);
        try {
          const res = await aiQuiz({ problemId, difficulty: 'medium', count: 3 });
          const quizText = res.questions
            ? res.questions.map((q, i) => `${i + 1}. ${q.question}\n${q.options?.map((o, j) => `   ${String.fromCharCode(65 + j)}. ${o}`).join('\n') || ''}`).join('\n\n')
            : (res.quiz || 'No quiz generated.');
          setMessages(prev => [...prev, { role: 'assistant', content: quizText, ts: new Date().toISOString() }]);
        } catch (err) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, ts: new Date().toISOString() }]);
        } finally {
          setLoading(false);
        }
        break;
      }
      case 'explain':
        sendMessage(`Can you explain the approach to solve this problem? I want to understand the algorithm, not get the code.`, { mode: 'explain' });
        break;
      case 'oracle': {
        if (!code?.trim()) {
          setMessages(prev => [...prev, { role: 'user', content: '[Compare to Gold]', ts: new Date().toISOString() }, { role: 'assistant', content: 'Write some code first, then I can compare it to gold solutions.', ts: new Date().toISOString() }]);
          return;
        }
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: '[Compare to Gold Solution]', ts: new Date().toISOString() }]);
        try {
          const res = await aiOracleComparison({ code, language, problemId });
          const text = res.comparison?.feedback || res.feedback || 'No comparison available yet. Submit your solution first to enable gold comparison.';
          setMessages(prev => [...prev, { role: 'assistant', content: text, ts: new Date().toISOString() }]);
        } catch (err) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, ts: new Date().toISOString() }]);
        } finally {
          setLoading(false);
        }
        break;
      }
      case 'hint': {
        if (!code?.trim()) {
          setMessages(prev => [...prev, { role: 'user', content: '[Contextual Hint]', ts: new Date().toISOString() }, { role: 'assistant', content: 'Write some code first, then I can give you a contextual hint.', ts: new Date().toISOString() }]);
          return;
        }
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: '[Get Contextual Hint]', ts: new Date().toISOString() }]);
        try {
          const res = await aiContextualHint({ code, language, problemId, sessionId: localStorage.getItem('socratica-last-session-id') });
          const text = res.response || res.hint || 'No hint available.';
          setMessages(prev => [...prev, { role: 'assistant', content: text, ts: new Date().toISOString() }]);
        } catch (err) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, ts: new Date().toISOString() }]);
        } finally {
          setLoading(false);
        }
        break;
      }
      case 'confidence': {
        if (!code?.trim()) {
          setMessages(prev => [...prev, { role: 'user', content: '[Confidence Check]', ts: new Date().toISOString() }, { role: 'assistant', content: 'Write some code first, then I can analyze your confidence.', ts: new Date().toISOString() }]);
          return;
        }
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: '[Check Confidence]', ts: new Date().toISOString() }]);
        try {
          const res = await aiConfidence({ code, language, problemId });
          const conf = res.confidence || {};
          const parts = [];
          if (conf.syntax != null) parts.push(`Syntax: ${Math.round(conf.syntax * 100)}%`);
          if (conf.logic != null) parts.push(`Logic: ${Math.round(conf.logic * 100)}%`);
          if (conf.optimization != null) parts.push(`Optimization: ${Math.round(conf.optimization * 100)}%`);
          const overall = conf.overall != null ? `\nOverall: ${Math.round(conf.overall * 100)}%` : '';
          const recs = res.recommendations?.length > 0
            ? '\n\nRecommendations:\n' + res.recommendations.map((r, i) => `  ${i + 1}. ${r}`).join('\n')
            : '';
          const text = parts.length > 0
            ? `Confidence Analysis:\n${parts.join(' | ')}${overall}${recs}`
            : (res.analysis || 'No confidence data available.');
          setMessages(prev => [...prev, { role: 'assistant', content: text, ts: new Date().toISOString() }]);
        } catch (err) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, ts: new Date().toISOString() }]);
        } finally {
          setLoading(false);
        }
        break;
      }
      case 'reflect': {
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: '[Reflect on Session]', ts: new Date().toISOString() }]);
        try {
          const res = await aiReflect({ sessionId: localStorage.getItem('socratica-last-session-id'), problemId });
          setMessages(prev => [...prev, { role: 'assistant', content: res.reflection || res.insights || 'No reflection available yet.', ts: new Date().toISOString() }]);
        } catch (err) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, ts: new Date().toISOString() }]);
        } finally {
          setLoading(false);
        }
        break;
      }
      default:
        break;
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-10 border-b flex items-center px-4 shrink-0 gap-2" style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}>
        <Icon name="auto_awesome" size={16} className="text-primary" />
        <span className="font-mono text-xs text-on-surface uppercase tracking-wider font-bold">AI Mentor</span>
        {problemDetail && (
          <span className="ml-auto font-mono text-[10px] text-on-surface-variant truncate max-w-[140px]">
            {problemDetail.title}
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Icon name="auto_awesome" size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-on-surface text-sm font-semibold">Your AI Mentor</p>
              <p className="text-on-surface-variant text-xs mt-1 max-w-[240px]">
                Ask questions about algorithms, get hints, or review your approach. I won't give you the code.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[280px]">
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleQuickAction(a.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant/60 bg-surface-container hover:bg-surface-container-high transition-colors"
                >
                  <Icon name={a.icon} size={13} className={a.color} />
                  <span className="font-mono text-[10px] text-on-surface-variant">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary-container/80 text-white'
                  : 'bg-surface-container-high border border-outline-variant/40'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-xs leading-relaxed font-mono whitespace-pre-wrap text-white/90">{msg.content}</p>
              ) : (
                <MarkdownText text={msg.content} />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick action chips (visible when messages exist) */}
      {messages.length > 0 && !loading && (
        <div className="px-3 pb-1 flex gap-1.5 overflow-x-auto scrollbar-none">
          {QUICK_ACTIONS.filter(a => a.id !== 'explain').map(a => (
            <button
              key={a.id}
              onClick={() => handleQuickAction(a.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-full border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high transition-colors shrink-0"
            >
              <Icon name={a.icon} size={11} className={a.color} />
              <span className="font-mono text-[9px] text-on-surface-variant">{a.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t shrink-0" style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your mentor..."
            rows={1}
            className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-lg px-3 py-2 text-xs font-mono text-on-surface placeholder:text-outline resize-none focus:outline-none focus:ring-1 focus:ring-primary max-h-24"
            style={{ minHeight: '36px' }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="shrink-0"
          >
            <Icon name="send" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
