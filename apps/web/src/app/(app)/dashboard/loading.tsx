function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-soft ${className ?? ''}`} />
}

export default function DashboardLoading() {
  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Raccourci pointage */}
      <div className="card p-5 mb-4">
        <Skeleton className="h-5 w-40 mb-3" />
        <Skeleton className="h-12 w-full rounded-btn" />
      </div>

      {/* Liste récente */}
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-28 mb-1.5" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
