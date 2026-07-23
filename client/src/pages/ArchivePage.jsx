import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { fetchStats, fetchSolved } from '../api/api.js';

function ArchiveCard({ icon, category, title, description, difficulty, onClick }) {
  const difficultyStyles = {
    easy: 'text-green-500 border-green-500 bg-green-500/10',
    medium: 'text-yellow-500 border-yellow-500 bg-yellow-500/10',
    hard: 'text-red-500 border-red-500 bg-red-500/10',
  };
  const diffStyle = difficultyStyles[difficulty] || 'text-on-surface-variant border-outline-variant';

  return (
    <article 
      onClick={onClick}
      className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col h-full transition-all duration-200 hover:border-primary/60 hover:shadow-lg cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-container-highest">
          <Icon name={icon} size={22} className="text-primary" />
        </div>
        {difficulty && (
          <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border uppercase ${diffStyle}`}>
            {difficulty}
          </span>
        )}
      </div>
      <h3 className="font-sans text-base font-semibold text-on-surface mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-3 flex-1 mb-4">{description}</p>
      <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between">
        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{category}</span>
        <span className="font-mono text-[10px] text-primary flex items-center gap-1 group-hover:underline">
          Review <Icon name="arrow_forward" size={12} />
        </span>
      </div>
    </article>
  );
}

export default function ArchivePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [solvedData, setSolvedData] = useState({ count: 0, problems: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('title');

  useEffect(() => {
    Promise.all([fetchStats(), fetchSolved()])
      .then(([statsData, solvedResponse]) => {
        setStats(statsData && typeof statsData === 'object' && !Array.isArray(statsData) ? statsData : { solved: 0, total: 0, passRate: 0 });
        setSolvedData(solvedResponse && typeof solvedResponse === 'object' ? solvedResponse : { count: 0, problems: [] });
      })
      .catch(() => {
        setStats({ solved: 0, total: 0, passRate: 0 });
        setSolvedData({ count: 0, problems: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProblems = useMemo(() => {
    let problems = solvedData.problems || [];
    
    if (search) {
      const q = search.toLowerCase();
      problems = problems.filter(p => 
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    problems = [...problems].sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
      return 0;
    });

    return problems;
  }, [solvedData.problems, search, sortBy]);

  const masteredCount = stats?.solved ?? 0;

  return (
    <div className="page-enter space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">Dashboard</span>
            <Icon name="chevron_right" size={14} />
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface">Archive</span>
          </div>
          <h1 className="font-sans text-[32px] md:text-[40px] font-bold text-on-surface tracking-tight">Archive</h1>
          <p className="text-on-surface-variant text-base leading-relaxed max-w-2xl">
            Your solved problems and achievements. Review and revisit completed challenges.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl p-6 relative overflow-hidden group cursor-default">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden="true" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <Icon name="check_circle" size={28} className="text-secondary" />
              <span className="font-mono text-xs text-secondary bg-secondary/10 px-2 py-1 rounded-md">SOLVED</span>
            </div>
            <div className="relative z-10">
              {loading
                ? <div className="h-12 w-16 skeleton rounded" />
                : <p className="font-sans text-5xl font-bold text-on-surface leading-none">{masteredCount}</p>
              }
              <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mt-2">Problems Solved</p>
            </div>
          </div>

          <div className="bg-surface-container-high border border-outline-variant rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <Icon name="send" size={24} className="text-primary" />
              <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">TOTAL</span>
            </div>
            {loading
              ? <div className="h-10 w-12 skeleton rounded" />
              : <p className="font-sans text-4xl font-bold text-on-surface leading-none">{stats?.total ?? 0}</p>
            }
            <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mt-2">Total Submissions</p>
          </div>

          <div className="bg-surface-container-high border border-outline-variant rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <Icon name="percent" size={24} className="text-tertiary" />
              <span className="font-mono text-xs text-tertiary bg-tertiary/10 px-2 py-1 rounded-md">RATE</span>
            </div>
            {loading
              ? <div className="h-10 w-12 skeleton rounded" />
              : <p className="font-sans text-4xl font-bold text-on-surface leading-none">{stats?.passRate ?? 0}%</p>
            }
            <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mt-2">Pass Rate</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                placeholder="Search solved problems..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="title">Sort by Title</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 skeleton rounded-xl" />
              ))}
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low border border-outline-variant rounded-xl">
              <Icon name="archive" size={48} className="text-outline mx-auto mb-4" />
              <h3 className="font-sans text-lg font-semibold text-on-surface mb-2">
                {search ? 'No matching problems' : 'No solved problems yet'}
              </h3>
              <p className="text-on-surface-variant text-sm mb-4">
                {search ? 'Try a different search term.' : 'Start solving problems to see them here.'}
              </p>
              {!search && (
                <Button variant="primary" onClick={() => navigate('/workspace')}>
                  <Icon name="play_arrow" size={16} />
                  Start Solving
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredProblems.map(problem => (
                <ArchiveCard
                  key={problem.problemId}
                  icon="terminal"
                  category={problem.category}
                  title={problem.title}
                  description={problem.statement?.substring(0, 120) + "..."}
                  difficulty={problem.difficulty}
                  onClick={() => navigate(`/workspace?problem=${problem.problemId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
