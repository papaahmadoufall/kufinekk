'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { creerAgentAction } from './actions'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { COPY } from '@/lib/copy'

// ── Postes prédéfinis par type de contrat ──

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

// ── Types ──

interface Chantier {
  id: string
  nom: string
}

// ── Composants ──

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? COPY.loading.creation : COPY.actions.creerAgent}
    </button>
  )
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://kufinekk-production.up.railway.app'

export default function NouvelAgentPage() {
  const [state, action] = useFormState(creerAgentAction, undefined)
  const [typeContrat, setTypeContrat] = useState<'NON_CONTRACTUEL' | 'CONTRACTUEL'>('NON_CONTRACTUEL')
  const [poste, setPoste] = useState('')
  const [posteCustom, setPosteCustom] = useState('')
  const [showCustomPoste, setShowCustomPoste] = useState(false)
  const [chantiers, setChantiers] = useState<Chantier[]>([])

  const postes = typeContrat === 'CONTRACTUEL' ? POSTES_CONTRACTUEL : POSTES_NON_CONTRACTUEL

  // Charger les chantiers
  useEffect(() => {
    async function fetchChantiers() {
      try {
        const match = document.cookie.match(/(?:^|; )kfn_token=([^;]*)/)
        const token = match ? decodeURIComponent(match[1]) : ''
        const res = await fetch(`${API_URL}/api/v1/chantiers?statut=ACTIF`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        })
        const json = await res.json()
        if (res.ok) setChantiers(json.data ?? [])
      } catch { /* ignore */ }
    }
    fetchChantiers()
  }, [])

  // Reset poste quand le type change
  useEffect(() => {
    setPoste('')
    setPosteCustom('')
    setShowCustomPoste(false)
  }, [typeContrat])

  const posteValue = showCustomPoste ? posteCustom : poste

  return (
    <div className="p-4 lg:p-8 max-w-lg">

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4"
        >
          <ArrowLeft size={16} />
          Retour aux agents
        </Link>
        <h1 className="text-xl lg:text-2xl font-bold text-ink">Nouvel agent</h1>
        <p className="text-sm text-ink-faint mt-1">
          Un SMS avec le QR code et le PIN sera envoyé automatiquement.
        </p>
      </div>

      {state?.error && (
        <div role="alert" className="alert-error mb-5">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">

        {/* ── Section 1 : Identité ── */}
        <div className="card p-5 space-y-5">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Identité</h2>

          {/* Téléphone */}
          <div>
            <label htmlFor="telephone" className="block text-sm font-semibold text-ink mb-1.5">
              Téléphone <span className="text-absent" aria-hidden="true">*</span>
            </label>
            <input
              id="telephone"
              name="telephone"
              type="tel"
              inputMode="numeric"
              required
              placeholder="77 123 45 67"
              className="input-field"
            />
            <p className="text-xs text-ink-faint mt-1.5">Format : +221 suivi du numéro</p>
          </div>

          {/* Prénom + Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prenom" className="block text-sm font-semibold text-ink mb-1.5">
                Prénom <span className="text-absent" aria-hidden="true">*</span>
              </label>
              <input
                id="prenom"
                name="prenom"
                type="text"
                required
                placeholder="Amadou"
                autoCapitalize="words"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="nom" className="block text-sm font-semibold text-ink mb-1.5">
                Nom <span className="text-absent" aria-hidden="true">*</span>
              </label>
              <input
                id="nom"
                name="nom"
                type="text"
                required
                placeholder="Diallo"
                autoCapitalize="words"
                className="input-field"
              />
            </div>
          </div>

          {/* Code PIN */}
          <div>
            <label htmlFor="pin" className="block text-sm font-semibold text-ink mb-1.5">
              Code PIN <span className="text-absent" aria-hidden="true">*</span>
            </label>
            <input
              id="pin"
              name="pin"
              type="text"
              inputMode="numeric"
              required
              placeholder="4 chiffres"
              minLength={4}
              maxLength={4}
              pattern="[0-9]{4}"
              className="input-field tracking-widest text-center text-xl w-32"
            />
          </div>
        </div>

        {/* ── Section 2 : Rattachement au chantier ── */}
        <div className="card p-5 space-y-5">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Rattachement</h2>

          {/* Chantier */}
          <div>
            <label htmlFor="chantierId" className="block text-sm font-semibold text-ink mb-1.5">
              Chantier <span className="text-absent" aria-hidden="true">*</span>
            </label>
            {chantiers.length === 0 ? (
              <div className="text-sm text-ink-faint p-3 bg-surface-muted rounded-btn">
                Aucun chantier actif.{' '}
                <Link href="/chantiers/nouveau" className="text-brand-600 font-semibold hover:underline">
                  Créer un chantier
                </Link>
              </div>
            ) : (
              <select
                id="chantierId"
                name="chantierId"
                required
                className="input-field"
                defaultValue=""
              >
                <option value="" disabled>Sélectionner un chantier</option>
                {chantiers.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            )}
          </div>

          {/* Type de contrat */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Type de contrat <span className="text-absent" aria-hidden="true">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTypeContrat('NON_CONTRACTUEL')}
                className={`p-3 rounded-btn border-2 text-sm font-semibold text-center transition-colors ${
                  typeContrat === 'NON_CONTRACTUEL'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-surface-soft bg-white text-ink-muted hover:border-ink-faint'
                }`}
              >
                <span className="block font-bold">Non-contractuel</span>
                <span className="text-xs font-normal opacity-75">Payé par semaine</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeContrat('CONTRACTUEL')}
                className={`p-3 rounded-btn border-2 text-sm font-semibold text-center transition-colors ${
                  typeContrat === 'CONTRACTUEL'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-surface-soft bg-white text-ink-muted hover:border-ink-faint'
                }`}
              >
                <span className="block font-bold">Contractuel</span>
                <span className="text-xs font-normal opacity-75">Payé par mois</span>
              </button>
            </div>
            <input type="hidden" name="typeContrat" value={typeContrat} />
          </div>

          {/* Poste */}
          <div>
            <label htmlFor="posteSelect" className="block text-sm font-semibold text-ink mb-1.5">
              Poste <span className="text-absent" aria-hidden="true">*</span>
            </label>

            {!showCustomPoste ? (
              <div className="space-y-2">
                <select
                  id="posteSelect"
                  value={poste}
                  onChange={(e) => setPoste(e.target.value)}
                  className="input-field"
                >
                  <option value="" disabled>Sélectionner un poste</option>
                  {postes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => { setShowCustomPoste(true); setPoste('') }}
                  className="flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:text-brand-700"
                >
                  <Plus size={14} />
                  Autre poste
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={posteCustom}
                  onChange={(e) => setPosteCustom(e.target.value)}
                  placeholder="Nom du poste"
                  autoCapitalize="words"
                  className="input-field"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setShowCustomPoste(false); setPosteCustom('') }}
                  className="text-sm text-ink-muted hover:text-ink"
                >
                  ← Revenir à la liste
                </button>
              </div>
            )}
            <input type="hidden" name="poste" value={posteValue} />
          </div>

          {/* Taux journalier */}
          <div>
            <label htmlFor="tauxJournalierXof" className="block text-sm font-semibold text-ink mb-1.5">
              Taux journalier (XOF) <span className="text-absent" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <input
                id="tauxJournalierXof"
                name="tauxJournalierXof"
                type="number"
                inputMode="numeric"
                required
                min="1000"
                step="500"
                placeholder="5000"
                className="input-field pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint font-medium">
                XOF
              </span>
            </div>
            <p className="text-xs text-ink-faint mt-1.5">
              {typeContrat === 'CONTRACTUEL'
                ? 'Base de calcul pour le salaire mensuel'
                : 'Montant payé par journée travaillée'}
            </p>
          </div>

          {/* Taux heures supp (optionnel) */}
          <div>
            <label htmlFor="tauxHeureSuppXof" className="block text-sm font-semibold text-ink mb-1.5">
              Taux heure supp. <span className="text-ink-faint font-normal">(optionnel)</span>
            </label>
            <div className="relative">
              <input
                id="tauxHeureSuppXof"
                name="tauxHeureSuppXof"
                type="number"
                inputMode="numeric"
                min="0"
                step="100"
                placeholder="800"
                className="input-field pr-20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint font-medium">
                XOF/h
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <SubmitButton />
          <Link href="/agents" className="btn-secondary w-full">
            {COPY.actions.annuler}
          </Link>
        </div>
      </form>
    </div>
  )
}
