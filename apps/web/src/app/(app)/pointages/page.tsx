import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { COPY, formatHeure, formatXof } from '@/lib/copy'
import Badge from '@/components/Badge'
import { StatusDot } from '@/components/Badge'
import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'

interface Pointage {
  id: string
  dateJournee: string
  heureEntree: string
  heureSortie?: string
  totalJournalierXof?: number
  statut: string
  contrat: {
    agent: { nom: string; prenom: string; matricule: string }
    chantier: { nom: string }
  }
}

const TABS = [
  { key: '',          label: 'Tous' },
  { key: 'VALIDE',    label: 'Présents' },
  { key: 'EN_COURS',  label: 'En cours' },
  { key: 'ABSENT',    label: 'Absents' },
  { key: 'CORRIGE',   label: 'Corrigés' },
]

export default async function PointagesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; contrat_id?: string; statut?: string }>
}) {
  const token = await getToken()
  const params = await searchParams
  const query = new URLSearchParams()
  if (params.date) query.set('date', params.date)
  if (params.contrat_id) query.set('contrat_id', params.contrat_id)

  let pointages: Pointage[] = []
  let error: string | null = null

  try {
    const res = await apiFetch<{ data: Pointage[] }>(`/pointages?${query.toString()}`, { token })
    pointages = res.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  // Filtre local par statut (tab)
  const activeTab = params.statut ?? ''
  const filtered = activeTab
    ? pointages.filter((p) => p.statut === activeTab)
    : pointages

  // Date sélectionnée
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = params.date ?? today
  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-ink">Présences</h1>
          <p className="text-sm text-ink-faint mt-0.5 capitalize">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtre date */}
          <form>
            {params.statut && (
              <input type="hidden" name="statut" value={params.statut} />
            )}
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="h-11 rounded-btn border border-surface-soft bg-surface-card px-3 text-sm text-ink focus:border-brand-600 focus:ring-brand-600"
            />
          </form>
          {/* Bouton Pointer */}
          <Link
            href="/pointages/saisie"
            className="flex items-center justify-center gap-2 h-11 px-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-btn transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Pointer</span>
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="alert-error mb-5">
          {error}
        </div>
      )}

      {/* Tabs statuts */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {TABS.map(({ key, label }) => {
          const count = key
            ? pointages.filter((p) => p.statut === key).length
            : pointages.length
          const isActive = activeTab === key

          // Construire href avec params existants
          const href = new URLSearchParams({
            ...(params.date ? { date: params.date } : {}),
            ...(key ? { statut: key } : {}),
          }).toString()

          return (
            <Link
              key={key}
              href={`/pointages${href ? '?' + href : ''}`}
              className={`flex-shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-chip text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-card text-ink-muted border border-surface-soft hover:bg-surface-muted'
              }`}
            >
              {label}
              <span className={`text-xs ${isActive ? 'text-brand-200' : 'text-ink-faint'}`}>
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Liste pointages — cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-14 h-14 bg-surface-muted rounded-card flex items-center justify-center mb-4">
            <ClipboardList size={24} className="text-ink-faint" />
          </div>
          <p className="font-semibold text-ink">{COPY.empty.presences.title}</p>
          <p className="text-sm text-ink-faint mt-1">{COPY.empty.presences.body}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="card p-4 flex items-center gap-3"
            >
              {/* Statut dot */}
              <StatusDot statut={p.statut} />

              {/* Info agent */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate">
                  {p.contrat.agent.prenom} {p.contrat.agent.nom}
                </p>
                <p className="text-meta text-ink-muted truncate">
                  {p.contrat.chantier.nom} · <span className="matricule">{p.contrat.agent.matricule}</span>
                </p>
              </div>

              {/* Heures + montant */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-ink">
                  {formatHeure(p.heureEntree)}
                  {p.heureSortie && (
                    <span className="text-ink-faint"> → {formatHeure(p.heureSortie)}</span>
                  )}
                  {!p.heureSortie && (
                    <span className="text-encours text-xs font-medium ml-1">en cours</span>
                  )}
                </p>
                {p.totalJournalierXof != null ? (
                  <p className="text-xs text-ink-muted font-stat">{formatXof(p.totalJournalierXof)}</p>
                ) : (
                  <Badge statut={p.statut} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
