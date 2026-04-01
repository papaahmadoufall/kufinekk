import { prisma } from '../../shared/db'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/codes'
import type { UpdateEntrepriseInput } from './entreprises.schema'

export async function getEntreprise(entrepriseId: string) {
  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
    select: {
      id: true,
      nom: true,
      telephone: true,
      adresse: true,
      plan: true,
      actif: true,
      createdAt: true,
    },
  })

  if (!entreprise) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Entreprise introuvable', 404)
  }

  return entreprise
}

export async function updateEntreprise(entrepriseId: string, input: UpdateEntrepriseInput) {
  const entreprise = await prisma.entreprise.update({
    where: { id: entrepriseId },
    data: input,
    select: {
      id: true,
      nom: true,
      telephone: true,
      adresse: true,
      plan: true,
      actif: true,
      createdAt: true,
    },
  })

  return entreprise
}
