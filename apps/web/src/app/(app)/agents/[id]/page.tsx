import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { COPY, formatXof } from '@/lib/copy'
import Badge from '@/components/Badge'
import QrCodeCard from '@/components/QrCodeCard'
import Link from 'next/link'
import { ArrowLeft, Phone, MapPin, Briefcase, Calendar } from 'lucide-react'

interface Contrat {
  id: string
  poste: string
  typeContrat: string
  statut: string
  tauxJournalierXof: number
  tauxHeureSuppXof?: number
  dateDebut: string
  dateFin?: string
  chantier: { id: string; nom: string }
}

interface AgentDetail {
  id: string
  matricule: string
  telephone: string
  nom: string
  prenom: string
  telephoneVerifie: boolean
  qrCodeUrl?: string
  createdAt: string
  contrats: Contrat[]
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const token = await getToken()

  let agent: AgentDetail | null = null
  let error: string | null = null

  try {
    const res = await apiFetch<{ data: AgentDetail }>(`/agents/${id}`, { token })
    agent = res.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  const contratActif = agent?.contrats.find(
    (c) => c.statut === 'ACTIF' || c.statut === 'PROVISOIRE'
  )
  const contratsTermines = agent?.contrats.filter((c) => c.statut === 'TERMINE') ?? []

  return (
    <div className="p-4 lg:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4"
        >
          <ArrowLeft size={16} />
          Retour aux agents
        </Link>
      </div>

      {error && (
        <div role="alert" className="alert-error mb-5">{error}</div>
      )}

      {agent && (
        <>
          {/* Profil agent */}
          <div className="card p-5 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="avatar-initials w-16 h-16 rounded-full text-2xl">
                {agent.prenom[0]}{agent.nom[0]}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-ink">{agent.prenom} {agent.nom}</h1>
                <p className="matricule text-base">{agent.matricule}</p>
              </div>
            </div>

            <div className="border-t border-surface-soft pt-4 space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-ink-muted">
                <Phone size={15} className="text-ink-faint flex-shrink-0" />
                <span>{agent.telephone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-ink-muted">
                <Calendar size={15} className="text-ink-faint flex-shrink-0" />
                <span>Inscrit le {new Date(agent.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Badge / QR Code */}
          {agent.qrCodeUrl && (
            <div className="mb-4">
              <QrCodeCard
                matricule={agent.matricule}
                qrCodeUrl={agent.qrCodeUrl}
                nom={agent.nom}
                prenom={agent.prenom}
              />
            </div>
          )}

          {/* Contrat actif */}
          <h2 className="section-label">Contrat actif</h2>
          {contratActif ? (
            <div className="card p-5 mb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link href={`/contrats/${contratActif.id}`} className="font-bold text-ink text-base hover:text-brand-600">
                    {contratActif.poste}
                  </Link>
                  <div className="flex items-center gap-1.5 text-sm text-ink-muted mt-0.5">
                    <MapPin size={14} className="text-ink-faint" />
                    <Link href={`/chantiers/${contratActif.chantier.id}`} className="hover:text-brand-600">
                      {contratActif.chantier.nom}
                    </Link>
                  </div>
                </div>
                <Badge statut={contratActif.statut} />
              </div>

              <div className="border-t border-surface-soft pt-3 mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-label text-ink-faint uppercase">Taux journalier</p>
                  <p className="text-base font-bold text-ink font-stat">{formatXof(contratActif.tauxJournalierXof)}</p>
                </div>
                {contratActif.tauxHeureSuppXof && (
                  <div>
                    <p className="text-label text-ink-faint uppercase">Taux h. supp.</p>
                    <p className="text-base font-bold text-ink font-stat">{formatXof(contratActif.tauxHeureSuppXof)}/h</p>
                  </div>
                )}
                <div>
                  <p className="text-label text-ink-faint uppercase">Type</p>
                  <p className="text-sm text-ink">{contratActif.typeContrat === 'CONTRACTUEL' ? 'Contractuel' : 'Non-contractuel'}</p>
                </div>
                <div>
                  <p className="text-label text-ink-faint uppercase">Début</p>
                  <p className="text-sm text-ink">{new Date(contratActif.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-5 mb-4 text-center">
              <p className="text-sm text-ink-faint">Aucun contrat actif</p>
              <Link
                href={`/agents/${id}/rattacher`}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-btn hover:bg-brand-700 transition-colors"
              >
                <Briefcase size={16} />
                {COPY.actions.rattacher}
              </Link>
            </div>
          )}

          {/* Historique contrats */}
          {contratsTermines.length > 0 && (
            <>
              <h2 className="section-label">Historique</h2>
              <div className="space-y-2">
                {contratsTermines.map((c) => (
                  <Link key={c.id} href={`/contrats/${c.id}`} className="card p-4 flex items-center gap-3 hover:bg-surface-muted transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink truncate">{c.poste}</p>
                      <p className="text-meta text-ink-muted truncate">
                        {c.chantier.nom} · {new Date(c.dateDebut).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        {c.dateFin && ` → ${new Date(c.dateFin).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`}
                      </p>
                    </div>
                    <Badge statut={c.statut} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
