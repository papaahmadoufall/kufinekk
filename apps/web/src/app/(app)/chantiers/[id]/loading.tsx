export default function Loading() {
  return (
    <div className="p-4 lg:p-8 max-w-6xl animate-pulse">
      {/* Back link */}
      <div className="h-5 w-40 bg-surface-soft rounded mb-5" />

      {/* Header card */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="h-6 w-48 bg-surface-soft rounded" />
          <div className="h-6 w-16 bg-surface-soft rounded-full" />
        </div>
        <div className="h-4 w-32 bg-surface-muted rounded mb-4" />
        <div className="border-t border-surface-soft pt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-3 w-12 bg-surface-muted rounded mb-1.5" />
              <div className="h-4 w-24 bg-surface-soft rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-3 w-16 bg-surface-muted rounded mb-2" />
            <div className="h-7 w-10 bg-surface-soft rounded" />
          </div>
        ))}
      </div>

      {/* Calendar skeleton */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-soft bg-surface-muted flex items-center justify-between">
          <div className="h-6 w-6 bg-surface-soft rounded" />
          <div className="h-4 w-36 bg-surface-soft rounded" />
          <div className="h-6 w-6 bg-surface-soft rounded" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="h-9 w-36 bg-surface-muted rounded" />
              {[...Array(7)].map((_, j) => (
                <div key={j} className="h-9 w-9 bg-surface-soft rounded-lg" />
              ))}
              <div className="h-4 w-8 bg-surface-muted rounded ml-auto" />
              <div className="h-4 w-8 bg-surface-muted rounded" />
              <div className="h-4 w-20 bg-surface-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
