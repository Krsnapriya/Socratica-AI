import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';

const features = [
  { icon: 'code', title: 'Real Code Execution', desc: 'Write and run code in Python, JavaScript, and C++ with instant feedback in sandboxed Docker containers.' },
  { icon: 'account_tree', title: 'Trajectory Analysis', desc: 'See exactly where your approach diverges from expert solutions with step-by-step execution comparison.' },
  { icon: 'smart_toy', title: 'AI-Powered Mentor', desc: 'Get personalized hints, code reviews, and explanations from an AI that understands your learning journey.' },
  { icon: 'insights', title: 'Learning Analytics', desc: 'Track your progress with detailed analytics, language breakdown, and performance metrics.' },
  { icon: 'school', title: 'Structured Curriculum', desc: 'Follow a curated path from fundamentals to advanced topics with progressive difficulty.' },
  { icon: 'security', title: 'Enterprise Security', desc: 'Built with JWT auth, CSRF protection, rate limiting, and role-based access control.' },
];

const stats = [
  { value: '3', label: 'Languages' },
  { value: 'AI', label: 'Powered' },
  { value: '24/7', label: 'Available' },
  { value: 'Free', label: 'To Start' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 h-16 border-b border-outline-variant" style={{ background: 'var(--surface)' }}>
        <div className="flex justify-between items-center px-6 h-full max-w-[1200px] mx-auto">
          <Link to="/" className="font-sans text-xl font-bold tracking-tight" style={{ color: 'var(--primary)' }}>
            Socratica AI
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="font-mono text-xs text-on-surface-variant hover:text-on-surface transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link to="/auth" className="font-mono text-xs bg-primary-container text-white font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-inverse-primary transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Icon name="school" size={14} className="text-primary" />
            <span className="font-mono text-[10px] text-primary uppercase tracking-wider">AI-Powered Learning Platform</span>
          </div>
          <h1 className="font-sans text-[48px] md:text-[72px] font-bold text-on-surface leading-tight tracking-tight mb-6">
            Master Coding with<br />
            <span style={{ color: 'var(--primary)' }}>Intelligent Practice</span>
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Socratica AI analyzes your code execution step-by-step, compares it to expert solutions, 
            and provides personalized AI feedback to accelerate your learning.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth" className="bg-primary-container text-white font-mono text-sm font-bold uppercase tracking-wider py-4 px-8 rounded-lg hover:bg-inverse-primary transition-all inline-flex items-center gap-2">
              <Icon name="play_arrow" size={18} />
              Start Learning Free
            </Link>
            <Link to="/auth" className="border border-outline-variant text-on-surface font-mono text-sm py-4 px-8 rounded-lg hover:bg-surface-container-high transition-all">
              Sign In to Continue
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-xl mx-auto">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="font-sans text-2xl font-bold text-on-surface">{s.value}</div>
                <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-outline-variant" style={{ background: 'var(--surface-container-low)' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-4">Why Socratica AI?</h2>
            <p className="text-on-surface-variant text-base max-w-xl mx-auto">Built for students who want to truly understand code, not just pass tests.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-surface-container border border-outline-variant rounded-xl p-6 hover:border-primary/40 transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 mb-4">
                  <Icon name={f.icon} size={20} className="text-primary" />
                </div>
                <h3 className="font-sans text-lg font-semibold text-on-surface mb-2">{f.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-4">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: 'edit', title: 'Write Your Solution', desc: 'Choose a problem from the curriculum and write your code in the built-in IDE.' },
              { step: '02', icon: 'play_arrow', title: 'Run & Submit', desc: 'Test against sample cases, then submit for full evaluation in our secure sandbox.' },
              { step: '03', icon: 'account_tree', title: 'Learn from Trajectory', desc: 'See exactly where your code diverges from expert solutions and get AI-powered insights.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-primary/30">
                  <span className="font-mono text-lg font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="font-sans text-lg font-semibold text-on-surface mb-2">{item.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-outline-variant" style={{ background: 'var(--surface-container-low)' }}>
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-4">Ready to Level Up?</h2>
          <p className="text-on-surface-variant text-base mb-8">Join students who are mastering coding with intelligent, AI-powered practice.</p>
          <Link to="/auth" className="bg-primary-container text-white font-mono text-sm font-bold uppercase tracking-wider py-4 px-10 rounded-lg hover:bg-inverse-primary transition-all inline-flex items-center gap-2">
            <Icon name="rocket_launch" size={18} />
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-outline-variant">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-sans text-sm text-on-surface-variant">
            <span className="font-bold" style={{ color: 'var(--primary)' }}>Socratica AI</span> — AI-Powered Coding Platform
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="font-mono text-xs text-on-surface-variant hover:text-on-surface transition-colors">Sign In</Link>
            <span className="text-outline-variant">·</span>
            <span className="font-mono text-xs text-on-surface-variant">Built for Learning</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
