import { prisma } from '../db'

/**
 * Génère un matricule unique au format KFN-XXXXX
 * Séquence auto-incrémentée par entreprise.
 */
export async function genererMatricule(entrepriseId: string): Promise<string> {
  const count = await prisma.agent.count({
    where: { contrats: { some: { entrepriseId } } },
  })
  const seq = String(count + 1).padStart(5, '0')
  return `KFN-${seq}`
}
