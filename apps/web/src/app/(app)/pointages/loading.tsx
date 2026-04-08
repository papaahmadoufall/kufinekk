function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-soft ${className ?? ''}`} />
}

export default function PointagesLoading() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-5">
        <Skeleton className="h-7 w-40 mb-1.5" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-btn" />
        ))}
      </div>

      {/* Lignes */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className="flex-1">
              <Skeleton className="h-4 w-40 mb-1.5" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
