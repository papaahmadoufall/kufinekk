'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { creerChantierAction } from './actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { COPY } from '@/lib/copy'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? COPY.loading.creation : 'Créer le chantier'}
    </button>
  )
}

export default function NouveauChantierPage() {
  const [state, action] = useFormState(creerChantierAction, undefined)

  // Date d'aujourd'hui au format YYYY-MM-DD pour la valeur par défaut
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-4 lg:p-8 max-w-lg">

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/chantiers"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4"
        >
          <ArrowLeft size={16} />
          Retour aux chantiers
        </Link>
        <h1 className="text-xl lg:text-2xl font-bold text-ink">Nouveau chantier</h1>
      </div>

      {state?.error && (
        <div role="alert" className="alert-error mb-5">
          {state.error}
        </div>
      )}

      <form action={action} className="card p-5 space-y-5">

        {/* Nom */}
        <div>
          <label htmlFor="nom" className="block text-sm font-semibold text-ink mb-1.5">
            Nom du chantier <span className="text-absent" aria-hidden="true">*</span>
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            required
            placeholder="Ex : Immeuble Plateau, Villa Nord…"
            className="input-field"
          />
        </div>

        {/* Adresse */}
        <div>
          <label htmlFor="adresse" className="block text-sm font-semibold text-ink mb-1.5">
            Adresse <span className="text-ink-faint font-normal">(optionnel)</span>
          </label>
          <input
            id="adresse"
            name="adresse"
            type="text"
            placeholder="Quartier, ville…"
            className="input-field"
          />
        </div>

        {/* Date de début */}
        <div>
          <label htmlFor="dateDebut" className="block text-sm font-semibold text-ink mb-1.5">
            Date de début <span className="text-absent" aria-hidden="true">*</span>
          </label>
          <input
            id="dateDebut"
            name="dateDebut"
            type="date"
            required
            defaultValue={today}
            className="input-field"
          />
        </div>

        {/* Heure de début standard */}
        <div>
          <label htmlFor="heureDebutStd" className="block text-sm font-semibold text-ink mb-1.5">
            Heure de début standard
          </label>
          <input
            id="heureDebutStd"
            name="heureDebutStd"
            type="time"
            defaultValue="08:00"
            className="input-field"
          />
          <p className="text-xs text-ink-faint mt-1.5">Heure de référence pour calculer les heures supplémentaires</p>
        </div>

        {/* Seuil heures normales */}
        <div>
          <label htmlFor="seuilHeuresNormales" className="block text-sm font-semibold text-ink mb-1.5">
            Heures normales par jour
          </label>
          <div className="relative">
            <input
              id="seuilHeuresNormales"
              name="seuilHeuresNormales"
              type="number"
              inputMode="decimal"
              min="1"
              max="24"
              step="0.5"
              defaultValue="8"
              className="input-field pr-14"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
              heures
            </span>
          </div>
          <p className="text-xs text-ink-faint mt-1.5">Au-delà = heures supplémentaires (si taux défini)</p>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-3">
          <SubmitButton />
          <Link href="/chantiers" className="btn-secondary w-full">
            {COPY.actions.annuler}
          </Link>
        </div>
      </form>
    </div>
  )
}
