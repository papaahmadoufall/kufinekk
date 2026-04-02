import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { MapPin, Users, Plus } from 'lucide-react'
import Link from 'next/link'

interface Chantier {
  id: string
  nom: string
  adresse?: string
  statut: string
  dateDebut: string
  _count?: { contrats: number }
}

const statutColors: Record<string, string> = {
  ACTIF: 'bg-green-100 text-green-700',
  TERMINE: 'bg-gray-100 text-gray-600',
  EN_PAUSE: 'bg-amber-100 text-amber-700',
}

export default async function ChantiersPage() {
  const token = await getToken()

  let chantiers: Chantier[] = []
  let error: string | null = null

  try {
    const res = await apiFetch<{ data: Chantier[] }>('/chantiers', { token })
    chantiers = res.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chantiers</h1>
          <p className="text-sm text-gray-500 mt-1">{chantiers.length} chantier{chantiers.length > 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/chantiers/nouveau"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nouveau chantier
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {chantiers.length === 0 ? (
          <p className="text-gray-400 col-span-3 text-center py-16">Aucun chantier</p>
        ) : (
          chantiers.map((c) => (
            <Link
              key={c.id}
              href={`/chantiers/${c.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{c.nom}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColors[c.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                  {c.statut}
                </span>
              </div>
              {c.adresse && (
                <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                  <MapPin size={13} />
                  {c.adresse}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Users size={13} />
                {c._count?.contrats ?? 0} agent{(c._count?.contrats ?? 0) > 1 ? 's' : ''}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Depuis le {new Date(c.dateDebut).toLocaleDateString('fr-FR')}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
