import { prisma } from '../../shared/db'
import { StatutContrat } from '@prisma/client'
import type { ResumeInput, SemaineInput } from './dashboard.schema'

// ── Résumé du jour ─────────────────────────────────────────────────────────

export async function getResume(entrepriseId: string, input: ResumeInput) {
  const debutJournee = new Date()
  debutJournee.setHours(0, 0, 0, 0)
  const finJournee = new Date()
  finJournee.setHours(23, 59, 59, 999)

  const whereContrat = {
    entrepriseId,
    statut: { in: [StatutContrat.ACTIF, StatutContrat.PROVISOIRE] },
    ...(input.chantier_id && { chantierId: input.chantier_id }),
  }

  const [
    totalAgentsActifs,
    presentAujourdhui,
    enCoursEntree,
    absentAujourdhui,
    agentsEnAttente,
    totalJourneeXof,
  ] = await Promise.all([
    // Total agents avec contrat actif/provisoire
    prisma.contrat.count({ where: whereContrat }),

    // Présents aujourd'hui (au moins une entrée)
    prisma.pointage.count({
      where: {
        contrat: whereContrat,
        dateJournee: { gte: debutJournee, lte: finJournee },
        statut: { in: ['EN_COURS', 'VALIDE', 'CORRIGE'] },
      },
    }),

    // En cours (entrée sans sortie)
    prisma.pointage.count({
      where: {
        contrat: whereContrat,
        dateJournee: { gte: debutJournee, lte: finJournee },
        statut: 'EN_COURS',
      },
    }),

    // Absents aujourd'hui
    prisma.pointage.count({
      where: {
        contrat: whereContrat,
        dateJournee: { gte: debutJournee, lte: finJournee },
        statut: 'ABSENT',
      },
    }),

    // En attente de validation (PROVISOIRE)
    prisma.contrat.count({
      where: { ...whereContrat, statut: 'PROVISOIRE' },
    }),

    // Total XOF pointé aujourd'hui
    prisma.pointage.aggregate({
      where: {
        contrat: whereContrat,
        dateJournee: { gte: debutJournee, lte: finJournee },
        statut: { in: ['VALIDE', 'CORRIGE'] },
      },
      _sum: { totalJournalierXof: true },
    }),
  ])

  return {
    date: debutJournee.toISOString().split('T')[0],
    totalAgentsActifs,
    presentAujourdhui,
    enCoursEntree,
    absentAujourdhui,
    agentsEnAttente,
    totalJourneeXof: totalJourneeXof?._sum?.totalJournalierXof ?? 0,
  }
}

// ── Totaux hebdomadaires ───────────────────────────────────────────────────

export async function getSemaine(entrepriseId: string, input: SemaineInput) {
  // Calculer la semaine vendredi→jeudi
  const dateRef = input.semaine ? new Date(input.semaine) : new Date()
  const jour = dateRef.getDay()
  const diffVendredi = (jour + 2) % 7
  const semaineDebut = new Date(dateRef)
  semaineDebut.setDate(dateRef.getDate() - diffVendredi)
  semaineDebut.setHours(0, 0, 0, 0)
  const semaineFin = new Date(semaineDebut)
  semaineFin.setDate(semaineDebut.getDate() + 6)
  semaineFin.setHours(23, 59, 59, 999)

  const whereContrat = {
    entrepriseId,
    ...(input.chantier_id && { chantierId: input.chantier_id }),
  }

  const [pointagesStats, cyclesStats, parChantier] = await Promise.all([
    // Stats globales pointages de la semaine
    prisma.pointage.aggregate({
      where: {
        contrat: whereContrat,
        dateJournee: { gte: semaineDebut, lte: semaineFin },
        statut: { in: ['VALIDE', 'CORRIGE'] },
      },
      _sum: { totalJournalierXof: true },
      _count: { id: true },
    }),

    // Cycles en cours / validés / payés de la semaine
    prisma.cyclePaie.groupBy({
      by: ['statut'],
      where: {
        contrat: whereContrat,
        semaineDebut: { gte: semaineDebut },
      },
      _count: { id: true },
      _sum: { totalHebdoXof: true },
    }),

    // Détail par chantier
    prisma.chantier.findMany({
      where: { entrepriseId, ...(input.chantier_id && { id: input.chantier_id }) },
      select: {
        id: true,
        nom: true,
        contrats: {
          where: { statut: { in: ['ACTIF', 'PROVISOIRE'] } },
          select: {
            pointages: {
              where: {
                dateJournee: { gte: semaineDebut, lte: semaineFin },
                statut: { in: ['VALIDE', 'CORRIGE'] },
              },
              select: { totalJournalierXof: true },
            },
          },
        },
      },
    }),
  ])

  const detailParChantier = parChantier.map((c) => ({
    chantierId: c.id,
    chantierNom: c.nom,
    totalXof: c.contrats
      .flatMap((ct) => ct.pointages)
      .reduce((sum, p) => sum + (p.totalJournalierXof ?? 0), 0),
    nbJournees: c.contrats.flatMap((ct) => ct.pointages).length,
  }))

  return {
    semaineDebut: semaineDebut.toISOString().split('T')[0],
    semaineFin: semaineFin.toISOString().split('T')[0],
    totalJourneesPointees: pointagesStats._count.id,
    masseSalarialeXof: pointagesStats._sum.totalJournalierXof ?? 0,
    cyclesParStatut: cyclesStats,
    detailParChantier,
  }
}
