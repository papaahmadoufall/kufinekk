import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { Search, Plus, Phone } from 'lucide-react'
import Link from 'next/link'

interface Agent {
  id: string
  matricule: string
  nom: string
  prenom: string
  telephone: string
  contratActif?: { poste: string; chantier: { nom: string }; statut: string }
}

const statutColors: Record<string, string> = {
  ACTIF: 'bg-green-100 text-green-700',
  PROVISOIRE: 'bg-amber-100 text-amber-700',
  TERMINE: 'bg-gray-100 text-gray-600',
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-sm text-gray-500 mt-1">{total} agent{total > 1 ? 's' : ''} au total</p>
        </div>
        <Link
          href="/agents/nouveau"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nouvel agent
        </Link>
      </div>

      {/* Recherche */}
      <form className="mb-6">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Nom, matricule, téléphone…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-brand-500 focus:ring-brand-500"
          />
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Agent</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Matricule</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Téléphone</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Chantier</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                  Aucun agent trouvé
                </td>
              </tr>
            ) : (
              agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/agents/${agent.id}`} className="font-medium text-gray-900 hover:text-brand-600">
                      {agent.prenom} {agent.nom}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{agent.matricule}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Phone size={13} />
                      {agent.telephone}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {agent.contratActif?.chantier.nom ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    {agent.contratActif ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statutColors[agent.contratActif.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                        {agent.contratActif.statut}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Sans contrat</span>
                    )}
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
