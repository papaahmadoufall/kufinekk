'use server'

import { setToken } from '@/lib/auth'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://kufinekk-production.up.railway.app'

export async function sendOtpAction(telephone: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/v1/onboarding/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telephone }),
      cache: 'no-store',
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      return { ok: false, error: j?.error?.message ?? 'Erreur envoi OTP' }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}

interface RegisterPayload {
  prenom: string
  nom: string
  telephone: string
  motDePasse: string
  otpCode: string
  raisonSociale: string
  ninea?: string
  ville?: string
  taille?: string
  chantierNom: string
  chantierAdresse?: string
  chantierDebut: string
  chantierTauxJournalier: number
  pointeur?: { prenom: string; nom: string; telephone: string; pin: string }
  agents?: Array<{
    prenom: string
    nom: string
    telephone?: string
    poste: string
    tauxJournalierXof: number
  }>
}

export async function registerAction(
  payload: RegisterPayload,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/v1/onboarding/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, error: json?.error?.message ?? 'Erreur inscription' }
    }
    if (json?.data?.token) {
      await setToken(json.data.token)
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}
