import { getToken, getUser } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { formatXof } from '@/lib/copy'
import KufinekkBadge from '@/components/Badge'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Users, CheckCircle, XCircle, Banknote } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardAction,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
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

function StatCard({
  icon,
  iconClassName,
  label,
  value,
  hint,
  valueClassName = 'font-stat text-stat-md font-bold',
}: {
  icon: React.ReactNode
  iconClassName: string
  label: string
  value: React.ReactNode
  hint: string
  valueClassName?: string
}) {
  return (
    <Card size="sm" className="bg-surface-card">
      <CardContent>
        <div className="mb-1 flex items-center gap-2">
          <span className={iconClassName}>{icon}</span>
          <p className="text-label uppercase text-ink-faint">{label}</p>
        </div>
        <p className={`text-ink ${valueClassName}`}>{value}</p>
        <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>
      </CardContent>
    </Card>
  )
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
    <div className="max-w-6xl p-4 lg:p-8">
      {/* Back */}
      <div className="mb-5">
        <Link
          href="/chantiers"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} />
          Retour aux chantiers
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5">
          <XCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {chantier && (
        <>
          {/* ── Header chantier ─────────────────────────── */}
          <Card className="mb-4 bg-surface-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-ink">
                {chantier.nom}
              </CardTitle>
              {chantier.adresse && (
                <CardDescription className="flex items-center gap-1.5 text-ink-muted">
                  <MapPin size={14} className="flex-shrink-0 text-ink-faint" />
                  {chantier.adresse}
                </CardDescription>
              )}
              <CardAction>
                <KufinekkBadge statut={chantier.statut} size="md" />
              </CardAction>
            </CardHeader>

            <Separator className="bg-surface-soft" />

            <CardContent className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div>
                <p className="text-label uppercase text-ink-faint">Début</p>
                <p className="text-sm font-medium text-ink">
                  {new Date(chantier.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {chantier.dateFinPrevue && (
                <div>
                  <p className="text-label uppercase text-ink-faint">Fin prévue</p>
                  <p className="text-sm font-medium text-ink">
                    {new Date(chantier.dateFinPrevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-ink-faint" />
                  <p className="text-label uppercase text-ink-faint">Heure début</p>
                </div>
                <p className="text-sm font-medium text-ink">{chantier.heureDebutStd}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-ink-faint" />
                  <p className="text-label uppercase text-ink-faint">Agents actifs</p>
                </div>
                <p className="text-sm font-medium text-ink">{contratsActifs.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* ── Stats rapides ────────────────────────────── */}
          {stats && (
            <div className="mb-5 grid grid-cols-3 gap-3">
              <StatCard
                icon={<CheckCircle size={16} />}
                iconClassName="text-entree"
                label="Présents"
                value={stats.presentsAujourdhui}
                hint="aujourd'hui"
              />
              <StatCard
                icon={<XCircle size={16} />}
                iconClassName="text-absent"
                label="Absents"
                value={stats.absentsAujourdhui}
                hint="aujourd'hui"
              />
              <StatCard
                icon={<Banknote size={16} />}
                iconClassName="text-encours"
                label="Masse sal."
                value={formatXof(stats.masseSalarialeXof)}
                hint="cette semaine"
                valueClassName="font-stat text-sm font-bold"
              />
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
