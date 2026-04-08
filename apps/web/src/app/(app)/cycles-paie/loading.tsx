function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-soft ${className ?? ''}`} />
}

export default function CyclesPaieLoading() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-5">
        <Skeleton className="h-7 w-44 mb-1.5" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card p-4">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="card p-4">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>

      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
