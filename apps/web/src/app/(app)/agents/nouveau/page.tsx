import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import AgentForm from './AgentForm'

interface Chantier {
  id: string
  nom: string
}

export default async function NouvelAgentPage() {
  const token = await getToken()

  let chantiers: Chantier[] = []
  try {
    const res = await apiFetch<{ data: Chantier[] }>('/chantiers', { token })
    chantiers = res.data
  } catch { /* fallback vide */ }

  return <AgentForm chantiers={chantiers} />
}
