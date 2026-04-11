'use server'

import { cookies } from 'next/headers'

const COOKIE = 'kfn_token'

export async function getToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(COOKIE)?.value
}

export async function setToken(token: string) {
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: '/',
  })
}

export async function clearToken() {
  const store = await cookies()
  store.delete(COOKIE)
}

/** Décode le payload JWT (sans vérification — pour l'UI uniquement) */
export async function getUser(): Promise<{
  sub: string
  entrepriseId: string
  role?: string
  type: string
} | null> {
  const token = await getToken()
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
  } catch {
    return null
  }
}
