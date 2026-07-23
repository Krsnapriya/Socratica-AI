import { useState, useEffect } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { SkeletonTable } from './Skeletons.jsx';
import { Modal, FormActions } from './AdminUI.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import { fetchAdminModules, createModule, updateModule, deleteModule, fetchAdminCourses, fetchAdminProblems } from '../../api/api.js';

export default function ModulesTab({ loading: initialLoading }) {
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [problems, setProblems] = useState([]);
  const [editingModule, setEditingModule] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [loading, setLoading] = useState(initialLoading);
  const [showProblems, setShowProblems] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [modulesData, coursesData, problemsData] = await Promise.all([
        fetchAdminModules(),
        fetchAdminCourses(),
        fetchAdminProblems(),
      ]);
      setModules(Array.isArray(modulesData) ? modulesData : modulesData?.modules || []);
      setCourses(Array.isArray(coursesData) ? coursesData : coursesData?.courses || []);
      setProblems(Array.isArray(problemsData) ? problemsData : problemsData?.problems || []);
    } catch (err) {
      console.error('Failed to load modules data:', err);
    } finally {
      setLoading(false);
    }
  }

  function getModuleProblems(moduleId) {
    return problems.filter(p => p.moduleId === moduleId);
  }

  function getCourseTitle(courseId) {
    const course = courses.find(c => c._id === courseId);
    return course?.title || 'Unknown';
  }

  function getPrereqTitles(prereqIds) {
    return prereqIds.map(id => {
      const mod = modules.find(m => m._id === id);
      return mod?.title || id;
    }).join(', ');
  }

  async function handleSave(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      course: fd.get('course') || undefined,
      title: fd.get('title'),
      description: fd.get('description') || '',
      order: parseInt(fd.get('order')) || 0,
      prerequisites: fd.get('prerequisites') ? fd.get('prerequisites').split(',').map(s => s.trim()) : [],
    };
    try {
      if (editingModule._id) {
        await updateModule(editingModule._id, data);
      } else {
        await createModule(data);
      }
      setEditingModule(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save module');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteModule(id);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete module');
    }
  }

  if (loading) return <SkeletonTable rows={5} cols={4} colSpan={5} />;

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
        <h2 className="font-sans text-lg font-semibold text-on-surface">Module Management</h2>
        <button onClick={() => setEditingModule({})} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add Module</button>
      </div>
      <table className="w-full text-left font-mono text-sm">
        <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4">Title</th>
            <th className="px-6 py-4">Course</th>
            <th className="px-6 py-4">Order</th>
            <th className="px-6 py-4">Prerequisites</th>
            <th className="px-6 py-4">Problems</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {(modules || []).map(m => {
            const moduleProblems = getModuleProblems(m._id);
            return (
              <tr key={m._id} className="hover:bg-surface-container-low group">
                <td className="px-6 py-4">
                  <div className="font-sans font-medium text-on-surface">{m.title}</div>
                  {m.description && <div className="text-xs text-on-surface-variant truncate max-w-xs">{m.description}</div>}
                </td>
                <td className="px-6 py-4 text-on-surface-variant text-xs">{getCourseTitle(m.course)}</td>
                <td className="px-6 py-4 text-on-surface-variant text-xs">{m.order}</td>
                <td className="px-6 py-4 text-on-surface-variant text-xs max-w-xs truncate">{getPrereqTitles(m.prerequisites || []) || '—'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setShowProblems(showProblems === m._id ? null : m._id)}
                    className="font-mono text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Icon name={showProblems === m._id ? 'expand_less' : 'expand_more'} size={14} />
                    {moduleProblems.length} problem{moduleProblems.length !== 1 ? 's' : ''}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditingModule(m)} className="font-mono text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20"><Icon name="edit" size={12} /></button>
                    <button onClick={() => setConfirmId(m._id)} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20"><Icon name="delete" size={12} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
          {(modules || []).length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant text-xs">No modules</td></tr>}
        </tbody>
      </table>

      {showProblems && (
        <div className="border-t border-outline-variant bg-surface-container-low p-4">
          <h3 className="font-sans text-sm font-semibold text-on-surface mb-2">Problems in Module</h3>
          <div className="space-y-2">
            {getModuleProblems(showProblems).map(p => (
              <div key={p._id} className="flex items-center justify-between py-1.5 border-b border-outline-variant/30 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-mono">{p.difficulty}</span>
                  <span className="font-sans text-sm text-on-surface">{p.title}</span>
                  <span className="font-mono text-xs text-on-surface-variant">{p.problemId}</span>
                </div>
                <span className="font-mono text-[10px] text-on-surface-variant">Order: {p.order || 0}</span>
              </div>
            ))}
            {getModuleProblems(showProblems).length === 0 && (
              <div className="text-center py-4 text-on-surface-variant text-xs">No problems in this module</div>
            )}
          </div>
        </div>
      )}

      {editingModule != null && (
        <Modal title={editingModule._id ? 'Edit Module' : 'Create Module'} onClose={() => setEditingModule(null)}>
          <form onSubmit={handleSave} className="space-y-3 max-w-md">
            <select name="course" defaultValue={editingModule.course || ''} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
              <option value="">Select Course</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
            <input name="title" defaultValue={editingModule.title || ''} placeholder="Module Title" required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
            <textarea name="description" defaultValue={editingModule.description || ''} placeholder="Description" rows={2} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
            <div className="flex gap-3">
              <input name="order" type="number" defaultValue={editingModule.order || 0} placeholder="Order" className="w-24 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
            </div>
            <input name="prerequisites" defaultValue={(editingModule.prerequisites || []).join(', ')} placeholder="Prerequisite Module IDs (comma-separated)" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
            <FormActions onCancel={() => setEditingModule(null)} />
          </form>
        </Modal>
      )}
      <ConfirmModal open={!!confirmId} title="Delete Module" message="Delete this module?" danger confirmLabel="Delete" onConfirm={() => { handleDelete(confirmId); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
    </section>
  );
}