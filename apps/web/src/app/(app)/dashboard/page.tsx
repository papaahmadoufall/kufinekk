import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { formatXof } from '@/lib/copy'
import { Users, UserCheck, Clock, AlertCircle, Banknote, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Resume {
  date: string
  totalAgentsActifs: number
  presentAujourdhui: number
  enCoursEntree: number
  absentAujourdhui: number
  agentsEnAttente: number
  totalJourneeXof: number
}

interface Semaine {
  semaineDebut: string
  semaineFin: string
  totalJourneesPointees: number
  masseSalarialeXof: number
  detailParChantier: {
    chantierId: string
    chantierNom: string
    totalXof: number
    nbJournees: number
  }[]
}

export default async function DashboardPage() {
  const token = await getToken()

  let resume: Resume | null = null
  let semaine: Semaine | null = null
  let error: string | null = null

  try {
    const [r, s] = await Promise.all([
      apiFetch<{ data: Resume }>('/dashboard/resume', { token }),
      apiFetch<{ data: Semaine }>('/dashboard/semaine', { token }),
    ])
    resume = r.data
    semaine = s.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  const dateLabel = resume?.date
    ? new Date(resume.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-ink capitalize">{dateLabel}</h1>
        <p className="text-sm text-ink-faint mt-0.5">Tableau de bord</p>
      </div>

      {error && (
        <div role="alert" className="alert-error mb-6">
          {error} —{' '}
          <a href="/dashboard" className="underline font-medium">Réessayer</a>
        </div>
      )}

      {/* Raccourci pointage — bouton principal pour les pointeurs */}
      <Link
        href="/pointages/saisie"
        className="flex items-center justify-between w-full bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white rounded-card p-5 mb-6 transition-all shadow-float"
      >
        <div>
          <p className="text-lg font-bold font-display uppercase tracking-wide">Pointer un agent</p>
          <p className="text-sm text-brand-200 mt-0.5">Entrée ou sortie du chantier</p>
        </div>
        <Clock size={32} className="text-brand-200 flex-shrink-0" />
      </Link>

      {/* Stats du jour */}
      <h2 className="section-label">Aujourd'hui</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Présents"
          value={resume?.presentAujourdhui ?? '—'}
          icon={UserCheck}
          colorClass="bg-entree-light text-entree-text"
          href="/pointages?statut=VALIDE"
        />
        <StatCard
          label="En cours"
          value={resume?.enCoursEntree ?? '—'}
          sub="Sans sortie"
          icon={Clock}
          colorClass="bg-encours-light text-encours-text"
          href="/pointages?statut=EN_COURS"
        />
        <StatCard
          label="Absents"
          value={resume?.absentAujourdhui ?? '—'}
          icon={AlertCircle}
          colorClass="bg-absent-light text-absent-text"
          href="/pointages?statut=ABSENT"
        />
        <StatCard
          label="En attente"
          value={resume?.agentsEnAttente ?? '—'}
          sub="Contrats provisoires"
          icon={Users}
          colorClass="bg-provisoire-light text-provisoire-text"
          href="/agents"
        />
      </div>

      {/* Total journée */}
      {resume && (
        <div className="card p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 rounded-icon">
              <Banknote size={20} className="text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-ink-faint font-medium">Total journée</p>
              <p className="text-lg font-bold text-ink font-stat">{formatXof(resume.totalJourneeXof)}</p>
            </div>
          </div>
          <span className="text-xs text-ink-faint">{resume.totalAgentsActifs} agents actifs</span>
        </div>
      )}

      {/* Stats semaine */}
      <h2 className="section-label">Cette semaine</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label="Journées pointées"
          value={semaine?.totalJourneesPointees ?? '—'}
          icon={TrendingUp}
          colorClass="bg-sortie-light text-sortie-text"
        />
        <StatCard
          label="Masse salariale"
          value={semaine ? formatXof(semaine.masseSalarialeXof) : '—'}
          icon={Banknote}
          colorClass="bg-entree-light text-entree-text"
        />
      </div>

      {/* Détail par chantier */}
      {semaine && semaine.detailParChantier.length > 0 && (
        <>
          <h2 className="section-label">Par chantier</h2>
          <div className="card overflow-hidden">
            {semaine.detailParChantier.map((c, i) => (
              <Link
                key={c.chantierId}
                href={`/chantiers/${c.chantierId}`}
                className={`flex items-center justify-between px-4 py-3.5 hover:bg-surface-muted transition-colors ${
                  i < semaine!.detailParChantier.length - 1 ? 'border-b border-surface-soft' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{c.chantierNom}</p>
                  <p className="text-xs text-ink-faint mt-0.5">{c.nbJournees} journée{c.nbJournees > 1 ? 's' : ''}</p>
                </div>
                <p className="text-sm font-bold text-ink font-stat">{formatXof(c.totalXof)}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  colorClass,
  href,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  colorClass: string
  href?: string
}) {
  const inner = (
    <div className="stat-card">
      <div className={`inline-flex p-2 rounded-icon mb-2 ${colorClass}`}>
        <Icon size={16} />
      </div>
      <p className="stat-value leading-tight">{value}</p>
      <p className="stat-label mt-0.5 leading-tight">{label}</p>
      {sub && <p className="text-xs text-ink-faint mt-0.5">{sub}</p>}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-80 transition-opacity active:scale-[0.98]">
        {inner}
      </Link>
    )
  }
  return inner
}
