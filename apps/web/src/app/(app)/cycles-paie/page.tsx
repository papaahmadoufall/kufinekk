import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { COPY, formatXof } from '@/lib/copy'
import Badge from '@/components/Badge'
import { Banknote, FileText } from 'lucide-react'

interface Cycle {
  id: string
  semaineDebut: string
  semaineFin: string
  totalHebdoXof: number
  statut: string
  contrat: {
    agent: { nom: string; prenom: string; matricule: string }
    chantier: { nom: string }
  }
}

export default async function CyclesPaiePage() {
  const token = await getToken()

  let cycles: Cycle[] = []
  let error: string | null = null

  try {
    const res = await apiFetch<{ data: Cycle[] }>('/cycles-paie', { token })
    cycles = res.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  const totalPaye = cycles
    .filter((c) => c.statut === 'PAYE')
    .reduce((s, c) => s + c.totalHebdoXof, 0)

  const totalEnAttente = cycles
    .filter((c) => c.statut === 'VALIDE')
    .reduce((s, c) => s + c.totalHebdoXof, 0)

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl lg:text-2xl font-bold text-ink">Paie</h1>
        <p className="text-sm text-ink-faint mt-0.5">
          {cycles.length} cycle{cycles.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-entree-light border border-entree-subtle rounded-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote size={16} className="text-entree-text" />
            <p className="text-xs font-semibold text-entree-text">Déjà payé</p>
          </div>
          <p className="text-xl font-bold text-entree-text font-stat">{formatXof(totalPaye)}</p>
        </div>
        <div className="bg-sortie-light border border-entree-subtle rounded-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote size={16} className="text-sortie-text" />
            <p className="text-xs font-semibold text-sortie-text">En attente</p>
          </div>
          <p className="text-xl font-bold text-sortie-text font-stat">{formatXof(totalEnAttente)}</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="alert-error mb-5">
          {error}
        </div>
      )}

      {cycles.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-14 h-14 bg-surface-muted rounded-card flex items-center justify-center mb-4">
            <FileText size={24} className="text-ink-faint" />
          </div>
          <p className="font-semibold text-ink">{COPY.empty.cycles.title}</p>
          <p className="text-sm text-ink-faint mt-1 max-w-xs">{COPY.empty.cycles.body}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cycles.map((c) => {
            const debut = new Date(c.semaineDebut).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })
            const fin = new Date(c.semaineFin).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })

            return (
              <div
                key={c.id}
                className="card p-4 flex items-center gap-3"
              >
                {/* Info agent */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">
                    {c.contrat.agent.prenom} {c.contrat.agent.nom}
                  </p>
                  <p className="text-meta text-ink-muted truncate mt-0.5">
                    {c.contrat.chantier.nom} · {debut} → {fin}
                  </p>
                </div>

                {/* Montant + statut */}
                <div className="text-right flex-shrink-0 space-y-1">
                  <p className="text-sm font-bold text-ink font-stat">{formatXof(c.totalHebdoXof)}</p>
                  <Badge statut={c.statut} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
