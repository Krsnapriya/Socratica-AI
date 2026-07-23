import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { fetchCourses, unlockModule } from '../api/api.js';
import { useToast } from '../contexts/ToastContext.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Icon from '../components/ui/Icon.jsx';

export default function ModulesPage() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(user?.unlockedModules || []);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    fetchCourses()
      .then(d => setCourses(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      setUnlocked(user.unlockedModules || []);
    }
  }, [user]);

  async function handleUnlock(moduleId) {
    if (unlocked.includes(moduleId)) return;
    try {
      const data = await unlockModule(moduleId);
      if (data.success) {
        setUnlocked(data.unlockedModules);
        addToast("Module unlocked successfully", "success");
      }
    } catch (err) {
      addToast("Failed to unlock module: " + err.message, "error");
    }
  }

  function handleTopicClick(problemId, isLocked) {
    if (isLocked) return;
    navigate(`/workspace?problem=${problemId}`);
  }

  const totalTopics = useMemo(() => {
    return courses.reduce((acc, course) => {
      return acc + (course.modules?.reduce((mAcc, module) => mAcc + (module.topics?.length || 0), 0) || 0);
    }, 0);
  }, [courses]);

  const completedTopics = useMemo(() => {
    return courses.reduce((acc, course) => {
      return acc + (course.modules?.reduce((mAcc, module) => {
        return mAcc + (module.topics?.filter(t => t.solved)?.length || 0);
      }, 0) || 0);
    }, 0);
  }, [courses]);

  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  if (loading) {
    return (
      <div className="page-enter space-y-8">
        <header>
          <div className="h-8 w-32 skeleton rounded mb-2" />
          <div className="h-4 w-64 skeleton rounded" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">Dashboard</span>
            <Icon name="chevron_right" size={14} />
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface">Curriculum</span>
          </div>
          <h1 className="font-sans text-[32px] md:text-[40px] font-bold text-on-surface tracking-tight">Curriculum</h1>
          <p className="text-on-surface-variant text-sm max-w-xl">
            Progress through the structured curriculum. Complete modules in sequence to unlock advanced topics.
          </p>
        </div>
        {totalTopics > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Overall Progress</div>
              <div className="font-sans text-lg font-bold text-on-surface">{completedTopics}/{totalTopics} topics</div>
            </div>
            <div className="w-24 h-2 bg-surface-container-lowest rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className="font-mono text-xs text-primary font-bold">{overallProgress}%</span>
          </div>
        )}
      </header>

      {totalTopics > 3 && (
        <div className="relative max-w-md">
          <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Search modules or topics..."
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
      )}

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low border border-outline-variant rounded-xl">
          <Icon name="school" size={48} className="text-outline mx-auto mb-4" />
          <h3 className="font-sans text-lg font-semibold text-on-surface mb-2">No courses available</h3>
          <p className="text-on-surface-variant text-sm mb-4">Courses will appear here once they are published.</p>
          <Button variant="primary" onClick={() => navigate('/workspace')}>
            <Icon name="play_arrow" size={16} />
            Try Practice Problems
          </Button>
        </div>
      ) : (
        courses.map(course => {
          const courseModules = course.modules || [];
          const filteredModules = search
            ? courseModules.filter(m => 
                m.title.toLowerCase().includes(search.toLowerCase()) ||
                m.description?.toLowerCase().includes(search.toLowerCase()) ||
                m.topics?.some(t => t.title.toLowerCase().includes(search.toLowerCase()))
              )
            : courseModules;

          if (search && filteredModules.length === 0) return null;

          const courseCompleted = courseModules.reduce((acc, m) => {
            return acc + (m.topics?.filter(t => t.solved)?.length || 0);
          }, 0);
          const courseTotal = courseModules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);
          const courseProgress = courseTotal > 0 ? Math.round((courseCompleted / courseTotal) * 100) : 0;

          return (
            <section key={course._id} className="space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <div className="flex items-center gap-3">
                  <Icon name={course.icon || 'school'} size={24} className="text-primary" />
                  <div>
                    <h2 className="font-sans text-2xl font-semibold text-on-surface">{course.title}</h2>
                    <p className="text-on-surface-variant text-sm">{course.description}</p>
                  </div>
                </div>
                {courseTotal > 0 && (
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs text-on-surface-variant">{courseCompleted}/{courseTotal}</div>
                    <div className="w-16 h-1.5 bg-surface-container-lowest rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${courseProgress === 100 ? 'bg-secondary' : 'bg-primary'}`}
                        style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredModules.map(module => {
                  const isUnlocked = unlocked.includes(module._id) || (user?.role === 'admin' || user?.role === 'super_admin') || (!module.prerequisites || module.prerequisites.length === 0);
                  const moduleTopics = module.topics || [];
                  const solvedCount = moduleTopics.filter(t => t.solved).length;
                  const moduleProgress = moduleTopics.length > 0 ? Math.round((solvedCount / moduleTopics.length) * 100) : 0;
                  
                  return (
                    <article key={module._id} className={`bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 
                      ${!isUnlocked ? 'opacity-60 grayscale-[50%]' : 'hover:border-primary/50'}`}>
                      
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center bg-surface-container">
                          <Icon name={isUnlocked ? 'menu_book' : 'lock'} size={20} className={isUnlocked ? 'text-primary' : 'text-outline'} />
                        </div>
                        {!isUnlocked ? (
                          <Badge variant="error">Locked</Badge>
                        ) : moduleProgress === 100 ? (
                          <Badge variant="secondary">Completed</Badge>
                        ) : moduleProgress > 0 ? (
                          <Badge variant="primary">In Progress</Badge>
                        ) : (
                          <Badge variant="primary">Available</Badge>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-sans text-base font-semibold text-on-surface mb-1">{module.title}</h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed mb-3">{module.description}</p>
                        
                        {moduleTopics.length > 0 && (
                          <div className="mb-3">
                            <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${moduleProgress === 100 ? 'bg-secondary' : 'bg-primary'}`}
                                style={{ width: `${moduleProgress}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="font-mono text-[10px] text-on-surface-variant">{solvedCount}/{moduleTopics.length} topics</span>
                              <span className="font-mono text-[10px] text-on-surface-variant">{moduleProgress}%</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-1.5">
                          <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Topics</div>
                          {moduleTopics.map(topic => (
                            <button
                              key={topic.problemId}
                              onClick={() => handleTopicClick(topic.problemId, !isUnlocked)}
                              className={`w-full text-left flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-colors
                                ${isUnlocked 
                                  ? 'bg-surface-container hover:bg-surface-container-high text-on-surface cursor-pointer border border-transparent hover:border-outline-variant' 
                                  : 'bg-surface-container-lowest text-outline cursor-not-allowed'}`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {topic.solved ? (
                                  <Icon name="check_circle" size={14} className="text-secondary shrink-0" />
                                ) : (
                                  <Icon name="radio_button_unchecked" size={14} className="text-outline shrink-0" />
                                )}
                                <span className="truncate">{topic.title}</span>
                                {topic.difficulty && (
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full border uppercase ${
                                    topic.difficulty === 'easy' ? 'text-green-500 border-green-500/30' :
                                    topic.difficulty === 'medium' ? 'text-yellow-500 border-yellow-500/30' :
                                    'text-red-500 border-red-500/30'
                                  }`}>{topic.difficulty}</span>
                                )}
                              </div>
                              <Icon name="arrow_forward" size={14} className={isUnlocked ? 'text-tertiary shrink-0' : 'text-outline shrink-0'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {!isUnlocked && (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'instructor') && (
                        <Button variant="secondary" size="sm" onClick={() => handleUnlock(module._id)} className="w-full mt-2">
                          <Icon name="lock_open" size={14} />
                          Force Unlock
                        </Button>
                      )}

                      {isUnlocked && moduleTopics.length > 0 && moduleProgress < 100 && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => {
                            const nextTopic = moduleTopics.find(t => !t.solved);
                            if (nextTopic) handleTopicClick(nextTopic.problemId, false);
                          }}
                          className="w-full mt-2"
                        >
                          <Icon name="play_arrow" size={14} />
                          {moduleProgress > 0 ? 'Continue Learning' : 'Start Module'}
                        </Button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
