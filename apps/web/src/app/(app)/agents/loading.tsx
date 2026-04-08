function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-soft ${className ?? ''}`} />
}

export default function AgentsLoading() {
  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <Skeleton className="h-7 w-32 mb-1.5" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-32 rounded-btn" />
      </div>

      {/* Barre de recherche */}
      <Skeleton className="h-10 w-full rounded-btn mb-4" />

      {/* Cartes agents */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-36 mb-1.5" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
