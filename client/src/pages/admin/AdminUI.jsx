import Icon from '../../components/ui/Icon.jsx';

export const LOADER = (
  <div className="p-8 flex justify-center">
    <div className="w-6 h-6 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
  </div>
);

export function TableHeader({ columns }) {
  return (
    <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
      <tr>{columns.map((c, i) => <th key={i} className={`px-6 py-4 ${c.align === 'right' ? 'text-right' : 'font-medium'}`}>{c.label}</th>)}</tr>
    </thead>
  );
}

export function EmptyRow({ colSpan, message = 'No data' }) {
  return <tr><td colSpan={colSpan} className="px-6 py-8 text-center text-on-surface-variant text-xs">{message}</td></tr>;
}

export function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  return (
    <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-center items-center gap-3">
      <button onClick={onPrev} disabled={page <= 1} className="font-mono text-xs px-3 py-1.5 bg-surface-container border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container-high">Previous</button>
      <span className="font-mono text-xs text-on-surface-variant">Page {page} of {totalPages}</span>
      <button onClick={onNext} disabled={page >= totalPages} className="font-mono text-xs px-3 py-1.5 bg-surface-container border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container-high">Next</button>
    </div>
  );
}

export function SectionHeader({ title, action }) {
  return (
    <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap justify-between items-center gap-3">
      <h2 className="font-sans text-lg font-semibold text-on-surface">{title}</h2>
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="font-sans text-lg font-semibold text-on-surface mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function FormActions({ onCancel, saveLabel = 'Save' }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="submit" className="flex-1 py-2.5 bg-primary text-white font-mono text-xs font-bold uppercase rounded-lg hover:opacity-90">{saveLabel}</button>
      <button type="button" onClick={onCancel} className="flex-1 py-2.5 bg-surface-container border border-outline-variant font-mono text-xs rounded-lg hover:bg-surface-container-high">Cancel</button>
    </div>
  );
}

export function EditDeleteButtons({ onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={onEdit} className="font-mono text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20"><Icon name="edit" size={12} /></button>
      <button onClick={onDelete} className="font-mono text-[10px] px-2 py-1 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20"><Icon name="delete" size={12} /></button>
    </div>
  );
}
