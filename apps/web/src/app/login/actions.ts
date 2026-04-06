'use server'

import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { setToken } from '@/lib/auth'

export async function loginAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | void> {
  const telephone  = formData.get('telephone') as string
  const credential = formData.get('credential') as string
  const role       = formData.get('role') as 'MANAGER' | 'POINTEUR'

  // Manager → motDePasse, Pointeur → pin
  const body =
    role === 'MANAGER'
      ? { telephone, motDePasse: credential }
      : { telephone, pin: credential }

  try {
    const res = await apiFetch<{ data: { token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    await setToken(res.data.token)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return { error: msg }
  }

  redirect('/dashboard')
}
