import { prisma } from '../../shared/db'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/codes'
import { verifierContratActif } from '../chantiers/chantiers.service'
import type {
  EntreeInput,
  SortieInput,
  CorrigerPointageInput,
  AbsenceInput,
  ListPointagesInput,
} from './pointages.schema'

// ── Calcul A+C — UN SEUL ENDROIT (règle CLAUDE.md) ────────────────────────

export function calculerTotalJournalier(
  heureEntree: Date,
  heureSortie: Date,
  contrat: {
    tauxJournalierXof: number
    tauxHeureSuppXof: number | null
    seuilHeuresNormales: number | null
    chantier: { seuilHeuresNormales: number }
  },
): number {
  const seuil = contrat.seuilHeuresNormales ?? contrat.chantier.seuilHeuresNormales
  const dureeH = (heureSortie.getTime() - heureEntree.getTime()) / 3_600_000

  if (!contrat.tauxHeureSuppXof || dureeH <= seuil) {
    return Math.round((dureeH / seuil) * contrat.tauxJournalierXof)
  }

  const heuresSupp = dureeH - seuil
  return contrat.tauxJournalierXof + Math.round(heuresSupp * contrat.tauxHeureSuppXof)
}

// ── Entrée ─────────────────────────────────────────────────────────────────

export async function pointageEntree(input: EntreeInput, pointeParId: string, entrepriseId: string) {
  const agent = await prisma.agent.findUnique({
    where: { matricule: input.matricule },
  })
  if (!agent) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Agent introuvable — matricule inconnu', 404)
  }

  // Vérifie contrat actif + fin de contrat automatique
  const contrat = await verifierContratActif(agent.id, entrepriseId)

  // Vérifier qu'il n'y a pas déjà un pointage EN_COURS aujourd'hui
  const debutJournee = new Date()
  debutJournee.setHours(0, 0, 0, 0)
  const finJournee = new Date()
  finJournee.setHours(23, 59, 59, 999)

  const pointageExistant = await prisma.pointage.findFirst({
    where: {
      contratId: contrat.id,
      dateJournee: { gte: debutJournee, lte: finJournee },
      statut: 'EN_COURS',
    },
  })
  if (pointageExistant) {
    throw new AppError(ERROR_CODES.AGENT_ALREADY_POINTED, 'Cet agent a déjà pointé son entrée aujourd\'hui', 409)
  }

  const maintenant = new Date()
  return prisma.pointage.create({
    data: {
      contratId: contrat.id,
      pointeParId,
      dateJournee: debutJournee,
      heureEntree: maintenant,
      statut: 'EN_COURS',
    },
  })
}

// ── Sortie + calcul A+C ────────────────────────────────────────────────────

