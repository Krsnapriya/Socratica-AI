import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { CATEGORIES as FALLBACK_CATEGORIES, LANGUAGE_IDS as FALLBACK_LANG_IDS } from '../../constants';
import { usePublicConfig } from '../../contexts/PublicConfigContext.jsx';
import { SkeletonTable } from './Skeletons.jsx';
import { Modal, FormActions, EditDeleteButtons } from './AdminUI.jsx';
import ConfirmModal from './ConfirmModal.jsx';

const VISIBILITIES = ['public', 'hidden', 'sample'];
const TC_CATEGORIES = ['sample', 'hidden', 'boundary', 'edge', 'stress', 'random', 'performance'];

export default function TestCasesTab({ problems, testCases, setTestCases, loading, fetchTestCases, onCreate, onUpdate, onDelete }) {
  const [selectedProblem, setSelectedProblem] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const pc = usePublicConfig();
  const languageIds = pc?.languages?.map(l => l.id) || FALLBACK_LANG_IDS;

  const filtered = testCases.filter(tc => {
    if (selectedProblem && tc.problemId !== selectedProblem) return false;
    if (selectedLanguage && tc.language !== selectedLanguage) return false;
    if (selectedVisibility && tc.visibility !== selectedVisibility) return false;
    if (selectedCategory && tc.category !== selectedCategory) return false;
    return true;
  });

  if (loading) return <SkeletonTable rows={5} cols={7} colSpan={7} />;

  return (
    <>
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap justify-between items-center gap-3">
          <h2 className="font-sans text-lg font-semibold text-on-surface">Test Case Management</h2>
          <button onClick={() => setEditing({ language: 'python', visibility: 'public', category: 'sample', weight: 1, order: 0, enabled: true })} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 flex items-center gap-1"><Icon name="add" size={14} /> Add Test Case</button>
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
          <select value={selectedVisibility} onChange={e => setSelectedVisibility(e.target.value)} className="bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-mono text-on-surface">
            <option value="">All Visibility</option>
            {VISIBILITIES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-mono text-on-surface">
            <option value="">All Categories</option>
            {TC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="font-mono text-[10px] text-on-surface-variant self-center">{filtered.length} test case{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Problem</th>
              <th className="px-6 py-4">Language</th>
              <th className="px-6 py-4">Visibility</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Input (preview)</th>
              <th className="px-6 py-4">Expected (preview)</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {filtered.map(tc => (
              <tr key={tc._id} className="hover:bg-surface-container-low group">
                <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{tc.problemId}</td>
                <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary border border-primary/30">{tc.language}</span></td>
                <td className="px-6 py-4"><VisibilityBadge value={tc.visibility} /></td>
                <td className="px-6 py-4"><CategoryBadge value={tc.category} /></td>
                <td className="px-6 py-4 text-xs text-on-surface-variant max-w-[200px] truncate" title={tc.input}>{truncate(tc.input, 60)}</td>
                <td className="px-6 py-4 text-xs text-on-surface-variant max-w-[200px] truncate" title={tc.expectedOutput}>{truncate(tc.expectedOutput, 60)}</td>
                <td className="px-6 py-4 text-right"><EditDeleteButtons onEdit={() => setEditing(tc)} onDelete={() => setConfirmId(tc._id)} /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-on-surface-variant text-xs">No test cases{selectedProblem ? ' for this problem' : ''}</td></tr>}
          </tbody>
        </table>

        {editing != null && (
          <Modal title={editing._id ? 'Edit Test Case' : 'Create Test Case'} onClose={() => setEditing(null)}>
            <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.target); const data = { problemId: fd.get('problemId'), language: fd.get('language'), visibility: fd.get('visibility'), category: fd.get('category'), input: fd.get('input'), expectedOutput: fd.get('expectedOutput'), weight: Number(fd.get('weight')) || 1, description: fd.get('description') || '', order: Number(fd.get('order')) || 0, timeLimitMs: Number(fd.get('timeLimitMs')) || 8000, memoryLimitMb: Number(fd.get('memoryLimitMb')) || 256, enabled: fd.get('enabled') === 'on' }; if (editing._id) { onUpdate(editing._id, data); } else { onCreate(data); } setEditing(null); }} className="space-y-3">
              <div className="flex gap-3">
                <select name="problemId" defaultValue={editing.problemId || ''} required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                  <option value="">Select Problem</option>
                  {problems.map(p => <option key={p._id} value={p.problemId}>{p.problemId} — {p.title}</option>)}
                </select>
                <select name="language" defaultValue={editing.language || 'python'} required className="w-40 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                  {languageIds.map(l => <option key={l} value={l}>{l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <select name="visibility" defaultValue={editing.visibility || 'public'} required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                  {VISIBILITIES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <select name="category" defaultValue={editing.category || 'sample'} required className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono">
                  {TC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-mono text-xs text-on-surface-variant mb-1">Input (JSON or raw string)</label>
                <textarea name="input" defaultValue={editing.input || ''} placeholder='e.g. [[2,7,11,15], 9] or raw stdin' rows={3} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
              </div>
              <div>
                <label className="block font-mono text-xs text-on-surface-variant mb-1">Expected Output</label>
                <textarea name="expectedOutput" defaultValue={editing.expectedOutput || ''} placeholder='e.g. [0,1] or raw expected output' rows={3} required className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block font-mono text-xs text-on-surface-variant mb-1">Weight</label>
                  <input name="weight" type="number" defaultValue={editing.weight ?? 1} min="0" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                </div>
                <div className="flex-1">
                  <label className="block font-mono text-xs text-on-surface-variant mb-1">Order</label>
                  <input name="order" type="number" defaultValue={editing.order ?? 0} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                </div>
                <div className="flex-1">
                  <label className="block font-mono text-xs text-on-surface-variant mb-1">Time Limit (ms)</label>
                  <input name="timeLimitMs" type="number" defaultValue={editing.timeLimitMs ?? 8000} min="1000" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block font-mono text-xs text-on-surface-variant mb-1">Memory Limit (MB)</label>
                  <input name="memoryLimitMb" type="number" defaultValue={editing.memoryLimitMb ?? 256} min="64" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
                </div>
                <div className="flex-1 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-on-surface-variant">
                    <input type="checkbox" name="enabled" defaultChecked={editing.enabled !== false} className="accent-primary" /> Enabled
                  </label>
                </div>
              </div>
              <div>
                <label className="block font-mono text-xs text-on-surface-variant mb-1">Description (optional)</label>
                <input name="description" defaultValue={editing.description || ''} placeholder="What this test case validates" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface font-mono" />
              </div>
              <FormActions onCancel={() => setEditing(null)} saveLabel={editing._id ? 'Update' : 'Create'} />
            </form>
          </Modal>
        )}
      </section>

      <ConfirmModal open={!!confirmId} title="Delete Test Case" message="This will permanently delete this test case." danger confirmLabel="Delete" onConfirm={() => { onDelete(confirmId); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
    </>
  );
}

function truncate(str, n) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function VisibilityBadge({ value }) {
  const styles = {
    public: 'bg-green-500/10 text-green-400 border-green-500/30',
    hidden: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    sample: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${styles[value] || styles.public}`}>{value}</span>;
}

function CategoryBadge({ value }) {
  const colors = {
    sample: 'bg-green-500/10 text-green-400 border-green-500/30',
    hidden: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    boundary: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    edge: 'bg-red-500/10 text-red-400 border-red-500/30',
    stress: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    random: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    performance: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${colors[value] || colors.sample}`}>{value}</span>;
}
