const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://kufinekk-production.up.railway.app'

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...rest } = options

  const method = (rest.method ?? 'GET').toUpperCase()
  const isRead = method === 'GET' || method === 'HEAD'

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
    // Réutiliser les connexions TCP ouvertes
    keepalive: true,
    // Cache Next.js : 20s pour les lectures, jamais pour les mutations
    ...(isRead
      ? { next: { revalidate: 20 } }
      : { cache: 'no-store' as RequestCache }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? 'Erreur API')
  return json
}