export async function pointageSortie(input: SortieInput, pointeParId: string, entrepriseId: string) {
  const agent = await prisma.agent.findUnique({
    where: { matricule: input.matricule },
  })
  if (!agent) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Agent introuvable — matricule inconnu', 404)
  }

  const contrat = await prisma.contrat.findFirst({
    where: {
      agentId: agent.id,
      entrepriseId,
      statut: { in: ['ACTIF', 'PROVISOIRE'] },
    },
    include: {
      chantier: { select: { seuilHeuresNormales: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!contrat) {
    throw new AppError(ERROR_CODES.CONTRAT_INACTIF, 'Aucun contrat actif pour cet agent', 403)
  }

  const pointage = await prisma.pointage.findFirst({
    where: { contratId: contrat.id, statut: 'EN_COURS' },
    orderBy: { heureEntree: 'desc' },
  })
  if (!pointage) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Aucun pointage d\'entrée en cours pour cet agent', 404)
  }

  const heureSortie = new Date()

  // Calcul A+C — stratégie : calcul immédiat stocké en totalJournalierXof
  const totalJournalierXof = calculerTotalJournalier(
    pointage.heureEntree,
    heureSortie,
    contrat,
  )

  return prisma.pointage.update({
    where: { id: pointage.id },
    data: {
      heureSortie,
      totalJournalierXof,
      statut: 'VALIDE',
      pointeParId,
    },
  })
}

// ── Historique ─────────────────────────────────────────────────────────────

export async function listPointages(entrepriseId: string, input: ListPointagesInput) {
  const { contrat_id, date, page, per_page } = input
  const skip = (page - 1) * per_page

  const dateFilter = date ? new Date(date) : undefined
  const debutJournee = dateFilter ? new Date(dateFilter.setHours(0, 0, 0, 0)) : undefined
  const finJournee = dateFilter ? new Date(dateFilter.setHours(23, 59, 59, 999)) : undefined

  const where = {
    contrat: { entrepriseId },
    ...(contrat_id && { contratId: contrat_id }),
    ...(debutJournee && finJournee && { dateJournee: { gte: debutJournee, lte: finJournee } }),
  }

  const [items, total] = await Promise.all([
    prisma.pointage.findMany({
      where,
      select: {
        id: true,
        contratId: true,
        dateJournee: true,
        heureEntree: true,
        heureSortie: true,
        totalJournalierXof: true,
        statut: true,
        corrigeLe: true,
        noteCorrection: true,
        contrat: {
          select: {
            agent: { select: { matricule: true, nom: true, prenom: true } },
            chantier: { select: { nom: true } },
          },
        },
      },
      orderBy: { dateJournee: 'desc' },
      skip,
      take: per_page,
    }),
    prisma.pointage.count({ where }),
  ])

  return {
    data: items,
    meta: { total, page, per_page, total_pages: Math.ceil(total / per_page) },
  }
}

// ── Correction (Manager) ───────────────────────────────────────────────────

export async function corrigerPointage(
  id: string,
  entrepriseId: string,
  corrigeParId: string,
  input: CorrigerPointageInput,
) {
  const pointage = await prisma.pointage.findFirst({
    where: {
      id,
      contrat: { entrepriseId },
      statut: { notIn: ['ABSENT'] },
    },
    include: {
      contrat: {
        include: { chantier: { select: { seuilHeuresNormales: true } } },
      },
    },
  })
  if (!pointage) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Pointage introuvable', 404)
  }

  const heureEntree = new Date(input.heureEntree)
  const heureSortie = new Date(input.heureSortie)

  if (heureSortie <= heureEntree) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'L\'heure de sortie doit être après l\'heure d\'entrée', 422)
  }

  // Recalcul A+C sur ce jour uniquement
  const totalJournalierXof = calculerTotalJournalier(heureEntree, heureSortie, pointage.contrat)

  return prisma.pointage.update({
    where: { id },
    data: {
      heureEntree,
      heureSortie,
      totalJournalierXof,
      statut: 'CORRIGE',
      corrigeParId,
      corrigeLe: new Date(),
      noteCorrection: input.noteCorrection,
    },
  })
}

// ── Absence manuelle (Manager) ─────────────────────────────────────────────

export async function creerAbsence(entrepriseId: string, corrigeParId: string, input: AbsenceInput) {
  const contrat = await prisma.contrat.findFirst({
    where: {
      agentId: input.agentId,
      entrepriseId,
      statut: { in: ['ACTIF', 'PROVISOIRE'] },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!contrat) {
    throw new AppError(ERROR_CODES.CONTRAT_INACTIF, 'Aucun contrat actif pour cet agent', 403)
  }

  const dateJournee = new Date(input.dateJournee)
  dateJournee.setHours(0, 0, 0, 0)

  // Vérifier qu'il n'existe pas déjà un pointage ce jour
  const existant = await prisma.pointage.findFirst({
    where: { contratId: contrat.id, dateJournee },
  })
  if (existant) {
    throw new AppError(ERROR_CODES.CONFLICT, 'Un pointage existe déjà pour ce jour', 409)
  }

  return prisma.pointage.create({
    data: {
      contratId: contrat.id,
      pointeParId: corrigeParId,
      dateJournee,
      heureEntree: dateJournee,
      totalJournalierXof: 0,
      statut: 'ABSENT',
      corrigeParId,
      corrigeLe: new Date(),
      noteCorrection: input.noteCorrection ?? 'Absence enregistrée manuellement',
    },
  })
}
