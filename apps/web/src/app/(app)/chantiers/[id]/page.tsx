import { getToken, getUser } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { formatXof } from '@/lib/copy'
import Badge from '@/components/Badge'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Users, CheckCircle, XCircle, Banknote } from 'lucide-react'
import ChantierCalendrier from './ChantierCalendrier'
import ChantierActions from './ChantierActions'

interface AgentContrat {
  id: string
  poste: string
  statut: string
  tauxJournalierXof: number
  agent: { id: string; matricule: string; nom: string; prenom: string }
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
  contrats: AgentContrat[]
}

interface PresenceCell {
  statut: string
  pointageId: string
  heureEntree: string | null
  heureSortie: string | null
  heuresSupp: number
}

interface AgentPresence {
  agentId: string
  nom: string
  matricule: string
  contratId: string
  presences: Record<string, PresenceCell | null>
  totalJours: number
  totalHeuresSupp: number
  totalSemaineXof: number
}

interface PresencesData {
  semaine: { debut: string; fin: string }
  agents: AgentPresence[]
  stats: { presentsAujourdhui: number; absentsAujourdhui: number; masseSalarialeXof: number }
}

function getSemaineActuelle(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysSinceFriday = (dayOfWeek + 2) % 7
  const friday = new Date(today)
  friday.setDate(today.getDate() - daysSinceFriday)
  return friday.toISOString().slice(0, 10)
}

export default async function ChantierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ semaine?: string }>
}) {
  const { id } = await params
  const { semaine: semaineParam } = await searchParams
  const token = await getToken()
  const user = await getUser()
  const isManager = user?.role === 'MANAGER'

  const semaine = semaineParam ?? getSemaineActuelle()

  let chantier: ChantierDetail | null = null
  let presencesData: PresencesData | null = null
  let error: string | null = null

  try {
    const [chantierRes, presencesRes] = await Promise.all([
      apiFetch<{ data: ChantierDetail }>(`/chantiers/${id}`, { token }),
      apiFetch<{ data: PresencesData }>(`/chantiers/${id}/presences?semaine=${semaine}`, { token }),
    ])
    chantier = chantierRes.data
    presencesData = presencesRes.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  const stats = presencesData?.stats
  const contratsActifs = chantier?.contrats.filter(
    (c) => c.statut === 'ACTIF' || c.statut === 'PROVISOIRE'
  ) ?? []

  return (
    <div className="p-4 lg:p-8 max-w-6xl">

      {/* Back */}
      <div className="mb-5">
        <Link
          href="/chantiers"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
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
          {/* ── Header chantier ─────────────────────────── */}
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

            <div className="border-t border-surface-soft pt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-ink-faint" />
                  <p className="text-label text-ink-faint uppercase">Heure début</p>
                </div>
                <p className="text-sm text-ink font-medium">{chantier.heureDebutStd}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-ink-faint" />
                  <p className="text-label text-ink-faint uppercase">Agents actifs</p>
                </div>
                <p className="text-sm text-ink font-medium">{contratsActifs.length}</p>
              </div>
            </div>
          </div>

          {/* ── Stats rapides ────────────────────────────── */}
          {stats && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} className="text-entree" />
                  <p className="text-label text-ink-faint uppercase">Présents</p>
                </div>
                <p className="text-stat-md font-bold text-ink font-stat">{stats.presentsAujourdhui}</p>
                <p className="text-xs text-ink-faint mt-0.5">aujourd&apos;hui</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={16} className="text-absent" />
                  <p className="text-label text-ink-faint uppercase">Absents</p>
                </div>
                <p className="text-stat-md font-bold text-ink font-stat">{stats.absentsAujourdhui}</p>
                <p className="text-xs text-ink-faint mt-0.5">aujourd&apos;hui</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Banknote size={16} className="text-encours" />
                  <p className="text-label text-ink-faint uppercase">Masse sal.</p>
                </div>
                <p className="text-sm font-bold text-ink font-stat">{formatXof(stats.masseSalarialeXof)}</p>
                <p className="text-xs text-ink-faint mt-0.5">cette semaine</p>
              </div>
            </div>
          )}

          {/* ── Calendrier de présence ───────────────────── */}
          {presencesData && (
            <ChantierCalendrier
              chantierId={id}
              semaine={presencesData.semaine.debut}
              semaineDebut={presencesData.semaine.debut}
              semaineFin={presencesData.semaine.fin}
              agents={presencesData.agents}
              isManager={isManager}
            />
          )}

          {/* ── Actions manager ──────────────────────────── */}
          {isManager && chantier.statut !== 'TERMINE' && (
            <div className="mt-5">
              <ChantierActions chantierId={id} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
