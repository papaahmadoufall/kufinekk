import { prisma } from '../../shared/db'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/codes'
import { creerPayoutBatch, getStatutPayoutBatch } from '../../shared/services/wave'
import { sendSms, smsPaiementWave, smsWaveBatchEchoue } from '../../shared/services/axiomtext'
import type { ListCyclesInput } from './cycles-paie.schema'

// ── Utilitaires semaine vendredi→jeudi ─────────────────────────────────────

function getSemaineEnCours(): { semaineDebut: Date; semaineFin: Date } {
  const now = new Date()
  const jour = now.getDay() // 0=dim, 1=lun, ..., 5=ven, 6=sam

  // Trouver le vendredi précédent (ou aujourd'hui si vendredi)
  const diffVendredi = (jour + 2) % 7 // jours depuis vendredi
  const semaineDebut = new Date(now)
  semaineDebut.setDate(now.getDate() - diffVendredi)
  semaineDebut.setHours(0, 0, 0, 0)

  // Jeudi suivant = vendredi + 6 jours
  const semaineFin = new Date(semaineDebut)
  semaineFin.setDate(semaineDebut.getDate() + 6)
  semaineFin.setHours(23, 59, 59, 999)

  return { semaineDebut, semaineFin }
}

// ── Liste des cycles ───────────────────────────────────────────────────────

export async function listCyclesPaie(entrepriseId: string, input: ListCyclesInput) {
  const { chantier_id, semaine, page, per_page } = input
  const skip = (page - 1) * per_page

  const semaineDate = semaine ? new Date(semaine) : undefined

  const where = {
    contrat: {
      entrepriseId,
      ...(chantier_id && { chantierId: chantier_id }),
    },
    ...(semaineDate && {
      semaineDebut: { lte: semaineDate },
      semaineFin: { gte: semaineDate },
    }),
  }

  const [items, total] = await Promise.all([
    prisma.cyclePaie.findMany({
      where,
      select: {
        id: true,
        semaineDebut: true,
        semaineFin: true,
        totalHebdoXof: true,
        statut: true,
        valideLe: true,
        waveBatchId: true,
        waveStatut: true,
        createdAt: true,
        contrat: {
          select: {
            agent: { select: { matricule: true, nom: true, prenom: true, telephone: true } },
            chantier: { select: { nom: true } },
            poste: true,
          },
        },
      },
      orderBy: { semaineDebut: 'desc' },
      skip,
      take: per_page,
    }),
    prisma.cyclePaie.count({ where }),
  ])

  return {
    data: items,
    meta: { total, page, per_page, total_pages: Math.ceil(total / per_page) },
  }
}

// ── Détail d'un cycle ──────────────────────────────────────────────────────

export async function getCyclePaie(id: string, entrepriseId: string) {
  const cycle = await prisma.cyclePaie.findFirst({
    where: { id, contrat: { entrepriseId } },
    include: {
      contrat: {
        select: {
          agent: { select: { matricule: true, nom: true, prenom: true, telephone: true } },
          chantier: { select: { nom: true } },
          poste: true,
          pointages: {
            where: {
              dateJournee: {
                gte: undefined, // sera remplacé dynamiquement
              },
            },
            select: {
              id: true,
              dateJournee: true,
              heureEntree: true,
              heureSortie: true,
              totalJournalierXof: true,
              statut: true,
            },
            orderBy: { dateJournee: 'asc' },
          },
        },
      },
    },
  })

  if (!cycle) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Cycle de paie introuvable', 404)
  }

  // Filtrer les pointages dans la période du cycle
  const pointagesDuCycle = cycle.contrat.pointages.filter(
    (p) => p.dateJournee >= cycle.semaineDebut && p.dateJournee <= cycle.semaineFin,
  )

  return { ...cycle, contrat: { ...cycle.contrat, pointages: pointagesDuCycle } }
}

// ── Clôturer et générer le cycle si inexistant ────────────────────────────

async function getOuCreerCycle(contratId: string, semaineDebut: Date, semaineFin: Date) {
  const existant = await prisma.cyclePaie.findFirst({
    where: { contratId, semaineDebut },
  })
  if (existant) return existant

  // Calculer le total hebdo = SUM(totalJournalierXof) sur la semaine
  const pointages = await prisma.pointage.findMany({
    where: {
      contratId,
      dateJournee: { gte: semaineDebut, lte: semaineFin },
      statut: { in: ['VALIDE', 'CORRIGE'] },
    },
    select: { totalJournalierXof: true },
  })

  const totalHebdoXof = pointages.reduce((sum, p) => sum + (p.totalJournalierXof ?? 0), 0)

  return prisma.cyclePaie.create({
    data: { contratId, semaineDebut, semaineFin, totalHebdoXof },
  })
}

