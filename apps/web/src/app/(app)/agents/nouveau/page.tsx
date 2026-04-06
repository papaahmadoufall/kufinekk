'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { creerAgentAction } from './actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { COPY } from '@/lib/copy'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? COPY.loading.creation : COPY.actions.creerAgent}
    </button>
  )
}

export default function NouvelAgentPage() {
  const [state, action] = useFormState(creerAgentAction, undefined)

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

      <form action={action} className="card p-5 space-y-5">

        {/* 1. Téléphone en premier — clé de recherche */}
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

        {/* 2. Prénom */}
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

        {/* 3. Nom */}
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

        {/* 4. Code PIN */}
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
            placeholder="4 à 8 chiffres"
            minLength={4}
            maxLength={8}
            pattern="[0-9]{4,8}"
            className="input-field tracking-widest text-center text-xl"
          />
          <p className="text-xs text-ink-faint mt-1.5">L'agent utilisera ce PIN pour se connecter</p>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-3">
          <SubmitButton />
          <Link href="/agents" className="btn-secondary w-full">
            {COPY.actions.annuler}
          </Link>
        </div>
      </form>
    </div>
  )
}
