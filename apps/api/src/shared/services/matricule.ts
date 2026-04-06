import { prisma } from '../db'

/**
 * Génère un matricule unique au format KFN-XXXXX.
 * Utilise le MAX existant + 1 pour éviter les collisions si un agent
 * orphelin (sans contrat) a déjà consommé un numéro de séquence.
 */
export async function genererMatricule(_entrepriseId: string): Promise<string> {
  // Trouver le dernier matricule KFN dans toute la table (pas seulement par entreprise)
  // pour éviter les collisions globales sur le champ unique `matricule`.
  const lastAgent = await prisma.agent.findFirst({
    where: { matricule: { startsWith: 'KFN-' } },
    orderBy: { matricule: 'desc' },
    select: { matricule: true },
  })

  let nextSeq = 1
  if (lastAgent?.matricule) {
    const match = lastAgent.matricule.match(/KFN-(\d+)$/)
    if (match) nextSeq = parseInt(match[1], 10) + 1
  }

  // Boucle de sécurité contre les races conditions
  let matricule: string
  let attempts = 0
  do {
    matricule = `KFN-${String(nextSeq).padStart(5, '0')}`
    const exists = await prisma.agent.findUnique({ where: { matricule } })
    if (!exists) break
    nextSeq++
    attempts++
  } while (attempts < 100)

  return matricule
}
