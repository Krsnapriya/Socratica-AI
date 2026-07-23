import { useState, useEffect } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { SkeletonTable, SkeletonCards } from './Skeletons.jsx';

export default function DatabaseMonitoringTab({ _config, loading }) {
  const [dbStats, setDbStats] = useState(null);
  const [collections, setCollections] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  useEffect(() => {
    loadDatabaseStats();
    loadCollections();
  }, []);

  async function loadDatabaseStats() {
    setStatsLoading(true);
    try {
      // In a real implementation, this would call an admin API endpoint
      // For now, we'll show mock data structure
      const mockStats = {
        totalUsers: 0,
        totalSubmissions: 0,
        totalCourses: 0,
        totalModules: 0,
        totalProblems: 0,
        totalCompilerRuns: 0,
        totalAIRequests: 0,
        storageUsage: '0 MB',
        databaseSize: '0 MB',
        indexSize: '0 MB',
      };
      setDbStats(mockStats);
    } catch (err) {
      console.error('Failed to load database stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadCollections() {
    setCollectionsLoading(true);
    try {
      // Mock collection data - in reality this would come from an admin API
      const mockCollections = [
        { name: 'users', count: 0, size: '0 KB', indexes: 3 },
        { name: 'submissions', count: 0, size: '0 KB', indexes: 4 },
        { name: 'courses', count: 0, size: '0 KB', indexes: 2 },
        { name: 'modules', count: 0, size: '0 KB', indexes: 2 },
        { name: 'problems', count: 0, size: '0 KB', indexes: 3 },
        { name: 'sessions', count: 0, size: '0 KB', indexes: 2 },
        { name: 'auditlogs', count: 0, size: '0 KB', indexes: 2 },
        { name: 'notifications', count: 0, size: '0 KB', indexes: 1 },
        { name: 'permissions', count: 0, size: '0 KB', indexes: 2 },
        { name: 'testcases', count: 0, size: '0 KB', indexes: 2 },
        { name: 'drivertemplates', count: 0, size: '0 KB', indexes: 1 },
        { name: 'referencesolutions', count: 0, size: '0 KB', indexes: 2 },
        { name: 'faillogins', count: 0, size: '0 KB', indexes: 2 },
        { name: 'systemconfigs', count: 0, size: '0 KB', indexes: 1 },
        { name: 'roles', count: 0, size: '0 KB', indexes: 1 },
        { name: 'languages', count: 0, size: '0 KB', indexes: 1 },
        { name: 'topics', count: 0, size: '0 KB', indexes: 1 },
        { name: 'aiprompts', count: 0, size: '0 KB', indexes: 2 },
        { name: 'agentroutes', count: 0, size: '0 KB', indexes: 2 },
        { name: 'analysispatterns', count: 0, size: '0 KB', indexes: 2 },
      ];
      setCollections(mockCollections);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setCollectionsLoading(false);
    }
  }

  if (loading) return <SkeletonCards count={6} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-sans text-lg font-semibold text-on-surface">Database Monitoring</h2>
          <p className="font-mono text-[10px] text-on-surface-variant">View collection sizes, document counts, and database health metrics</p>
        </div>
        <button 
          onClick={() => { loadDatabaseStats(); loadCollections(); }}
          disabled={statsLoading || collectionsLoading}
          className="font-mono text-xs px-3 py-1.5 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
        >
          <Icon name="refresh" size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
          <h3 className="font-sans text-sm font-semibold text-on-surface mb-3">Overview</h3>
          {statsLoading ? (
            <div className="space-y-2">
              <div className="h-6 bg-surface-container-highest rounded animate-pulse"></div>
              <div className="h-6 bg-surface-container-highest rounded animate-pulse"></div>
              <div className="h-6 bg-surface-container-highest rounded animate-pulse"></div>
            </div>
          ) : dbStats && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-on-surface-variant">Total Users</span><span className="font-mono text-on-surface">{dbStats.totalUsers}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Total Submissions</span><span className="font-mono text-on-surface">{dbStats.totalSubmissions}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Total Courses</span><span className="font-mono text-on-surface">{dbStats.totalCourses}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Total Modules</span><span className="font-mono text-on-surface">{dbStats.totalModules}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Total Problems</span><span className="font-mono text-on-surface">{dbStats.totalProblems}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Compiler Runs</span><span className="font-mono text-on-surface">{dbStats.totalCompilerRuns}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">AI Requests</span><span className="font-mono text-on-surface">{dbStats.totalAIRequests}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Storage Usage</span><span className="font-mono text-on-surface">{dbStats.storageUsage}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Database Size</span><span className="font-mono text-on-surface">{dbStats.databaseSize}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Index Size</span><span className="font-mono text-on-surface">{dbStats.indexSize}</span></div>
            </div>
          )}
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 lg:col-span-2">
          <h3 className="font-sans text-sm font-semibold text-on-surface mb-3">Collection Statistics</h3>
          {collectionsLoading ? (
            <SkeletonTable rows={5} cols={4} colSpan={4} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Collection</th>
                    <th className="px-4 py-3 text-right">Documents</th>
                    <th className="px-4 py-3 text-right">Size</th>
                    <th className="px-4 py-3 text-right">Indexes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {collections.map(c => (
                    <tr key={c.name} className="hover:bg-surface-container-low">
                      <td className="px-4 py-3 font-medium text-on-surface">{c.name}</td>
                      <td className="px-4 py-3 text-right text-on-surface-variant">{c.count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-on-surface-variant">{c.size}</td>
                      <td className="px-4 py-3 text-right text-on-surface-variant">{c.indexes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low">
          <h3 className="font-sans text-sm font-semibold text-on-surface">Database Operations</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-4">
            <h4 className="font-sans text-sm font-medium text-on-surface mb-2">Maintenance Actions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button className="font-mono text-xs px-3 py-2 bg-surface-container-low border border-outline-variant rounded hover:bg-surface-container-high transition-colors text-left">
                <div className="font-semibold text-on-surface">Analyze Collections</div>
                <div className="text-xs text-on-surface-variant">Run collection statistics analysis</div>
              </button>
              <button className="font-mono text-xs px-3 py-2 bg-surface-container-low border border-outline-variant rounded hover:bg-surface-container-high transition-colors text-left">
                <div className="font-semibold text-on-surface">Rebuild Indexes</div>
                <div className="text-xs text-on-surface-variant">Rebuild all collection indexes</div>
              </button>
              <button className="font-mono text-xs px-3 py-2 bg-surface-container-low border border-outline-variant rounded hover:bg-surface-container-high transition-colors text-left">
                <div className="font-semibold text-on-surface">Compact Database</div>
                <div className="text-xs text-on-surface-variant">Reclaim unused storage space</div>
              </button>
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-lg p-4">
            <h4 className="font-sans text-sm font-medium text-on-surface mb-2">Data Export</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button className="font-mono text-xs px-3 py-2 bg-surface-container-low border border-outline-variant rounded hover:bg-surface-container-high transition-colors text-left">
                <div className="font-semibold text-on-surface">Export Users</div>
                <div className="text-xs text-on-surface-variant">Export all user data (JSON)</div>
              </button>
              <button className="font-mono text-xs px-3 py-2 bg-surface-container-low border border-outline-variant rounded hover:bg-surface-container-high transition-colors text-left">
                <div className="font-semibold text-on-surface">Export Submissions</div>
                <div className="text-xs text-on-surface-variant">Export submission records</div>
              </button>
              <button className="font-mono text-xs px-3 py-2 bg-surface-container-low border border-outline-variant rounded hover:bg-surface-container-high transition-colors text-left">
                <div className="font-semibold text-on-surface">Full Backup</div>
                <div className="text-xs text-on-surface-variant">Create complete database backup</div>
              </button>
            </div>
          </div>

          <div className="bg-error/10 border border-error/30 rounded-lg p-4">
            <h4 className="font-sans text-sm font-medium text-error mb-2 flex items-center gap-2">
              <Icon name="warning" size={16} /> Destructive Actions (Protected)
            </h4>
            <p className="font-mono text-xs text-on-surface-variant mb-3">
              The following actions are restricted and require super_admin confirmation via CLI:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-surface-container-low p-2 rounded text-xs font-mono text-error">Drop Collection</div>
              <div className="bg-surface-container-low p-2 rounded text-xs font-mono text-error">Delete Database</div>
              <div className="bg-surface-container-low p-2 rounded text-xs font-mono text-error">Purge All Data</div>
              <div className="bg-surface-container-low p-2 rounded text-xs font-mono text-error">Reset Indexes</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}