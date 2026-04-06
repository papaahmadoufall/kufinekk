import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, QrCode } from 'lucide-react'
import BadgesGrid from './BadgesGrid'

interface Agent {
  id: string
  matricule: string
  nom: string
  prenom: string
  telephone: string
  qrCodeUrl?: string
  contratActif?: {
    poste: string
    chantier: { id: string; nom: string }
    statut: string
  }
}

interface Chantier {
  id: string
  nom: string
}

export default async function BadgesPage({
  searchParams,
}: {
  searchParams: Promise<{ chantier_id?: string }>
}) {
  const token = await getToken()
  const params = await searchParams
  const query = new URLSearchParams()
  if (params.chantier_id) query.set('chantier_id', params.chantier_id)

  let agents: Agent[] = []
  let chantiers: Chantier[] = []
  let error: string | null = null

  try {
    const [agentsRes, chantiersRes] = await Promise.all([
      apiFetch<{ data: Agent[] }>(`/agents?${query.toString()}`, { token }),
      apiFetch<{ data: Chantier[] }>('/chantiers?statut=actif', { token }),
    ])
    agents = agentsRes.data
    chantiers = chantiersRes.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  const selectedChantier = chantiers.find(c => c.id === params.chantier_id)

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="mb-5 print:hidden">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-2"
        >
          <ArrowLeft size={16} />
          Retour aux agents
        </Link>
        <div className="flex items-center gap-2.5">
          <QrCode size={22} className="text-brand-600" />
          <h1 className="text-xl lg:text-2xl font-bold text-ink">Badges agents</h1>
        </div>
        <p className="text-sm text-ink-faint mt-0.5">
          {agents.length} badge{agents.length > 1 ? 's' : ''}
          {selectedChantier ? ` · ${selectedChantier.nom}` : ''}
        </p>
      </div>

      {/* Filtre chantier */}
      {chantiers.length > 0 && (
        <form className="mb-5 print:hidden" method="GET">
          <select
            name="chantier_id"
            defaultValue={params.chantier_id ?? ''}
            className="input-field max-w-xs"
          >
            <option value="">Tous les chantiers</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
          <button type="submit" className="sr-only">Filtrer</button>
        </form>
      )}

      {error && (
        <div role="alert" className="alert-error mb-5 print:hidden">{error}</div>
      )}

      {agents.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center print:hidden">
          <div className="w-14 h-14 bg-surface-muted rounded-card flex items-center justify-center mb-4">
            <QrCode size={24} className="text-ink-faint" />
          </div>
          <p className="font-semibold text-ink">Aucun agent</p>
          <p className="text-sm text-ink-faint mt-1">
            Ajoutez des agents pour générer leurs badges.
          </p>
          <Link
            href="/agents/nouveau"
            className="mt-5 inline-flex items-center gap-2 h-11 px-5 bg-brand-600 text-white text-sm font-semibold rounded-btn hover:bg-brand-700 transition-colors"
          >
            Nouvel agent
          </Link>
        </div>
      ) : (
        <BadgesGrid agents={agents} />
      )}
    </div>
  )
}
