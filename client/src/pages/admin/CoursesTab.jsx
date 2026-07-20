import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { SkeletonTable } from './Skeletons.jsx';
import { Modal, FormActions } from './AdminUI.jsx';
import ConfirmModal from './ConfirmModal.jsx';

export default function CoursesTab({ courses, editingCourse, setEditingCourse, onSave, onDelete, loading }) {
  const [confirmId, setConfirmId] = useState(null);
  if (loading) return <SkeletonTable rows={5} cols={3} colSpan={4} />;
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
        <h2 className="font-sans text-lg font-semibold text-on-surface">Course Management</h2>
        <button onClick={() => setEditingCourse({})} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add Course</button>
      </div>
      <table className="w-full text-left font-mono text-sm">
        <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
          <tr><th className="px-6 py-4">Title</th><th className="px-6 py-4">Order</th><th className="px-6 py-4">Modules</th><th className="px-6 py-4 text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {(courses || []).map(c => (
            <tr key={c._id} className="hover:bg-surface-container-low group">
              <td className="px-6 py-4"><div className="font-sans font-medium text-on-surface">{c.title}</div>{c.description && <div className="text-xs text-on-surface-variant truncate max-w-xs">{c.description}</div>}</td>
              <td className="px-6 py-4 text-on-surface-variant text-xs">{c.order}</td>
              <td className="px-6 py-4 text-on-surface-variant text-xs">{(c.modules || []).length}</td>
              <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2">
                <button onClick={() => setEditingCourse(c)} className="font-mono text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20"><Icon name="edit" size={12} /></button>
                <button onClick={() => setConfirmId(c._id)} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20"><Icon name="delete" size={12} /></button>
              </div></td>
            </tr>
          ))}
          {(courses || []).length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant text-xs">No courses</td></tr>}
        </tbody>
      </table>
      {editingCourse != null && (
        <Modal title={editingCourse._id ? 'Edit Course' : 'Create Course'} onClose={() => setEditingCourse(null)}>
          <form onSubmit={onSave} className="space-y-3">
            <input name="title" defaultValue={editingCourse.title || ''} placeholder="Course Title" required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
            <textarea name="description" defaultValue={editingCourse.description || ''} placeholder="Description" rows={2} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
            <div className="flex gap-3"><input name="icon" defaultValue={editingCourse.icon || ''} placeholder="Icon name" className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" /><input name="order" type="number" defaultValue={editingCourse.order || 0} placeholder="Order" className="w-24 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" /></div>
            <input name="instructorId" defaultValue={editingCourse.instructorId || ''} placeholder="Instructor User ID" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
            <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant"><input name="isPublished" type="checkbox" defaultChecked={editingCourse.isPublished !== false} className="rounded border-outline-variant" /> Published</label>
            <FormActions onCancel={() => setEditingCourse(null)} />
          </form>
        </Modal>
      )}
      <ConfirmModal open={!!confirmId} title="Delete Course" message="Delete this course and its modules?" danger confirmLabel="Delete" onConfirm={() => { onDelete(confirmId); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
    </section>
  );
}
