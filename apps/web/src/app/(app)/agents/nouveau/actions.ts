'use server'

import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/auth'

export async function creerAgentAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | void> {
  const token = await getToken()
  if (!token) return { error: 'Session expirée — reconnectez-vous.' }

  let telephone = (formData.get('telephone') as string).trim().replace(/\s/g, '')
  if (!telephone.startsWith('+')) telephone = '+221' + telephone

  const nom = (formData.get('nom') as string).trim()
  const prenom = (formData.get('prenom') as string).trim()
  const pin = (formData.get('pin') as string).trim()
  const chantierId = formData.get('chantierId') as string
  const poste = (formData.get('poste') as string).trim()
  const typeContrat = formData.get('typeContrat') as string
  const tauxJournalierXof = parseInt(formData.get('tauxJournalierXof') as string, 10)
  const tauxHeureSuppStr = formData.get('tauxHeureSuppXof') as string

  if (!nom || !prenom || !pin || !poste || !chantierId) {
    return { error: 'Tous les champs obligatoires doivent être remplis.' }
  }

  if (isNaN(tauxJournalierXof) || tauxJournalierXof < 1000) {
    return { error: 'Le taux journalier doit être d\'au moins 1 000 XOF.' }
  }

  // 1. Chercher si l'agent existe déjà par téléphone
  let agentId: string | null = null

  try {
    const searchRes = await apiFetch<{ data: { id: string } }>(
      `/agents/search?telephone=${encodeURIComponent(telephone)}`,
      { token }
    )
    agentId = searchRes.data.id
  } catch {
    // Agent non trouvé — on le crée
  }

  // 2. Créer l'agent s'il n'existe pas
  if (!agentId) {
    try {
      const createRes = await apiFetch<{ data: { id: string } }>('/agents', {
        method: 'POST',
        body: JSON.stringify({ nom, prenom, telephone, pin }),
        token,
      })
      agentId = createRes.data.id
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Erreur lors de la création de l\'agent.' }
    }
  }

  // 3. Créer le contrat (rattacher au chantier)
  try {
    const contratBody: Record<string, unknown> = {
      agentId,
      chantierId,
      poste,
      typeContrat,
      tauxJournalierXof,
      dateDebut: new Date().toISOString(),
    }

    if (tauxHeureSuppStr && parseInt(tauxHeureSuppStr, 10) > 0) {
      contratBody.tauxHeureSuppXof = parseInt(tauxHeureSuppStr, 10)
    }

    await apiFetch('/contrats', {
      method: 'POST',
      body: JSON.stringify(contratBody),
      token,
    })
  } catch (e: unknown) {
    return {
      error: e instanceof Error
        ? `Agent créé, mais erreur lors du rattachement : ${e.message}`
        : 'Agent créé, mais erreur lors du rattachement au chantier.',
    }
  }

  redirect('/agents')
}
