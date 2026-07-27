import Icon from '../components/ui/Icon.jsx';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
            <Icon name="info" size={18} className="text-primary" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface">About</span>
          </div>
        </div>
        <h1 className="font-sans text-[32px] md:text-[40px] font-bold text-on-surface tracking-tight">About Socratica</h1>
      </header>

      <section className="space-y-4">
        <h2 className="font-sans text-xl font-semibold text-on-surface">What is Socratica?</h2>
        <p className="font-mono text-sm text-on-surface-variant leading-relaxed">
          Socratica is an AI-powered coding education platform designed to teach programming through
          guided practice. Unlike traditional coding platforms that simply judge right or wrong,
          Socratica uses the Socratic method — asking questions and providing hints to help you
          understand <em>why</em> your solution works or doesn't.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-sans text-xl font-semibold text-on-surface">How It Works</h2>
        <div className="space-y-3">
          {[
            { icon: 'edit', title: 'Write', desc: 'Write your solution in the language of your choice — Python, C++, or JavaScript.' },
            { icon: 'send', title: 'Submit', desc: 'Your code runs against hidden test cases. We compare your execution trace with a reference solution.' },
            { icon: 'psychology', title: 'Learn', desc: 'If your solution fails, our AI analyzes the trace and explains what went wrong — with Socratic questions to guide your thinking.' },
            { icon: 'trending_up', title: 'Improve', desc: 'Track your progress, revisit problems, and build mastery over time.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
                <Icon name={icon} size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-semibold text-on-surface">{title}</h3>
                <p className="font-mono text-xs text-on-surface-variant mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-sans text-xl font-semibold text-on-surface">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Dual Execution with Trace Alignment',
            'AI-Powered Mentoring (Socratic method)',
            'Multi-language support (Python, C++, JavaScript)',
            'Structured curriculum with progressive modules',
            'Admin panel with analytics and user management',
            'Real-time code execution in Docker sandboxes',
            'Pass/Fail/Timeout verdicts with detailed traces',
            'Achievement and progress tracking',
          ].map(feature => (
            <div key={feature} className="flex items-center gap-2 p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
              <Icon name="check_circle" size={14} className="text-secondary shrink-0" />
              <span className="font-mono text-xs text-on-surface">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-sans text-xl font-semibold text-on-surface">Technology</h2>
        <p className="font-mono text-sm text-on-surface-variant leading-relaxed">
          Built with Node.js and Express on the backend, React with Vite on the frontend,
          and MongoDB for data persistence. Code execution happens in isolated Docker containers
          with per-language sandbox images. The AI mentor uses circuit-breaker-protected LLM
          calls with automatic fallback responses.
        </p>
      </section>
    </div>
  );
}
