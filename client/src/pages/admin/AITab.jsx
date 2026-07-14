import Icon from '../../components/ui/Icon.jsx';
import { AI_DEFAULTS, FEATURE_DEFAULTS, API_KEY_ENV_HINT, DEFAULT_LIMITS } from '../../constants';
import { SkeletonTable } from './Skeletons.jsx';

export default function AITab({ config, setConfig, onSave, savingConfig, loading }) {
  if (loading) return <SkeletonTable rows={3} cols={3} colSpan={3} />;
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
        <h2 className="font-sans text-lg font-semibold text-on-surface">AI Mentor Management</h2>
        <button onClick={() => onSave('ai')} disabled={savingConfig} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-1"><Icon name="save" size={14} /> {savingConfig ? 'Saving...' : 'Save Changes'}</button>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
            <h3 className="font-sans text-sm font-semibold text-on-surface">Provider</h3>
            <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">AI Provider</label><input value={config?.ai?.provider || FEATURE_DEFAULTS.aiProvider} onChange={e => setConfig({ ...config, ai: { ...config.ai, provider: e.target.value } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
            <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Base URL</label><input value={config?.ai?.baseUrl || ''} onChange={e => setConfig({ ...config, ai: { ...config.ai, baseUrl: e.target.value } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
            <h3 className="font-sans text-sm font-semibold text-on-surface">Model</h3>
            <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Model Name</label><input value={config?.ai?.model || ''} onChange={e => setConfig({ ...config, ai: { ...config.ai, model: e.target.value } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
            <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Max Tokens</label><input type="number" value={config?.ai?.maxTokens || AI_DEFAULTS.maxTokens} onChange={e => setConfig({ ...config, ai: { ...config.ai, maxTokens: parseInt(e.target.value) } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-4">
            <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
              <input type="checkbox" checked={config?.ai?.enabled !== false} onChange={e => setConfig({ ...config, ai: { ...config.ai, enabled: e.target.checked } })} className="rounded border-outline-variant" /> AI Mentor Enabled
            </label>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded-lg p-4">
            <label className="font-mono text-[10px] text-on-surface-variant uppercase">Temperature</label>
            <input type="number" step="0.05" min="0" max="2" value={config?.ai?.temperature ?? AI_DEFAULTS.temperature} onChange={e => setConfig({ ...config, ai: { ...config.ai, temperature: parseFloat(e.target.value) } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" />
          </div>
          <div className="bg-surface-container border border-outline-variant rounded-lg p-4">
            <label className="font-mono text-[10px] text-on-surface-variant uppercase">Rate Limit (req/min)</label>
            <input type="number" value={config?.ai?.rateLimitPerMinute ?? DEFAULT_LIMITS.aiUsageStatsDays} onChange={e => setConfig({ ...config, ai: { ...config.ai, rateLimitPerMinute: parseInt(e.target.value) } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" />
          </div>
        </div>
        <div className="border-t border-outline-variant pt-4">
          <h3 className="font-sans text-sm font-semibold text-on-surface mb-2">API Key</h3>
          <div className="font-mono text-xs text-on-surface-variant space-y-1">
            <p>Status: {config?.ai?.hasApiKey ? 'Configured' : 'Not Set'}</p>
            <p className="text-warning">{API_KEY_ENV_HINT}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
