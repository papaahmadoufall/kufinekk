'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, AlertTriangle, X } from 'lucide-react'

interface Props {
  chantierId: string
}

export default function ChantierActions({ chantierId }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFermer() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/proxy/chantiers/${chantierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'TERMINE' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? 'Erreur serveur')
      setShowModal(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setError(null); setShowModal(true) }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-btn border-2 border-absent/40 text-absent-text text-sm font-semibold hover:bg-absent-light transition-colors"
      >
        <XCircle size={16} />
        Fermer le chantier
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-card shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-soft">
              <h3 className="font-bold text-ink text-base">Fermer le chantier</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-btn hover:bg-surface-muted transition-colors"
              >
                <X size={18} className="text-ink-muted" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-absent-light rounded-btn">
                <AlertTriangle size={18} className="text-absent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-ink">
                  Fermer ce chantier passera son statut à <strong>TERMINÉ</strong>.
                  Les agents ne pourront plus pointer. Cette action est réversible via l&apos;édition du chantier.
                </p>
              </div>

              {error && <div role="alert" className="alert-error text-sm">{error}</div>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleFermer}
                  disabled={loading}
                  className="flex-1 h-11 px-5 bg-absent text-white text-sm font-semibold rounded-btn hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Fermeture…' : 'Confirmer la fermeture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
