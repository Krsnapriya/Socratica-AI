import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { LANGUAGE_IDS as FALLBACK_LANG_IDS } from '../../constants';
import { usePublicConfig } from '../../contexts/PublicConfigContext.jsx';
import { SkeletonTable } from './Skeletons.jsx';
import ConfirmModal from './ConfirmModal.jsx';

const WRAPPER_TYPES = ['function_call', 'stdin_stdout', 'custom'];

export default function DriverTemplatesTab({ problems, drivers, _setDrivers, loading, onCreate, onUpdate, onDelete }) {
  const [selectedProblem, setSelectedProblem] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const pc = usePublicConfig();
  const languageIds = pc?.languages?.map(l => l.id) || FALLBACK_LANG_IDS;

  const filtered = drivers.filter(d => {
    if (selectedProblem && d.problemId !== selectedProblem) return false;
    if (selectedLanguage && d.language !== selectedLanguage) return false;
    return true;
  });

  if (loading) return <SkeletonTable rows={5} cols={5} colSpan={5} />;

  return (
    <>
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap justify-between items-center gap-3">
          <h2 className="font-sans text-lg font-semibold text-on-surface">Driver Templates</h2>
          <button onClick={() => { setEditTarget({ language: 'python', wrapperType: 'function_call' }); setShowEditor(true); }} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add Driver</button>
        </div>

        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap gap-3">
          <select value={selectedProblem} onChange={e => setSelectedProblem(e.target.value)} className="bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-mono text-on-surface">
            <option value="">All Problems</option>
            {problems.map(p => <option key={p._id} value={p.problemId}>{p.problemId} — {p.title}</option>)}
          </select>
          <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} className="bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-mono text-on-surface">
            <option value="">All Languages</option>
            {languageIds.map(l => <option key={l} value={l}>{l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
          <span className="font-mono text-[10px] text-on-surface-variant self-center">{filtered.length} driver{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Problem</th>
              <th className="px-6 py-4">Language</th>
              <th className="px-6 py-4">Wrapper Type</th>
              <th className="px-6 py-4">Function Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {filtered.map(d => (
              <tr key={d._id} className="hover:bg-surface-container-low group">
                <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{d.problemId}</td>
                <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary border border-primary/30">{d.language}</span></td>
                <td className="px-6 py-4"><WrapperBadge value={d.wrapperType} /></td>
                <td className="px-6 py-4 text-xs text-on-surface-variant">{d.functionName || '—'}</td>
                <td className="px-6 py-4 text-xs text-on-surface-variant max-w-[200px] truncate">{d.description || '—'}</td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditTarget(d); setShowEditor(true); }} className="font-mono text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20"><Icon name="edit" size={12} /></button>
                  <button onClick={() => setConfirmId(d._id)} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20"><Icon name="delete" size={12} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant text-xs">No driver templates{selectedProblem ? ' for this problem' : ''}</td></tr>}
          </tbody>
        </table>
      </section>

      {showEditor && (
        <DriverEditor
          target={editTarget}
          problems={problems}
          languageIds={languageIds}
          onSave={data => { if (editTarget?._id) { onUpdate(editTarget._id, data); } else { onCreate(data); } setShowEditor(false); setEditTarget(null); }}
          onClose={() => { setShowEditor(false); setEditTarget(null); }}
        />
      )}

      <ConfirmModal open={!!confirmId} title="Delete Driver Template" message="This will permanently delete this driver template." danger confirmLabel="Delete" onConfirm={() => { onDelete(confirmId); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
    </>
  );
}

function DriverEditor({ target, problems, languageIds, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="font-sans text-lg font-semibold text-on-surface mb-4">{target._id ? 'Edit Driver Template' : 'Create Driver Template'}</h3>
        <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.target); onSave({ problemId: fd.get('problemId'), language: fd.get('language'), driverCode: fd.get('driverCode'), stdinTemplate: fd.get('stdinTemplate') || '', wrapperType: fd.get('wrapperType'), functionName: fd.get('functionName') || '', description: fd.get('description') || '' }); }} className="space-y-3">
          <div className="flex gap-3">
            <select name="problemId" defaultValue={target.problemId || ''} required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
              <option value="">Select Problem</option>
              {problems.map(p => <option key={p._id} value={p.problemId}>{p.problemId} — {p.title}</option>)}
            </select>
            <select name="language" defaultValue={target.language || 'python'} required className="w-40 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
              {languageIds.map(l => <option key={l} value={l}>{l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <select name="wrapperType" defaultValue={target.wrapperType || 'function_call'} required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
              {WRAPPER_TYPES.map(w => <option key={w} value={w}>{w.replace(/_/g, ' ')}</option>)}
            </select>
            <input name="functionName" defaultValue={target.functionName || ''} placeholder="Function name (e.g. twoSum)" className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
          </div>
          <div>
            <label className="block font-mono text-xs text-on-surface-variant mb-1">Driver Code</label>
            <textarea name="driverCode" defaultValue={target.driverCode || ''} placeholder="# Driver code that imports student solution and runs test cases" rows={15} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
          </div>
          <div>
            <label className="block font-mono text-xs text-on-surface-variant mb-1">Stdin Template (optional)</label>
            <textarea name="stdinTemplate" defaultValue={target.stdinTemplate || ''} placeholder="Template for stdin input with placeholders" rows={3} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
          </div>
          <div>
            <label className="block font-mono text-xs text-on-surface-variant mb-1">Description</label>
            <input name="description" defaultValue={target.description || ''} placeholder="What this driver does" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-primary text-white font-mono text-xs font-bold uppercase rounded-lg hover:opacity-90">{target._id ? 'Update' : 'Create'}</button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface-container border border-outline-variant font-mono text-xs rounded-lg hover:bg-surface-container-high">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WrapperBadge({ value }) {
  const styles = {
    function_call: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    stdin_stdout: 'bg-green-500/10 text-green-400 border-green-500/30',
    custom: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${styles[value] || styles.custom}`}>{value?.replace(/_/g, ' ')}</span>;
}
