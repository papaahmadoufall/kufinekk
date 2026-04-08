'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, RefreshCw, CheckCircle, ArrowRightLeft, XCircle, X, AlertTriangle } from 'lucide-react'
import Image from 'next/image'

interface ContratDetail {
  id: string
  poste: string
  typeContrat: 'CONTRACTUEL' | 'NON_CONTRACTUEL'
  statut: 'PROVISOIRE' | 'ACTIF' | 'TERMINE'
  tauxJournalierXof: number
  tauxHeureSuppXof?: number | null
  seuilHeuresNormales?: number | null
  heureDebutStd?: string | null
  dateDebut: string
  dateFin?: string | null
  agent: {
    id: string
    matricule: string
    telephone: string
    nom: string
    prenom: string
    qrCodeUrl?: string | null
  }
  chantier: {
    id: string
    nom: string
  }
}

interface Chantier {
  id: string
  nom: string
}

interface Props {
  contrat: ContratDetail
  chantiers: Chantier[]
  mode: 'qr' | 'actions'
}

const POSTES_CONTRACTUEL = [
  'Conducteur des travaux',
  'Chef de chantier',
  'Chef équipe maçon',
  'Chef équipe coffreur',
  'Chef équipe ferrailleur',
]

const POSTES_NON_CONTRACTUEL = [
  'Ferrailleur',
  'Maçon',
  'Coffreur',
  'Manœuvre',
  'Chef manœuvre',
  'Conducteur bétonnière',
  'Conducteur monte-charge',
]

// ── Petit helper ──────────────────────────────────────────

