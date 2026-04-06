'use server'

import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/auth'

export async function creerChantierAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | void> {
  const token = await getToken()

  const nom = formData.get('nom') as string
  const adresse = formData.get('adresse') as string
  const dateDebut = formData.get('dateDebut') as string
  const heureDebutStd = (formData.get('heureDebutStd') as string) || '08:00'
  const seuilStr = formData.get('seuilHeuresNormales') as string

  if (!nom || !dateDebut) {
    return { error: 'Le nom et la date de début sont obligatoires.' }
  }

  const body: Record<string, unknown> = {
    nom,
    dateDebut: new Date(dateDebut).toISOString(),
    heureDebutStd,
    seuilHeuresNormales: seuilStr ? parseFloat(seuilStr) : 8.0,
  }

  if (adresse) body.adresse = adresse

  try {
    await apiFetch('/chantiers', {
      method: 'POST',
      body: JSON.stringify(body),
      token: token ?? undefined,
    })
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }

  redirect('/chantiers')
}
