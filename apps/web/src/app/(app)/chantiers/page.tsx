import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { COPY } from '@/lib/copy'
import Badge from '@/components/Badge'
import Link from 'next/link'
import { MapPin, Users, Plus, HardHat } from 'lucide-react'

interface Chantier {
  id: string
  nom: string
  adresse?: string
  statut: string
  dateDebut: string
  _count?: { contrats: number }
}

export default async function ChantiersPage() {
  const token = await getToken()

  let chantiers: Chantier[] = []
  let error: string | null = null

  try {
    const res = await apiFetch<{ data: Chantier[] }>('/chantiers', { token })
    chantiers = res.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-ink">Chantiers</h1>
          <p className="text-sm text-ink-faint mt-0.5">
            {chantiers.length} chantier{chantiers.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/chantiers/nouveau"
          className="flex items-center justify-center gap-2 h-11 px-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-btn transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau chantier</span>
          <span className="sm:hidden">Nouveau</span>
        </Link>
      </div>

      {error && (
        <div role="alert" className="alert-error mb-5">
          {error}
        </div>
      )}

      {chantiers.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-14 h-14 bg-surface-muted rounded-card flex items-center justify-center mb-4">
            <HardHat size={24} className="text-ink-faint" />
          </div>
          <p className="font-semibold text-ink">{COPY.empty.chantiers.title}</p>
          <p className="text-sm text-ink-faint mt-1 max-w-xs">{COPY.empty.chantiers.body}</p>
          <Link
            href="/chantiers/nouveau"
            className="mt-5 flex items-center gap-2 h-11 px-5 bg-brand-600 text-white text-sm font-semibold rounded-btn hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} />
            {COPY.empty.chantiers.cta}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {chantiers.map((c) => (
            <Link
              key={c.id}
              href={`/chantiers/${c.id}`}
              className="card p-5 hover:border-brand-200 hover:shadow-float transition-all active:scale-[0.99]"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-ink text-base leading-tight pr-2">{c.nom}</h3>
                <Badge statut={c.statut} />
              </div>

              {c.adresse && (
                <p className="flex items-center gap-1.5 text-sm text-ink-muted mb-2.5">
                  <MapPin size={14} className="flex-shrink-0 text-ink-faint" />
                  <span className="truncate">{c.adresse}</span>
                </p>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-soft">
                <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <Users size={14} className="text-ink-faint" />
                  {c._count?.contrats ?? 0} agent{(c._count?.contrats ?? 0) > 1 ? 's' : ''}
                </span>
                <span className="text-xs text-ink-faint">
                  Depuis {new Date(c.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
