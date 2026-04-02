import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

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

const statutIcons: Record<string, React.ReactNode> = {
  EN_COURS:  <Clock size={14} className="text-amber-500" />,
  VALIDE:    <CheckCircle size={14} className="text-green-500" />,
  CORRIGE:   <AlertCircle size={14} className="text-blue-500" />,
  ABSENT:    <XCircle size={14} className="text-red-400" />,
}

const statutColors: Record<string, string> = {
  EN_COURS: 'bg-amber-50 text-amber-700',
  VALIDE:   'bg-green-50 text-green-700',
  CORRIGE:  'bg-blue-50 text-blue-700',
  ABSENT:   'bg-red-50 text-red-600',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default async function PointagesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; contrat_id?: string }>
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pointages</h1>
          <p className="text-sm text-gray-500 mt-1">{pointages.length} entrée{pointages.length > 1 ? 's' : ''}</p>
        </div>
        {/* Filtre date */}
        <form>
          <input
            type="date"
            name="date"
            defaultValue={params.date}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-brand-500 focus:ring-brand-500"
          />
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Agent</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Chantier</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Entrée</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Sortie</th>
              <th className="text-right px-5 py-3 font-medium text-gray-600">Total XOF</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pointages.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                  Aucun pointage
                </td>
              </tr>
            ) : (
              pointages.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">
                      {p.contrat.agent.prenom} {p.contrat.agent.nom}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">{p.contrat.agent.matricule}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{p.contrat.chantier.nom}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(p.dateJournee).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-3 text-gray-600 font-mono">{fmt(p.heureEntree)}</td>
                  <td className="px-5 py-3 text-gray-600 font-mono">
                    {p.heureSortie ? fmt(p.heureSortie) : <span className="text-amber-500">En cours</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {p.totalJournalierXof != null
                      ? `${p.totalJournalierXof.toLocaleString('fr-FR')} XOF`
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statutColors[p.statut] ?? ''}`}>
                      {statutIcons[p.statut]}
                      {p.statut}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
