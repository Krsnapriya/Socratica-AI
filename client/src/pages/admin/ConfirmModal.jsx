import { useEffect, useRef } from 'react';
import Icon from '../../components/ui/Icon.jsx';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  useEffect(() => {
    if (open && cancelRef.current) cancelRef.current.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={onCancel}>
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-error/10' : 'bg-primary/10'}`}>
            <Icon name={danger ? 'warning' : 'info'} size={20} className={danger ? 'text-error' : 'text-primary'} />
          </div>
          <h3 className="font-sans text-lg font-semibold text-on-surface">{title}</h3>
        </div>
        <p className="font-mono text-xs text-on-surface-variant mb-5 pl-[52px]">{message}</p>
        <div className="flex gap-3">
          <button ref={cancelRef} onClick={onCancel} className="flex-1 py-2.5 bg-surface-container border border-outline-variant font-mono text-xs rounded-lg hover:bg-surface-container-high">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 font-mono text-xs font-bold uppercase rounded-lg hover:opacity-90 ${danger ? 'bg-error text-white' : 'bg-primary text-white'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
