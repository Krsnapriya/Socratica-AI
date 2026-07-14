import Icon from '../../components/ui/Icon.jsx';
import { LANGUAGE_IDS, COMPILER_DEFAULTS, SANDBOX_INFO } from '../../constants';
import { SkeletonTable } from './Skeletons.jsx';

export default function CompilerTab({ config, setConfig, onSave, savingConfig, loading }) {
  if (loading) return <SkeletonTable rows={3} cols={3} colSpan={3} />;
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
        <h2 className="font-sans text-lg font-semibold text-on-surface">Compiler Management</h2>
        <button onClick={() => onSave('compiler')} disabled={savingConfig} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-1"><Icon name="save" size={14} /> {savingConfig ? 'Saving...' : 'Save Changes'}</button>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <h3 className="font-sans text-sm font-semibold text-on-surface mb-3">Supported Languages</h3>
          <div className="space-y-4">
            {LANGUAGE_IDS.map(lang => {
              const lc = config?.compiler?.languages?.[lang] || {};
              const defaults = COMPILER_DEFAULTS[lang] || {};
              return (
                <div key={lang} className="bg-surface-container border border-outline-variant rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-semibold text-on-surface capitalize">{lang}</span>
                    <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
                      <input type="checkbox" checked={lc.enabled !== false} onChange={e => setConfig({ ...config, compiler: { ...config.compiler, languages: { ...config.compiler?.languages, [lang]: { ...lc, enabled: e.target.checked } } } })} className="rounded border-outline-variant" /> Enabled
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Memory (MB)</label><input type="number" value={lc.memoryMb || defaults.memoryMb || 256} onChange={e => setConfig({ ...config, compiler: { ...config.compiler, languages: { ...config.compiler?.languages, [lang]: { ...lc, memoryMb: parseInt(e.target.value) } } } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
                    <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Timeout (ms)</label><input type="number" value={lc.timeoutMs || defaults.timeoutMs || 8000} onChange={e => setConfig({ ...config, compiler: { ...config.compiler, languages: { ...config.compiler?.languages, [lang]: { ...lc, timeoutMs: parseInt(e.target.value) } } } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t border-outline-variant pt-4">
          <h3 className="font-sans text-sm font-semibold text-on-surface mb-2">Infrastructure</h3>
          <div className="font-mono text-xs text-on-surface-variant space-y-1">
            <p>Sandbox images: {Object.values(SANDBOX_INFO.images).join(', ')}</p>
            <p>Execution engine: {SANDBOX_INFO.engine}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
