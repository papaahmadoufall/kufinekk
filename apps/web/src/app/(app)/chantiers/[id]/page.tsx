import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { COPY, formatXof } from '@/lib/copy'
import Badge from '@/components/Badge'
import { StatusDot } from '@/components/Badge'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Users, Calendar, Plus } from 'lucide-react'

interface AgentContrat {
  id: string
  poste: string
  typeContrat: string
  statut: string
  tauxJournalierXof: number
  agent: {
    id: string
    matricule: string
    nom: string
    prenom: string
    telephone: string
  }
}

interface ChantierDetail {
  id: string
  nom: string
  adresse?: string
  dateDebut: string
  dateFinPrevue?: string
  statut: string
  heureDebutStd: string
  seuilHeuresNormales: number
  createdAt: string
  contrats: AgentContrat[]
}

export default async function ChantierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const token = await getToken()

  let chantier: ChantierDetail | null = null
  let error: string | null = null

  try {
    const res = await apiFetch<{ data: ChantierDetail }>(`/chantiers/${id}`, { token })
    chantier = res.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  const contratsActifs = chantier?.contrats.filter(
    (c) => c.statut === 'ACTIF' || c.statut === 'PROVISOIRE'
  ) ?? []

  return (
    <div className="p-4 lg:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/chantiers"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4"
        >
          <ArrowLeft size={16} />
          Retour aux chantiers
        </Link>
      </div>

      {error && (
        <div role="alert" className="alert-error mb-5">{error}</div>
      )}

      {chantier && (
        <>
          {/* Infos chantier */}
          <div className="card p-5 mb-4">
            <div className="flex items-start justify-between mb-3">
              <h1 className="text-xl font-bold text-ink pr-2">{chantier.nom}</h1>
              <Badge statut={chantier.statut} size="md" />
            </div>

            {chantier.adresse && (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted mb-4">
                <MapPin size={14} className="flex-shrink-0 text-ink-faint" />
                {chantier.adresse}
              </p>
            )}

            <div className="border-t border-surface-soft pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-label text-ink-faint uppercase">Début</p>
                <p className="text-sm text-ink font-medium">
                  {new Date(chantier.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {chantier.dateFinPrevue && (
                <div>
                  <p className="text-label text-ink-faint uppercase">Fin prévue</p>
                  <p className="text-sm text-ink font-medium">
                    {new Date(chantier.dateFinPrevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-label text-ink-faint uppercase">Heure début</p>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-ink-faint" />
                  <p className="text-sm text-ink font-medium">{chantier.heureDebutStd}</p>
                </div>
              </div>
              <div>
                <p className="text-label text-ink-faint uppercase">Heures normales</p>
                <p className="text-sm text-ink font-medium">{chantier.seuilHeuresNormales}h / jour</p>
              </div>
            </div>
          </div>

          {/* Agents sur ce chantier */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-label mb-0">
              Agents ({contratsActifs.length})
            </h2>
            <Link
              href="/agents/nouveau"
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              <Plus size={16} />
              Ajouter
            </Link>
          </div>

          {contratsActifs.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="w-12 h-12 bg-surface-muted rounded-card flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-ink-faint" />
              </div>
              <p className="font-semibold text-ink">Aucun agent</p>
              <p className="text-sm text-ink-faint mt-1">Rattachez des agents à ce chantier pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contratsActifs.map((c) => (
                <Link
                  key={c.id}
                  href={`/agents/${c.agent.id}`}
                  className="agent-card"
                >
                  <div className="avatar-initials w-10 h-10 rounded-full text-sm">
                    {c.agent.prenom[0]}{c.agent.nom[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusDot statut={c.statut} />
                      <p className="font-semibold text-ink truncate">
                        {c.agent.prenom} {c.agent.nom}
                      </p>
                    </div>
                    <p className="text-meta text-ink-muted truncate mt-0.5">
                      {c.poste} · <span className="matricule">{c.agent.matricule}</span>
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-ink font-stat">{formatXof(c.tauxJournalierXof)}</p>
                    <Badge statut={c.statut} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
