const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://kufinekk-production.up.railway.app'

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...rest } = options
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? 'Erreur API')
  return json
}
