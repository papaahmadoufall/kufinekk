'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { creerAgentAction } from './actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
    >
      {pending ? 'Création…' : 'Créer l\'agent'}
    </button>
  )
}

export default function NouvelAgentPage() {
  const [state, action] = useFormState(creerAgentAction, undefined)

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <Link
          href="/agents"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={15} />
          Retour aux agents
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvel agent</h1>
        <p className="text-sm text-gray-500 mt-1">
          Un SMS avec le QR code et le PIN sera envoyé à l'agent.
        </p>
      </div>

      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
          {state.error}
        </div>
      )}

      <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              id="prenom"
              name="prenom"
              type="text"
              required
              placeholder="Amadou"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
            />
          </div>
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="nom"
              name="nom"
              type="text"
              required
              placeholder="Diallo"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone <span className="text-red-500">*</span>
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            required
            placeholder="+221 77 XXX XX XX"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Format international : +221XXXXXXXXX</p>
        </div>

        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
            Code PIN <span className="text-red-500">*</span>
          </label>
          <input
            id="pin"
            name="pin"
            type="text"
            required
            placeholder="4 à 8 chiffres"
            minLength={4}
            maxLength={8}
            pattern="[0-9]{4,8}"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm tracking-widest"
          />
          <p className="text-xs text-gray-400 mt-1">L'agent utilisera ce PIN pour se connecter</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <Link
            href="/agents"
            className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2"
          >
            Annuler
          </Link>
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}