async function callProxy(path: string, method = 'POST', body?: object) {
  const res = await fetch(`/api/proxy/${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? 'Erreur serveur')
  return json
}

// ── Modale générique ──────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-card shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-soft">
          <h3 className="font-bold text-ink text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-btn hover:bg-surface-muted transition-colors">
            <X size={18} className="text-ink-muted" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────

export default function ContratActions({ contrat, chantiers, mode }: Props) {
  const router = useRouter()

  // États de chargement
  const [loading, setLoading] = useState<'qr' | 'valider' | 'terminer' | 'transferer' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // QR Code — URL locale après régénération
  const [qrUrl, setQrUrl] = useState<string | null | undefined>(contrat.agent.qrCodeUrl)

  // Modales
  const [showTerminer, setShowTerminer] = useState(false)
  const [showTransferer, setShowTransferer] = useState(false)

  // Formulaire transfert
  const [transferChantier, setTransferChantier] = useState('')
  const [transferTypeContrat, setTransferTypeContrat] = useState<'NON_CONTRACTUEL' | 'CONTRACTUEL'>(
    contrat.typeContrat
  )
  const [transferPoste, setTransferPoste] = useState(contrat.poste)
  const [transferPosteCustom, setTransferPosteCustom] = useState('')
  const [transferShowCustomPoste, setTransferShowCustomPoste] = useState(false)
  const [transferTaux, setTransferTaux] = useState(String(contrat.tauxJournalierXof))
  const [transferTauxSupp, setTransferTauxSupp] = useState(
    contrat.tauxHeureSuppXof ? String(contrat.tauxHeureSuppXof) : ''
  )
  const [transferDateDebut, setTransferDateDebut] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [transferNote, setTransferNote] = useState('')

  // Formulaire terminaison
  const [terminerNote, setTerminerNote] = useState('')

  const transferPostes =
    transferTypeContrat === 'CONTRACTUEL' ? POSTES_CONTRACTUEL : POSTES_NON_CONTRACTUEL
  const transferPosteEffectif = transferShowCustomPoste ? transferPosteCustom : transferPoste

  // ── Actions ───────────────────────────────────────────

  function clearMessages() {
    setError(null)
    setSuccess(null)
  }

  async function handleValider() {
    clearMessages()
    setLoading('valider')
    try {
      await callProxy(`contrats/${contrat.id}/valider`)
      setSuccess('Contrat validé — statut ACTIF.')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(null)
    }
  }

  async function handleTerminer() {
    clearMessages()
    setLoading('terminer')
    try {
      await callProxy(`contrats/${contrat.id}/terminer`, 'POST', {
        noteCloture: terminerNote || undefined,
      })
      setSuccess('Contrat terminé.')
      setShowTerminer(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(null)
    }
  }

  async function handleTransferer() {
    if (!transferChantier || !transferPosteEffectif || !transferTaux) {
      setError('Chantier, poste et taux journalier sont requis.')
      return
    }
    clearMessages()
    setLoading('transferer')
    try {
      const res = await callProxy(`contrats/${contrat.id}/transferer`, 'POST', {
        chantierId: transferChantier,
        poste: transferPosteEffectif,
        typeContrat: transferTypeContrat,
        tauxJournalierXof: parseInt(transferTaux, 10),
        tauxHeureSuppXof: transferTauxSupp ? parseInt(transferTauxSupp, 10) : undefined,
        dateDebut: new Date(transferDateDebut).toISOString(),
        noteCloture: transferNote || undefined,
      })
      setShowTransferer(false)
      setSuccess('Transfert effectué.')
      // Rediriger vers le nouveau contrat
      if (res?.data?.id) {
        router.push(`/contrats/${res.data.id}`)
      } else {
        router.refresh()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(null)
    }
  }

  async function handleRegenerQr() {
    clearMessages()
    setLoading('qr')
    try {
      const res = await callProxy(`agents/${contrat.agent.id}/regenerer-qr`)
      setQrUrl(res?.data?.qrCodeUrl ?? null)
      setSuccess('QR code généré avec succès.')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(null)
    }
  }

  // ── Rendu : panneau QR ────────────────────────────────

  if (mode === 'qr') {
    return (
      <div className="card p-5">
        <h2 className="text-xs font-bold text-ink-faint uppercase tracking-wide mb-3">Badge QR</h2>

        {error && <div role="alert" className="alert-error mb-3 text-sm">{error}</div>}
        {success && <div role="status" className="alert-success mb-3 text-sm">{success}</div>}

        {qrUrl ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="border-2 border-surface-soft rounded-card p-2 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={`QR code ${contrat.agent.matricule}`}
                  width={160}
                  height={160}
                  className="rounded"
                />
              </div>
            </div>
            <p className="text-center text-xs text-ink-faint">{contrat.agent.matricule}</p>
            <button
              onClick={handleRegenerQr}
              disabled={loading === 'qr'}
              className="w-full flex items-center justify-center gap-2 h-9 px-4 bg-surface-muted text-ink text-xs font-semibold rounded-btn hover:bg-surface-soft transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading === 'qr' ? 'animate-spin' : ''} />
              {loading === 'qr' ? 'Génération…' : 'Régénérer le QR'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-14 h-14 bg-surface-muted rounded-card flex items-center justify-center mb-3">
                <QrCode size={24} className="text-ink-faint" />
              </div>
              <p className="text-sm font-semibold text-ink">Aucun QR code</p>
              <p className="text-xs text-ink-faint mt-1">
                L&apos;agent ne peut pas encore être scanné.
              </p>
            </div>
            <button
              onClick={handleRegenerQr}
              disabled={loading === 'qr'}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <QrCode size={15} />
              {loading === 'qr' ? 'Génération…' : 'Générer le QR code'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Rendu : panneau Actions ───────────────────────────

  return (
    <>
      <div className="card p-5">
        <h2 className="text-xs font-bold text-ink-faint uppercase tracking-wide mb-4">Actions</h2>

        {error && <div role="alert" className="alert-error mb-3 text-sm">{error}</div>}
        {success && <div role="status" className="alert-success mb-3 text-sm">{success}</div>}

        <div className="space-y-2.5">

          {/* Valider — seulement si PROVISOIRE */}
          {contrat.statut === 'PROVISOIRE' && (
            <button
              onClick={handleValider}
              disabled={loading === 'valider'}
              className="w-full flex items-center gap-3 p-3.5 rounded-btn border-2 border-brand-600 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={18} className="flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold">
                  {loading === 'valider' ? 'Validation…' : 'Valider le contrat'}
                </p>
                <p className="text-xs font-normal opacity-75">Passe de PROVISOIRE → ACTIF</p>
              </div>
            </button>
          )}

          {/* Transférer */}
          <button
            onClick={() => { clearMessages(); setShowTransferer(true) }}
            className="w-full flex items-center gap-3 p-3.5 rounded-btn border-2 border-surface-soft bg-white text-ink hover:border-ink-faint hover:bg-surface-muted transition-colors"
          >
            <ArrowRightLeft size={18} className="text-ink-muted flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold">Transférer sur un autre chantier</p>
              <p className="text-xs font-normal text-ink-muted">Clôture ce contrat et en crée un nouveau</p>
            </div>
          </button>

          {/* Terminer */}
          <button
            onClick={() => { clearMessages(); setShowTerminer(true) }}
            className="w-full flex items-center gap-3 p-3.5 rounded-btn border-2 border-surface-soft bg-white text-absent hover:border-absent/40 hover:bg-red-50 transition-colors"
          >
            <XCircle size={18} className="flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold">Terminer le contrat</p>
              <p className="text-xs font-normal opacity-75">Clôture définitive de ce contrat</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Modale : Terminer ──────────────────────────── */}
      {showTerminer && (
        <Modal title="Terminer le contrat" onClose={() => setShowTerminer(false)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-btn">
              <AlertTriangle size={18} className="text-absent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink">
                Cette action est <strong>irréversible</strong>. Le contrat sera clôturé aujourd&apos;hui.
                L&apos;agent ne pourra plus pointer sur ce chantier.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Note de clôture <span className="text-ink-faint font-normal">(optionnel)</span>
              </label>
              <textarea
                value={terminerNote}
                onChange={(e) => setTerminerNote(e.target.value)}
                rows={3}
                placeholder="Fin de chantier, départ volontaire…"
                className="input-field resize-none"
              />
            </div>

            {error && <div role="alert" className="alert-error text-sm">{error}</div>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowTerminer(false)}
                className="flex-1 btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleTerminer}
                disabled={loading === 'terminer'}
                className="flex-1 h-11 px-5 bg-absent text-white text-sm font-semibold rounded-btn hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading === 'terminer' ? 'En cours…' : 'Confirmer la clôture'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modale : Transférer ────────────────────────── */}
      {showTransferer && (
        <Modal title="Transférer sur un autre chantier" onClose={() => setShowTransferer(false)}>
          <div className="space-y-4">

            {/* Chantier destination */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Nouveau chantier <span className="text-absent">*</span>
              </label>
              <select
                value={transferChantier}
                onChange={(e) => setTransferChantier(e.target.value)}
                className="input-field"
              >
                <option value="" disabled>Sélectionner un chantier</option>
                {chantiers
                  .filter((c) => c.id !== contrat.chantier.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
              </select>
            </div>

            {/* Type de contrat */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Type de contrat <span className="text-absent">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['NON_CONTRACTUEL', 'CONTRACTUEL'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTransferTypeContrat(t)
                      setTransferPoste('')
                      setTransferPosteCustom('')
                      setTransferShowCustomPoste(false)
                    }}
                    className={`p-2.5 rounded-btn border-2 text-xs font-semibold text-center transition-colors ${
                      transferTypeContrat === t
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-surface-soft bg-white text-ink-muted hover:border-ink-faint'
                    }`}
                  >
                    {t === 'NON_CONTRACTUEL' ? 'Non-contractuel' : 'Contractuel'}
                  </button>
                ))}
              </div>
            </div>

            {/* Poste */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Poste <span className="text-absent">*</span>
              </label>
              {!transferShowCustomPoste ? (
                <div className="space-y-1.5">
                  <select
                    value={transferPoste}
                    onChange={(e) => setTransferPoste(e.target.value)}
                    className="input-field"
                  >
                    <option value="" disabled>Sélectionner un poste</option>
                    {transferPostes.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setTransferShowCustomPoste(true); setTransferPoste('') }}
                    className="text-xs text-brand-600 font-semibold hover:text-brand-700"
                  >
                    + Autre poste
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={transferPosteCustom}
                    onChange={(e) => setTransferPosteCustom(e.target.value)}
                    placeholder="Nom du poste"
                    className="input-field"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setTransferShowCustomPoste(false); setTransferPosteCustom('') }}
                    className="text-xs text-ink-muted hover:text-ink"
                  >
                    ← Revenir à la liste
                  </button>
                </div>
              )}
            </div>

            {/* Taux journalier + heures supp */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Taux/jour (XOF) <span className="text-absent">*</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={transferTaux}
                  onChange={(e) => setTransferTaux(e.target.value)}
                  min="1000"
                  step="500"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  H. supp. (XOF/h)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={transferTauxSupp}
                  onChange={(e) => setTransferTauxSupp(e.target.value)}
                  min="0"
                  step="100"
                  placeholder="Optionnel"
                  className="input-field"
                />
              </div>
            </div>

            {/* Date début */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Date de début du nouveau contrat <span className="text-absent">*</span>
              </label>
              <input
                type="date"
                value={transferDateDebut}
                onChange={(e) => setTransferDateDebut(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Motif du transfert <span className="text-ink-faint font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="Fin de phase, redéploiement…"
                className="input-field"
              />
            </div>

            {error && <div role="alert" className="alert-error text-sm">{error}</div>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowTransferer(false)}
                className="flex-1 btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleTransferer}
                disabled={loading === 'transferer'}
                className="flex-1 btn-primary"
              >
                {loading === 'transferer' ? 'Transfert…' : 'Confirmer le transfert'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
