import { useState, useEffect } from 'react';
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
  const { addToast } = useToast();

  useEffect(() => {
    fetchCourses()
      .then(setCourses)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-12">
      {/* Header */}
      <header>
        <h1 className="font-sans text-3xl font-bold text-on-surface mb-2">Curriculum</h1>
        <p className="text-on-surface-variant text-sm max-w-xl">
          Progress through the structured curriculum. Modules must be completed sequentially to unlock advanced topics.
        </p>
      </header>

      {courses.length === 0 ? (
        <div className="text-on-surface-variant text-sm">No courses found.</div>
      ) : (
        courses.map(course => (
          <section key={course._id} className="space-y-6">
            <div className="flex items-center gap-3 border-b border-outline-variant pb-2">
              <Icon name={course.icon || 'school'} size={24} className="text-primary" />
              <h2 className="font-sans text-2xl font-semibold text-on-surface">{course.title}</h2>
            </div>
            <p className="text-on-surface-variant text-sm">{course.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {course.modules?.map(module => {
                const isUnlocked = unlocked.includes(module._id) || (user?.role === 'admin' || user?.role === 'super_admin') || (!module.prerequisites || module.prerequisites.length === 0);
                
                return (
                  <article key={module._id} className={`bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 
                    ${!isUnlocked ? 'opacity-60 grayscale-[50%]' : 'hover:border-primary/50'}`}>
                    
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center bg-surface-container">
                        <Icon name={isUnlocked ? 'menu_book' : 'lock'} size={20} className={isUnlocked ? 'text-primary' : 'text-outline'} />
                      </div>
                      {!isUnlocked ? (
                        <Badge variant="error">Locked</Badge>
                      ) : (
                        <Badge variant="primary">Available</Badge>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-sans text-base font-semibold text-on-surface mb-1">{module.title}</h3>
                      <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{module.description}</p>
                      
                      {/* Topics */}
                      <div className="space-y-1.5 mt-2">
                        <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Topics</div>
                        {module.topics?.map(topic => (
                          <button
                            key={topic.problemId}
                            onClick={() => handleTopicClick(topic.problemId, !isUnlocked)}
                            className={`w-full text-left flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-colors
                              ${isUnlocked 
                                ? 'bg-surface-container hover:bg-surface-container-high text-on-surface cursor-pointer border border-transparent hover:border-outline-variant' 
                                : 'bg-surface-container-lowest text-outline cursor-not-allowed'}`}
                          >
                            <span className="truncate">{topic.title}</span>
                            <Icon name="code" size={14} className={isUnlocked ? 'text-tertiary' : 'text-outline'} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {!isUnlocked && (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'instructor') && (
                      <Button variant="secondary" size="sm" onClick={() => handleUnlock(module._id)} className="w-full mt-2">
                        Force Unlock (Admin)
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
