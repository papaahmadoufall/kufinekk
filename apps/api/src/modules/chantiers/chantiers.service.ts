import { prisma } from '../../shared/db'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/codes'
import type { CreateChantierInput, UpdateChantierInput, ListChantiersInput } from './chantiers.schema'

export async function listChantiers(entrepriseId: string, input: ListChantiersInput) {
  const { statut, page, per_page } = input
  const skip = (page - 1) * per_page

  const where = {
    entrepriseId,
    ...(statut && { statut }),
  }

  const [items, total] = await Promise.all([
    prisma.chantier.findMany({
      where,
      select: {
        id: true,
        nom: true,
        adresse: true,
        dateDebut: true,
        dateFinPrevue: true,
        statut: true,
        heureDebutStd: true,
        seuilHeuresNormales: true,
        createdAt: true,
        _count: { select: { contrats: { where: { statut: { in: ['ACTIF', 'PROVISOIRE'] } } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: per_page,
    }),
    prisma.chantier.count({ where }),
  ])

  return {
    data: items,
    meta: { total, page, per_page, total_pages: Math.ceil(total / per_page) },
  }
}

export async function getChantier(id: string, entrepriseId: string) {
  const chantier = await prisma.chantier.findFirst({
    where: { id, entrepriseId },
    select: {
      id: true,
      nom: true,
      adresse: true,
      dateDebut: true,
      dateFinPrevue: true,
      statut: true,
      heureDebutStd: true,
      seuilHeuresNormales: true,
      createdAt: true,
      contrats: {
        where: { statut: { in: ['ACTIF', 'PROVISOIRE'] } },
        select: {
          id: true,
          poste: true,
          typeContrat: true,
          statut: true,
          tauxJournalierXof: true,
          agent: {
            select: { id: true, matricule: true, nom: true, prenom: true, telephone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!chantier) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Chantier introuvable', 404)
  }

  return chantier
}

export async function createChantier(entrepriseId: string, input: CreateChantierInput) {
  return prisma.chantier.create({
    data: {
      entrepriseId,
      nom: input.nom,
      adresse: input.adresse,
      dateDebut: new Date(input.dateDebut),
      dateFinPrevue: input.dateFinPrevue ? new Date(input.dateFinPrevue) : null,
      heureDebutStd: input.heureDebutStd,
      seuilHeuresNormales: input.seuilHeuresNormales,
    },
    select: {
      id: true,
      nom: true,
      adresse: true,
      dateDebut: true,
      dateFinPrevue: true,
      statut: true,
      heureDebutStd: true,
      seuilHeuresNormales: true,
      createdAt: true,
    },
  })
}

export async function updateChantier(id: string, entrepriseId: string, input: UpdateChantierInput) {
  const chantier = await prisma.chantier.findFirst({ where: { id, entrepriseId } })
  if (!chantier) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Chantier introuvable', 404)
  }

  return prisma.chantier.update({
    where: { id },
    data: {
      ...(input.nom !== undefined && { nom: input.nom }),
      ...(input.adresse !== undefined && { adresse: input.adresse }),
      ...(input.dateFinPrevue !== undefined && {
        dateFinPrevue: input.dateFinPrevue ? new Date(input.dateFinPrevue) : null,
      }),
      ...(input.heureDebutStd !== undefined && { heureDebutStd: input.heureDebutStd }),
      ...(input.seuilHeuresNormales !== undefined && { seuilHeuresNormales: input.seuilHeuresNormales }),
      ...(input.statut !== undefined && { statut: input.statut }),
    },
    select: {
      id: true,
      nom: true,
      adresse: true,
      dateDebut: true,
      dateFinPrevue: true,
      statut: true,
      heureDebutStd: true,
      seuilHeuresNormales: true,
      createdAt: true,
    },
  })
}

/**
 * Vérifie si un agent peut encore pointer sur un chantier.
 * Utilisé par le module pointages au sprint 5.
 * Retourne le contrat actif ou lève une AppError.
 */
export async function verifierContratActif(agentId: string, entrepriseId: string) {
  const contrat = await prisma.contrat.findFirst({
    where: {
      agentId,
      entrepriseId,
      statut: { in: ['ACTIF', 'PROVISOIRE'] },
    },
    include: {
      chantier: {
        select: { seuilHeuresNormales: true, heureDebutStd: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!contrat) {
    throw new AppError(ERROR_CODES.CONTRAT_INACTIF, "Aucun contrat actif trouvé pour cet agent", 403)
  }

  // Vérifier fin de contrat automatique
  if (contrat.dateFin && contrat.dateFin < new Date()) {
    throw new AppError(ERROR_CODES.CONTRAT_EXPIRE, 'Le contrat de cet agent a expiré', 403)
  }

  return contrat
}
