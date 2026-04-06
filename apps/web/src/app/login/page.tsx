'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { loginAction } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary mt-2">
      {pending ? 'Connexion en cours…' : 'Se connecter'}
    </button>
  )
}

export default function LoginPage() {
  const [state, action] = useFormState(loginAction, undefined)
  const [role, setRole] = useState<'MANAGER' | 'POINTEUR'>('MANAGER')

  return (
    <div className="min-h-screen flex items-center justify-center blueprint-bg px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-600 rounded-card mb-4 shadow-float">
            <span className="text-white text-4xl font-bold font-display">K</span>
          </div>
          <h1 className="text-display-md text-ink font-display uppercase tracking-wide">Kufinekk</h1>
          <p className="text-sm text-ink-faint mt-1">Système de pointage BTP</p>
        </div>

        {/* Card */}
        <div className="card p-6">

          {/* Toggle Manager / Pointeur */}
          <div className="flex rounded-btn bg-surface-muted p-1 mb-5">
            {(['MANAGER', 'POINTEUR'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-icon text-sm font-semibold transition-colors ${
                  role === r
                    ? 'bg-surface-card text-ink shadow-card'
                    : 'text-ink-faint hover:text-ink-muted'
                }`}
              >
                {r === 'MANAGER' ? 'Manager' : 'Pointeur'}
              </button>
            ))}
          </div>

          {state?.error && (
            <div role="alert" className="alert-error mb-5">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            {/* Champ caché pour le rôle */}
            <input type="hidden" name="role" value={role} />

            <div>
              <label htmlFor="telephone" className="block text-sm font-semibold text-ink mb-1.5">
                Téléphone
              </label>
              <input
                id="telephone"
                name="telephone"
                type="tel"
                inputMode="numeric"
                required
                placeholder="+221 77 123 45 67"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="credential" className="block text-sm font-semibold text-ink mb-1.5">
                {role === 'MANAGER' ? 'Mot de passe' : 'Code PIN'}
              </label>
              <input
                id="credential"
                name="credential"
                type="password"
                inputMode={role === 'POINTEUR' ? 'numeric' : 'text'}
                required
                placeholder={role === 'MANAGER' ? '••••••••' : '••••'}
                maxLength={role === 'POINTEUR' ? 4 : undefined}
                className="input-field tracking-widest text-center text-xl"
              />
              <p className="text-xs text-ink-faint mt-1.5">
                {role === 'MANAGER'
                  ? 'Mot de passe de votre compte Manager'
                  : 'Code PIN à 4 chiffres'}
              </p>
            </div>

            <SubmitButton />
          </form>
        </div>

        <p className="text-center text-xs text-ink-faint mt-6">
          Kufinekk · Pointage BTP Sénégal
        </p>
      </div>
    </div>
  )
}
