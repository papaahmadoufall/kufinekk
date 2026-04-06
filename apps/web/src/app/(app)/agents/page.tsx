import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { COPY } from '@/lib/copy'
import Badge from '@/components/Badge'
import { StatusDot } from '@/components/Badge'
import Link from 'next/link'
import { Plus, Phone, Search } from 'lucide-react'

interface Agent {
  id: string
  matricule: string
  nom: string
  prenom: string
  telephone: string
  contratActif?: {
    poste: string
    chantier: { nom: string }
    statut: string
  }
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; chantier_id?: string }>
}) {
  const token = await getToken()
  const params = await searchParams
  const query = new URLSearchParams()
  if (params.chantier_id) query.set('chantier_id', params.chantier_id)

  let agents: Agent[] = []
  let error: string | null = null
  let total = 0

  try {
    const res = await apiFetch<{ data: Agent[]; meta: { total: number } }>(
      `/agents?${query.toString()}`,
      { token }
    )
    agents = res.data
    total = res.meta.total

    if (params.q) {
      const q = params.q.toLowerCase()
      agents = agents.filter(
        (a) =>
          a.nom.toLowerCase().includes(q) ||
          a.prenom.toLowerCase().includes(q) ||
          a.matricule.toLowerCase().includes(q) ||
          a.telephone.includes(q)
      )
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-ink">Agents</h1>
          <p className="text-sm text-ink-faint mt-0.5">
            {total} agent{total > 1 ? 's' : ''} au total
          </p>
        </div>
        <Link
          href="/agents/nouveau"
          className="flex items-center justify-center gap-2 h-11 px-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-btn transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouvel agent</span>
          <span className="sm:hidden">Ajouter</span>
        </Link>
      </div>

      {/* Recherche */}
      <form className="mb-5">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Nom, matricule, téléphone…"
            className="input-field pl-10"
          />
        </div>
      </form>

      {error && (
        <div role="alert" className="alert-error mb-5">
          {error}
        </div>
      )}

      {/* Liste agents — cards mobile */}
      {agents.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-14 h-14 bg-surface-muted rounded-card flex items-center justify-center mb-4">
            <Phone size={24} className="text-ink-faint" />
          </div>
          <p className="font-semibold text-ink">
            {params.q ? 'Aucun résultat' : COPY.empty.agents.title}
          </p>
          <p className="text-sm text-ink-faint mt-1 max-w-xs">
            {params.q ? `Aucun agent trouvé pour "${params.q}"` : COPY.empty.agents.body}
          </p>
          {!params.q && (
            <Link
              href="/agents/nouveau"
              className="mt-5 flex items-center gap-2 h-11 px-5 bg-brand-600 text-white text-sm font-semibold rounded-btn hover:bg-brand-700 transition-colors"
            >
              <Plus size={16} />
              {COPY.empty.agents.cta}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`} className="agent-card">
              {/* Avatar initiales */}
              <div className="avatar-initials w-10 h-10 rounded-full text-sm">
                {agent.prenom[0]}{agent.nom[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {agent.contratActif && (
                    <StatusDot statut={agent.contratActif.statut} />
                  )}
                  <p className="font-semibold text-ink truncate">
                    {agent.prenom} {agent.nom}
                  </p>
                </div>
                <p className="text-meta text-ink-muted truncate mt-0.5">
                  {agent.contratActif
                    ? `${agent.contratActif.poste} · ${agent.contratActif.chantier.nom}`
                    : agent.telephone}
                </p>
              </div>

              {/* Badge statut */}
              <div className="flex-shrink-0">
                {agent.contratActif ? (
                  <Badge statut={agent.contratActif.statut} />
                ) : (
                  <span className="text-xs text-ink-faint">Sans contrat</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
