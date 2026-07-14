export function SkeletonLine({ width = '100%', height = '1rem', className = '' }) {
  return <div className={`bg-surface-container animate-pulse rounded ${className}`} style={{ width, height }} />;
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <div className="flex items-center gap-4 py-3 px-6">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? '40%' : '20%'} height="0.75rem" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, colSpan = 4 }) {
  return (
    <table className="w-full text-left font-mono text-sm">
      <thead className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
        <tr><th className="px-6 py-4" colSpan={colSpan}><div className="h-3 bg-surface-container rounded w-32 animate-pulse" /></th></tr>
      </thead>
      <tbody className="divide-y divide-outline-variant/50">
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="hover:bg-surface-container-low">
            <td colSpan={colSpan} className="px-6 py-3">
              <div className="flex gap-4">
                {Array.from({ length: cols }).map((_, j) => (
                  <SkeletonLine key={j} width={`${60 - j * 10}%`} height="0.75rem" />
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-container-low border border-outline-variant rounded-xl p-5 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container" />
            <div className="space-y-2 flex-1">
              <SkeletonLine width="60%" height="0.625rem" />
              <SkeletonLine width="40%" height="1.25rem" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
