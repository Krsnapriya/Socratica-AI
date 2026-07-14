import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { CATEGORIES, DIFFICULTIES, LANGUAGE_IDS, SOLUTION_VARIANTS, DIFFICULTY_STYLES } from '../../constants';
import { SkeletonTable } from './Skeletons.jsx';
import { Modal, FormActions, EditDeleteButtons } from './AdminUI.jsx';
import ConfirmModal from './ConfirmModal.jsx';

export default function ProblemsTab({ problems, editingProblem, setEditingProblem, refSolutions, editingRefSol, setEditingRefSol, showRefSolPanel, setShowRefSolPanel, onSaveProblem, onDeleteProblem, onSaveRefSol, onDeleteRefSol, loading }) {
  const [confirmProblemId, setConfirmProblemId] = useState(null);
  const [confirmRefSolId, setConfirmRefSolId] = useState(null);

  if (loading) return <SkeletonTable rows={5} cols={4} colSpan={5} />;

  return (
    <>
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <h2 className="font-sans text-lg font-semibold text-on-surface">Problem Management</h2>
          <button onClick={() => setEditingProblem({})} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add Problem</button>
        </div>
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
            <tr><th className="px-6 py-4">Problem ID</th><th className="px-6 py-4">Title</th><th className="px-6 py-4">Difficulty</th><th className="px-6 py-4">Category</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {problems.map(p => (
              <tr key={p._id} className="hover:bg-surface-container-low group">
                <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{p.problemId}</td>
                <td className="px-6 py-4"><div className="font-sans font-medium text-on-surface">{p.title}</div></td>
                <td className="px-6 py-4"><DifficultyBadge difficulty={p.difficulty} /></td>
                <td className="px-6 py-4 text-on-surface-variant text-xs">{p.category}</td>
                <td className="px-6 py-4 text-right"><EditDeleteButtons onEdit={() => setEditingProblem(p)} onDelete={() => setConfirmProblemId(p._id)} /></td>
              </tr>
            ))}
            {problems.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-xs">No problems</td></tr>}
          </tbody>
        </table>
        {editingProblem != null && (
          <Modal title={editingProblem._id ? 'Edit Problem' : 'Create Problem'} onClose={() => setEditingProblem(null)}>
            <form onSubmit={onSaveProblem} className="space-y-3">
              <div className="flex gap-3">
                <input name="problemId" defaultValue={editingProblem.problemId || ''} placeholder="Problem ID (e.g. two-sum)" required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                <input name="title" defaultValue={editingProblem.title || ''} placeholder="Title" required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
              </div>
              <textarea name="statement" defaultValue={editingProblem.statement || ''} placeholder="Problem statement (markdown)" rows={3} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
              <div className="flex gap-3">
                <select name="category" defaultValue={editingProblem.category || ''} required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                  <option value="">Category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <select name="difficulty" defaultValue={editingProblem.difficulty || ''} required className="w-32 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                  <option value="">Difficulty</option>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
                <input name="tags" defaultValue={(editingProblem.tags || []).join(', ')} placeholder="Tags (comma sep)" className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
              </div>
              <details className="border border-outline-variant rounded-lg"><summary className="px-3 py-2 cursor-pointer font-mono text-xs text-on-surface-variant hover:text-on-surface">Starter Code</summary>
                <div className="p-3 space-y-2">{LANGUAGE_IDS.map(lang => (
                  <textarea key={lang} name={`${lang}_starter`} defaultValue={editingProblem.starterCode?.[lang] || ''} placeholder={`${lang} starter code`} rows={2} className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" />
                ))}</div>
              </details>
              <details className="border border-outline-variant rounded-lg"><summary className="px-3 py-2 cursor-pointer font-mono text-xs text-on-surface-variant hover:text-on-surface">Oracle Solutions</summary>
                <div className="p-3 space-y-2">{LANGUAGE_IDS.map(lang => (
                  <textarea key={lang} name={`${lang}_oracle`} defaultValue={editingProblem.oracleSolutions?.[lang] || ''} placeholder={`${lang} oracle`} rows={2} className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" />
                ))}</div>
              </details>
              <div className="border border-outline-variant rounded-lg p-3 space-y-2">
                <div className="font-mono text-xs text-on-surface-variant mb-1">Test Cases</div>
                <div className="flex gap-2">
                  <input name="test_input" defaultValue={JSON.stringify((editingProblem.testCases || [{}])[0]?.input || [])} placeholder='[[2,7,11,15], 9]' className="flex-1 bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" />
                  <input name="test_expected" defaultValue={JSON.stringify((editingProblem.testCases || [{}])[0]?.expected || [])} placeholder='[0,1]' className="flex-1 bg-surface-container border border-outline-variant rounded px-3 py-2 text-xs font-mono text-on-surface" />
                </div>
              </div>
              <div className="flex gap-3">
                <input name="moduleId" defaultValue={editingProblem.moduleId || ''} placeholder="Module ID" className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                <input name="authorId" defaultValue={editingProblem.authorId || ''} placeholder="Author User ID" className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
              </div>
              <FormActions onCancel={() => setEditingProblem(null)} />
            </form>
          </Modal>
        )}
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mt-4">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-lg font-semibold text-on-surface">Reference Solutions</h2>
            <button onClick={() => setShowRefSolPanel(!showRefSolPanel)} className="font-mono text-[10px] px-2 py-1 rounded bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface">
              <Icon name={showRefSolPanel ? 'expand_less' : 'expand_more'} size={14} className="inline" />
            </button>
          </div>
          <button onClick={() => setEditingRefSol({})} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add Solution</button>
        </div>
        {showRefSolPanel && (
          <table className="w-full text-left font-mono text-sm">
            <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
              <tr><th className="px-6 py-4">Problem</th><th className="px-6 py-4">Language</th><th className="px-6 py-4">Variant</th><th className="px-6 py-4">Notes</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {refSolutions.map(rs => (
                <tr key={rs._id} className="hover:bg-surface-container-low group">
                  <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{rs.problemId}</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary border border-primary/30">{rs.language}</span></td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs">{rs.variant}</td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs truncate max-w-xs">{rs.notes || '—'}</td>
                  <td className="px-6 py-4 text-right"><EditDeleteButtons onEdit={() => setEditingRefSol(rs)} onDelete={() => setConfirmRefSolId(rs._id)} /></td>
                </tr>
              ))}
              {refSolutions.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-xs">No reference solutions</td></tr>}
            </tbody>
          </table>
        )}
        {editingRefSol != null && (
          <Modal title={editingRefSol._id ? 'Edit Reference Solution' : 'Add Reference Solution'} onClose={() => setEditingRefSol(null)}>
            <form onSubmit={onSaveRefSol} className="space-y-3">
              <div className="flex gap-3">
                <select name="problemId" defaultValue={editingRefSol.problemId || ''} required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                  <option value="">Select Problem</option>
                  {problems.map(p => <option key={p.problemId} value={p.problemId}>{p.title} ({p.problemId})</option>)}
                </select>
                <select name="language" defaultValue={editingRefSol.language || 'python'} required className="w-40 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                  {LANGUAGE_IDS.map(lang => <option key={lang} value={lang}>{lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}</option>)}
                </select>
              </div>
              <select name="variant" defaultValue={editingRefSol.variant || SOLUTION_VARIANTS[0]} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                {SOLUTION_VARIANTS.map(v => <option key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
              <textarea name="code" defaultValue={editingRefSol.code || ''} placeholder="Reference solution code" rows={10} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
              <input name="notes" defaultValue={editingRefSol.notes || ''} placeholder="Notes (optional)" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
              <FormActions onCancel={() => setEditingRefSol(null)} />
            </form>
          </Modal>
        )}
      </section>

      <ConfirmModal open={!!confirmProblemId} title="Delete Problem" message="Delete this problem?" danger confirmLabel="Delete" onConfirm={() => { onDeleteProblem(confirmProblemId); setConfirmProblemId(null); }} onCancel={() => setConfirmProblemId(null)} />
      <ConfirmModal open={!!confirmRefSolId} title="Delete Reference Solution" message="Delete this reference solution?" danger confirmLabel="Delete" onConfirm={() => { onDeleteRefSol(confirmRefSolId); setConfirmRefSolId(null); }} onCancel={() => setConfirmRefSolId(null)} />
    </>
  );
}

function DifficultyBadge({ difficulty }) {
  const s = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.Easy;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${s.bg} ${s.text} border ${s.border}`}>{difficulty}</span>;
}
