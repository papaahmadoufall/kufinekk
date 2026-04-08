// Squelette générique affiché instantanément pendant que le Server Component charge
// Couvre toutes les pages de l'app sans loading.tsx spécifique

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-soft ${className ?? ''}`} />
}

export default function AppLoading() {
  return (
    <div className="p-4 lg:p-8">
      {/* Titre de page */}
      <div className="mb-6">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* 3 cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1.5" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full mb-1.5" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
