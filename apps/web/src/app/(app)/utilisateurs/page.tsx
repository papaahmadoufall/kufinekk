import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import Badge from '@/components/Badge'
import Link from 'next/link'
import { Plus, Users, Shield, ScanLine } from 'lucide-react'

interface Utilisateur {
  id: string
  nom: string
  telephone: string
  role: 'MANAGER' | 'POINTEUR'
  actif: boolean
  createdAt: string
}

export default async function UtilisateursPage() {
  const token = await getToken()

  let utilisateurs: Utilisateur[] = []
  let error: string | null = null

  try {
    const res = await apiFetch<{ data: Utilisateur[]; meta: { total: number } }>(
      '/utilisateurs',
      { token }
    )
    utilisateurs = res.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  const managers = utilisateurs.filter((u) => u.role === 'MANAGER')
  const pointeurs = utilisateurs.filter((u) => u.role === 'POINTEUR')

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-ink">Utilisateurs</h1>
          <p className="text-sm text-ink-faint mt-0.5">
            {utilisateurs.length} utilisateur{utilisateurs.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/utilisateurs/nouveau"
          className="flex items-center justify-center gap-2 h-11 px-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-btn transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau</span>
        </Link>
      </div>

      {error && (
        <div role="alert" className="alert-error mb-5">{error}</div>
      )}

      {utilisateurs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-14 h-14 bg-surface-muted rounded-card flex items-center justify-center mb-4">
            <Users size={24} className="text-ink-faint" />
          </div>
          <p className="font-semibold text-ink">Aucun utilisateur</p>
          <p className="text-sm text-ink-faint mt-1 max-w-xs">
            Créez des comptes pointeur pour permettre aux chefs d'équipe de pointer les agents.
          </p>
        </div>
      ) : (
        <>
          {/* Managers */}
          {managers.length > 0 && (
            <>
              <h2 className="section-label">
                Managers ({managers.length})
              </h2>
              <div className="space-y-2 mb-6">
                {managers.map((u) => (
                  <UserCard key={u.id} user={u} />
                ))}
              </div>
            </>
          )}

          {/* Pointeurs */}
          <h2 className="section-label">
            Pointeurs ({pointeurs.length})
          </h2>
          {pointeurs.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-ink-faint">Aucun pointeur créé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pointeurs.map((u) => (
                <UserCard key={u.id} user={u} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function UserCard({ user }: { user: Utilisateur }) {
  const RoleIcon = user.role === 'MANAGER' ? Shield : ScanLine

  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        user.role === 'MANAGER' ? 'bg-brand-100' : 'bg-surface-muted'
      }`}>
        <RoleIcon size={18} className={
          user.role === 'MANAGER' ? 'text-brand-700' : 'text-ink-muted'
        } />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink truncate">{user.nom}</p>
        <p className="text-meta text-ink-muted">{user.telephone}</p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-2">
        {!user.actif && (
          <span className="chip bg-surface-muted text-ink-faint text-xs px-2 py-0.5 rounded-chip">
            Inactif
          </span>
        )}
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-chip ${
          user.role === 'MANAGER'
            ? 'bg-brand-100 text-brand-700'
            : 'bg-surface-muted text-ink-muted'
        }`}>
          {user.role === 'MANAGER' ? 'Manager' : 'Pointeur'}
        </span>
      </div>
    </div>
  )
}
