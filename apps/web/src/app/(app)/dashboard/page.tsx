import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { Users, UserCheck, Clock, AlertCircle, TrendingUp, Banknote } from 'lucide-react'

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
  detailParChantier: { chantierId: string; chantierNom: string; totalXof: number; nbJournees: number }[]
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
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
    ? new Date(resume.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">{dateLabel}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats du jour */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Aujourd'hui</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Agents actifs" value={resume?.totalAgentsActifs ?? '—'} icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard label="Présents" value={resume?.presentAujourdhui ?? '—'} icon={UserCheck} color="bg-green-50 text-green-600" />
        <StatCard label="En cours" value={resume?.enCoursEntree ?? '—'} sub="Entrée sans sortie" icon={Clock} color="bg-amber-50 text-amber-600" />
        <StatCard label="En attente" value={resume?.agentsEnAttente ?? '—'} sub="Contrats PROVISOIRE" icon={AlertCircle} color="bg-orange-50 text-orange-600" />
        <StatCard
          label="Total journée"
          value={resume ? `${resume.totalJourneeXof.toLocaleString('fr-FR')} XOF` : '—'}
          icon={Banknote}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Stats semaine */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Cette semaine</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Journées pointées" value={semaine?.totalJourneesPointees ?? '—'} icon={TrendingUp} color="bg-indigo-50 text-indigo-600" />
        <StatCard
          label="Masse salariale"
          value={semaine ? `${semaine.masseSalarialeXof.toLocaleString('fr-FR')} XOF` : '—'}
          icon={Banknote}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Détail par chantier */}
      {semaine && semaine.detailParChantier.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Par chantier</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Chantier</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Journées</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Total XOF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {semaine.detailParChantier.map((c) => (
                  <tr key={c.chantierId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{c.chantierNom}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{c.nbJournees}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">
                      {c.totalXof.toLocaleString('fr-FR')} XOF
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
