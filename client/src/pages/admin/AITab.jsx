import { useState, useEffect } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { AI_DEFAULTS, FEATURE_DEFAULTS, API_KEY_ENV_HINT, DEFAULT_LIMITS } from '../../constants';
import { SkeletonTable } from './Skeletons.jsx';
import {
  fetchAIUsageStats,
  aiAdminPlatformIntel,
  aiAdminContentQuality,
  aiSuperAdminHealth,
} from '../../api/api.js';

function UsageStatsPanel({ stats, loading }) {
  if (loading) return <div className="h-20 bg-surface-container-low rounded animate-pulse" />;
  if (!stats) return null;
  return (
    <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
      <h3 className="font-sans text-sm font-semibold text-on-surface flex items-center gap-2">
        <Icon name="analytics" size={16} className="text-primary" /> AI Usage (Last 7 Days)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Calls', value: stats.totalCalls ?? 0, icon: 'call_merge', color: 'text-primary' },
          { label: 'Tokens Used', value: stats.totalTokens ?? 0, icon: 'token', color: 'text-secondary' },
          { label: 'Avg Latency', value: `${stats.avgLatencyMs ?? 0}ms`, icon: 'timer', color: 'text-tertiary' },
          { label: 'Cache Hit Rate', value: `${stats.cacheHitRate ?? 0}%`, icon: 'cached', color: 'text-secondary' },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-low rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon name={s.icon} size={12} className={s.color} />
              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">{s.label}</span>
            </div>
            <div className="font-sans text-lg font-bold text-on-surface">{s.value}</div>
          </div>
        ))}
      </div>
      {stats.byAction && Object.keys(stats.byAction).length > 0 && (
        <div className="border-t border-outline-variant/30 pt-3">
          <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">By Action</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(stats.byAction).map(([action, count]) => (
              <span key={action} className="px-2 py-0.5 rounded-full bg-surface-container-highest border border-outline-variant/50 font-mono text-[10px] text-on-surface">
                {action}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AIInsightPanel({ title, icon, color, onRun, result, loading, description }) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-sans text-sm font-semibold text-on-surface flex items-center gap-2">
          <Icon name={icon} size={16} className={color} /> {title}
        </h3>
        <button
          onClick={onRun}
          disabled={loading}
          className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
        >
          <Icon name={loading ? 'hourglass_empty' : 'play_arrow'} size={14} />
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>
      {description && <p className="font-mono text-[10px] text-on-surface-variant">{description}</p>}
      {result && (
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/50 p-3">
          <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Result</div>
          {result.response ? (
            <p className="font-mono text-xs text-on-surface leading-relaxed whitespace-pre-wrap">{result.response}</p>
          ) : result.analysis ? (
            <p className="font-mono text-xs text-on-surface leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
          ) : result.error ? (
            <p className="font-mono text-xs text-error">{result.error}</p>
          ) : (
            <pre className="font-mono text-xs text-on-surface whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function AITab({ config, setConfig, onSave, savingConfig, loading, userRole }) {
  const [usageStats, setUsageStats] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [platformResult, setPlatformResult] = useState(null);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [healthResult, setHealthResult] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [contentResult, setContentResult] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  useEffect(() => {
    if (isAdmin) {
      setUsageLoading(true);
      fetchAIUsageStats(7)
        .then(d => setUsageStats(d && typeof d === 'object' && !Array.isArray(d) ? d : { byAction: {}, totalCalls: 0, avgLatencyMs: 0 }))
        .catch(() => {})
        .finally(() => setUsageLoading(false));
    }
  }, [isAdmin]);

  async function runPlatformIntel() {
    setPlatformLoading(true);
    try { const r = await aiAdminPlatformIntel({ message: 'Give me a platform health overview' }); setPlatformResult(r); }
    catch { setPlatformResult({ error: 'Failed to get platform intelligence' }); }
    setPlatformLoading(false);
  }

  async function runHealthCheck() {
    setHealthLoading(true);
    try { const r = await aiSuperAdminHealth({ message: 'Full system health check' }); setHealthResult(r); }
    catch { setHealthResult({ error: 'Failed to get health status' }); }
    setHealthLoading(false);
  }

  async function runContentQuality() {
    setContentLoading(true);
    try { const r = await aiAdminContentQuality({ message: 'Assess overall content quality and suggest improvements' }); setContentResult(r); }
    catch { setContentResult({ error: 'Failed to analyze content quality' }); }
    setContentLoading(false);
  }

  if (loading) return <SkeletonTable rows={3} cols={3} colSpan={3} />;
  return (
    <div className="space-y-6">
      {/* AI Configuration */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <h2 className="font-sans text-lg font-semibold text-on-surface">AI Configuration</h2>
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

      {/* AI Intelligence Panels (admin/super_admin only) */}
      {isAdmin && (
        <div className="space-y-4">
          <h2 className="font-sans text-lg font-semibold text-on-surface flex items-center gap-2">
            <Icon name="psychology" size={20} className="text-primary" /> AI Intelligence
          </h2>

          <UsageStatsPanel stats={usageStats} loading={usageLoading} />

          <AIInsightPanel
            title="Platform Intelligence"
            icon="analytics"
            color="text-primary"
            description="AI-powered analysis of platform usage, performance, and trends."
            onRun={runPlatformIntel}
            result={platformResult}
            loading={platformLoading}
          />

          <AIInsightPanel
            title="Content Quality Review"
            icon="rate_review"
            color="text-secondary"
            description="AI assessment of problem quality, test coverage, and difficulty calibration."
            onRun={runContentQuality}
            result={contentResult}
            loading={contentLoading}
          />

          {isSuperAdmin && (
            <AIInsightPanel
              title="System Health Check"
              icon="monitor_heart"
              color="text-tertiary"
              description="Comprehensive system health, infrastructure status, and capacity planning."
              onRun={runHealthCheck}
              result={healthResult}
              loading={healthLoading}
            />
          )}
        </div>
      )}
    </div>
  );
}
