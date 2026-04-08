function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-soft ${className ?? ''}`} />
}

export default function ContratLoading() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <Skeleton className="h-4 w-36 mb-4" />
        <Skeleton className="h-7 w-48 mb-1.5" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Colonne gauche */}
        <div className="space-y-4">
          <div className="card p-5">
            <Skeleton className="h-3 w-12 mb-3" />
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28 mb-1.5" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="card p-5">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-40 w-full rounded-card" />
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          <div className="card p-5">
            <Skeleton className="h-3 w-28 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-20 mb-1.5" />
                  <Skeleton className="h-5 w-28" />
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <Skeleton className="h-3 w-16 mb-4" />
            <div className="space-y-2.5">
              <Skeleton className="h-14 w-full rounded-btn" />
              <Skeleton className="h-14 w-full rounded-btn" />
              <Skeleton className="h-14 w-full rounded-btn" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
