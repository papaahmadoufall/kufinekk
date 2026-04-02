import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { CheckCircle, Clock, Banknote, XCircle } from 'lucide-react'

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

const statutIcons: Record<string, React.ReactNode> = {
  EN_COURS: <Clock size={14} className="text-amber-500" />,
  VALIDE:   <CheckCircle size={14} className="text-blue-500" />,
  PAYE:     <Banknote size={14} className="text-green-500" />,
  ECHOUE:   <XCircle size={14} className="text-red-500" />,
}

const statutColors: Record<string, string> = {
  EN_COURS: 'bg-amber-50 text-amber-700',
  VALIDE:   'bg-blue-50 text-blue-700',
  PAYE:     'bg-green-50 text-green-700',
  ECHOUE:   'bg-red-50 text-red-700',
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

  const totalPaye = cycles.filter(c => c.statut === 'PAYE').reduce((s, c) => s + c.totalHebdoXof, 0)
  const totalEnAttente = cycles.filter(c => c.statut === 'VALIDE').reduce((s, c) => s + c.totalHebdoXof, 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cycles de paie</h1>
        <p className="text-sm text-gray-500 mt-1">{cycles.length} cycle{cycles.length > 1 ? 's' : ''}</p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs font-medium text-green-600 mb-1">Total payé</p>
          <p className="text-xl font-bold text-green-800">{totalPaye.toLocaleString('fr-FR')} XOF</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-600 mb-1">En attente de paiement</p>
          <p className="text-xl font-bold text-blue-800">{totalEnAttente.toLocaleString('fr-FR')} XOF</p>
        </div>
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
              <th className="text-left px-5 py-3 font-medium text-gray-600">Semaine</th>
              <th className="text-right px-5 py-3 font-medium text-gray-600">Total XOF</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cycles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400">Aucun cycle</td>
              </tr>
            ) : (
              cycles.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{c.contrat.agent.prenom} {c.contrat.agent.nom}</div>
                    <div className="text-xs text-gray-400 font-mono">{c.contrat.agent.matricule}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.contrat.chantier.nom}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(c.semaineDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    {' → '}
                    {new Date(c.semaineFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {c.totalHebdoXof.toLocaleString('fr-FR')} XOF
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statutColors[c.statut] ?? ''}`}>
                      {statutIcons[c.statut]}
                      {c.statut}
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
