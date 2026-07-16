import Icon from '../../components/ui/Icon.jsx';
import { usePublicConfig } from '../../contexts/PublicConfigContext.jsx';
import { ROLE_OPTIONS as FALLBACK_ROLES, DEFAULT_ROLE, SESSION_DURATION_HOURS } from '../../constants';
import { SkeletonTable } from './Skeletons.jsx';

export default function SettingsTab({ config, setConfig, onSave, savingConfig, loading }) {
  const pc = usePublicConfig();
  const roleOptions = pc?.roles?.map(r => r.name) || FALLBACK_ROLES;
  if (loading) return <SkeletonTable rows={4} cols={2} colSpan={2} />;
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
        <h2 className="font-sans text-lg font-semibold text-on-surface">System Settings</h2>
        <button onClick={() => onSave('platform')} disabled={savingConfig} className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-1"><Icon name="save" size={14} /> {savingConfig ? 'Saving...' : 'Save Changes'}</button>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
            <h3 className="font-sans text-sm font-semibold text-on-surface">Branding</h3>
            <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Site Name</label>
              <input value={config?.platform?.siteName || ''} onChange={e => setConfig({ ...config, platform: { ...config.platform, siteName: e.target.value } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
            <h3 className="font-sans text-sm font-semibold text-on-surface">Features</h3>
            <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant py-1">
              <input type="checkbox" checked={config?.platform?.allowRegistration !== false} onChange={e => setConfig({ ...config, platform: { ...config.platform, allowRegistration: e.target.checked } })} className="rounded border-outline-variant" /> Allow Registration
            </label>
            <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant py-1">
              <input type="checkbox" checked={config?.platform?.maintenanceMode === true} onChange={e => setConfig({ ...config, platform: { ...config.platform, maintenanceMode: e.target.checked } })} className="rounded border-outline-variant" /> Maintenance Mode
            </label>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
            <h3 className="font-sans text-sm font-semibold text-on-surface">Defaults</h3>
            <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Default Role</label>
              <select value={config?.platform?.defaultRole || DEFAULT_ROLE} onChange={e => setConfig({ ...config, platform: { ...config.platform, defaultRole: e.target.value } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1">
                {roleOptions.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select></div>
            <div><label className="font-mono text-[10px] text-on-surface-variant uppercase">Session Duration (hours)</label>
              <input type="number" value={config?.platform?.sessionDurationHours || SESSION_DURATION_HOURS} onChange={e => setConfig({ ...config, platform: { ...config.platform, sessionDurationHours: parseInt(e.target.value) } })} className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-mono text-on-surface mt-1" /></div>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
            <h3 className="font-sans text-sm font-semibold text-on-surface">Hints</h3>
            <label className="flex items-center gap-2 font-mono text-xs text-on-surface-variant py-1">
              <input type="checkbox" checked={config?.platform?.enableAIHints !== false} onChange={e => setConfig({ ...config, platform: { ...config.platform, enableAIHints: e.target.checked } })} className="rounded border-outline-variant" /> Hints & Explanations
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
