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

// ── Calendrier de présences hebdomadaire ──────────────────────────────────

export async function getPresences(chantierId: string, entrepriseId: string, semaineStr: string) {
  // Plage vendredi → jeudi (UTC, Dakar = UTC+0)
  const friday = new Date(semaineStr + 'T00:00:00.000Z')
  const thursday = new Date(friday)
  thursday.setUTCDate(friday.getUTCDate() + 6)
  thursday.setUTCHours(23, 59, 59, 999)

  const contrats = await prisma.contrat.findMany({
    where: { chantierId, entrepriseId, statut: { in: ['ACTIF', 'PROVISOIRE'] } },
    select: {
      id: true,
      seuilHeuresNormales: true,
      tauxHeureSuppXof: true,
      agent: { select: { id: true, nom: true, prenom: true, matricule: true } },
      chantier: { select: { seuilHeuresNormales: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const contratIds = contrats.map((c) => c.id)
  const pointages = contratIds.length
    ? await prisma.pointage.findMany({
        where: {
          contratId: { in: contratIds },
          dateJournee: { gte: friday, lte: thursday },
        },
        select: {
          id: true,
          contratId: true,
          dateJournee: true,
          heureEntree: true,
          heureSortie: true,
          totalJournalierXof: true,
          statut: true,
        },
      })
    : []

  const todayStr = new Date().toISOString().slice(0, 10)

  // 7 jours : ven → jeu
  const weekDays: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(friday)
    d.setUTCDate(friday.getUTCDate() + i)
    weekDays.push(d.toISOString().slice(0, 10))
  }

  const agents = contrats.map((contrat) => {
    const seuil = contrat.seuilHeuresNormales ?? contrat.chantier.seuilHeuresNormales
    const contratPointages = pointages.filter((p) => p.contratId === contrat.id)

    const presences: Record<string, {
      statut: string
      pointageId: string
      heureEntree: string | null
      heureSortie: string | null
      heuresSupp: number
    } | null> = {}

    for (const day of weekDays) {
      const p = contratPointages.find((p) => p.dateJournee.toISOString().slice(0, 10) === day)
      if (!p) {
        presences[day] = null
      } else {
        let heuresSupp = 0
        if (p.heureSortie && contrat.tauxHeureSuppXof) {
          const dureeH = (p.heureSortie.getTime() - p.heureEntree.getTime()) / 3_600_000
          if (dureeH > seuil) {
            heuresSupp = Math.round((dureeH - seuil) * 10) / 10
          }
        }
        presences[day] = {
          statut: p.statut,
          pointageId: p.id,
          heureEntree: p.heureEntree.toISOString(),
          heureSortie: p.heureSortie?.toISOString() ?? null,
          heuresSupp,
        }
      }
    }

    const totalJours = Object.values(presences).filter(
      (p) => p && ['VALIDE', 'CORRIGE', 'EN_COURS'].includes(p.statut)
    ).length

    const totalHeuresSupp =
      Math.round(Object.values(presences).reduce((s, p) => s + (p?.heuresSupp ?? 0), 0) * 10) / 10

    const totalSemaineXof = contratPointages.reduce((s, p) => s + (p.totalJournalierXof ?? 0), 0)

    return {
      agentId: contrat.agent.id,
      nom: `${contrat.agent.prenom} ${contrat.agent.nom}`,
      matricule: contrat.agent.matricule,
      contratId: contrat.id,
      presences,
      totalJours,
      totalHeuresSupp,
      totalSemaineXof,
    }
  })

  agents.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  const todayPointages = pointages.filter(
    (p) => p.dateJournee.toISOString().slice(0, 10) === todayStr
  )
  const presentsAujourdhui = todayPointages.filter((p) =>
    ['VALIDE', 'CORRIGE', 'EN_COURS'].includes(p.statut)
  ).length
  const absentsAujourdhui = todayPointages.filter((p) => p.statut === 'ABSENT').length
  const masseSalarialeXof = pointages.reduce((s, p) => s + (p.totalJournalierXof ?? 0), 0)

  return {
    semaine: {
      debut: friday.toISOString().slice(0, 10),
      fin: thursday.toISOString().slice(0, 10),
    },
    agents,
    stats: { presentsAujourdhui, absentsAujourdhui, masseSalarialeXof },
  }
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