// ── Valider → déclencher Wave batch ───────────────────────────────────────

export async function validerCycle(id: string, entrepriseId: string, valideParId: string) {
  const cycle = await prisma.cyclePaie.findFirst({
    where: { id, contrat: { entrepriseId }, statut: 'EN_COURS' },
    include: {
      contrat: {
        include: {
          agent: { select: { telephone: true, nom: true, prenom: true } },
          entreprise: { select: { nom: true } },
        },
      },
    },
  })

  if (!cycle) {
    throw new AppError(ERROR_CODES.CYCLE_DEJA_VALIDE, 'Cycle introuvable ou déjà validé', 404)
  }

  // Marquer validé en base
  await prisma.cyclePaie.update({
    where: { id },
    data: { statut: 'VALIDE', valideParId, valideLe: new Date() },
  })

  // Déclencher Wave payout (best-effort — ne bloque pas la validation)
  try {
    const { batchId, statut } = await creerPayoutBatch([
      {
        telephone: cycle.contrat.agent.telephone,
        montantXof: cycle.totalHebdoXof,
        nom: `${cycle.contrat.agent.prenom} ${cycle.contrat.agent.nom}`,
        reference: id,
      },
    ])

    await prisma.cyclePaie.update({
      where: { id },
      data: { statut: 'PAYE', waveBatchId: batchId, waveStatut: statut },
    })

    // SMS paiement à l'agent
    sendSms(
      cycle.contrat.agent.telephone,
      smsPaiementWave(cycle.contrat.agent.prenom, cycle.totalHebdoXof),
    ).catch((err) => console.error('SMS paiement Wave échoué:', err))
  } catch (err) {
    // Wave a échoué — marquer ECHOUE + SMS manager
    await prisma.cyclePaie.update({
      where: { id },
      data: { statut: 'ECHOUE', waveStatut: String(err) },
    })

    sendSms(
      cycle.contrat.entreprise.nom, // sera remplacé par le téléphone manager en prod
      smsWaveBatchEchoue(cycle.contrat.entreprise.nom, id),
    ).catch(() => {})

    throw new AppError(ERROR_CODES.WAVE_ERROR, 'Le paiement Wave a échoué', 502)
  }

  return prisma.cyclePaie.findUnique({ where: { id } })
}

// ── Polling statut Wave ────────────────────────────────────────────────────

export async function getStatutWave(id: string, entrepriseId: string) {
  const cycle = await prisma.cyclePaie.findFirst({
    where: { id, contrat: { entrepriseId } },
    select: { id: true, waveBatchId: true, waveStatut: true, statut: true },
  })

  if (!cycle) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Cycle introuvable', 404)
  }

  if (!cycle.waveBatchId) {
    return { id: cycle.id, statut: cycle.statut, waveStatut: null }
  }

  // Appel Wave pour statut frais
  const waveData = await getStatutPayoutBatch(cycle.waveBatchId)

  // Mettre à jour le statut en base si changé
  if (waveData.status !== cycle.waveStatut) {
    await prisma.cyclePaie.update({
      where: { id },
      data: { waveStatut: waveData.status },
    })
  }

  return { id: cycle.id, statut: cycle.statut, waveStatut: waveData.status, detail: waveData }
}

// ── Générer les cycles de la semaine en cours pour une entreprise ──────────
// Appelé manuellement ou via cron chaque vendredi

export async function genererCyclesSemaine(entrepriseId: string) {
  const { semaineDebut, semaineFin } = getSemaineEnCours()

  const contrats = await prisma.contrat.findMany({
    where: {
      entrepriseId,
      statut: { in: ['ACTIF', 'PROVISOIRE'] },
      typeContrat: 'NON_CONTRACTUEL',
    },
    select: { id: true },
  })

  const cycles = await Promise.all(
    contrats.map((c) => getOuCreerCycle(c.id, semaineDebut, semaineFin)),
  )

  return { count: cycles.length, semaineDebut, semaineFin }
}
