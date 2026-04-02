'use server'

import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/auth'

export async function creerAgentAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | void> {
  const token = await getToken()

  const body = {
    nom: formData.get('nom') as string,
    prenom: formData.get('prenom') as string,
    telephone: formData.get('telephone') as string,
    pin: formData.get('pin') as string,
  }

  try {
    await apiFetch('/agents', {
      method: 'POST',
      body: JSON.stringify(body),
      token: token ?? undefined,
    })
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }

  redirect('/agents')
}
