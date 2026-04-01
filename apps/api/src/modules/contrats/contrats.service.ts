import { prisma } from '../../shared/db'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/codes'
import { sendSms, smsTransfertChantier } from '../../shared/services/axiomtext'
import type {
  CreateContratInput,
  UpdateContratInput,
  TransfererContratInput,
  TerminerContratInput,
} from './contrats.schema'

export async function createContrat(entrepriseId: string, input: CreateContratInput, valideParId: string) {
  // Vérifier que l'agent et le chantier appartiennent à l'entreprise
  const [agent, chantier] = await Promise.all([
    prisma.agent.findUnique({ where: { id: input.agentId } }),
    prisma.chantier.findFirst({ where: { id: input.chantierId, entrepriseId } }),
  ])

  if (!agent) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Agent introuvable', 404)
  }
  if (!chantier) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Chantier introuvable', 404)
  }

  // Vérifier qu'il n'y a pas déjà un contrat actif/provisoire sur ce chantier
  const contratExistant = await prisma.contrat.findFirst({
    where: {
      agentId: input.agentId,
      chantierId: input.chantierId,
      entrepriseId,
      statut: { in: ['ACTIF', 'PROVISOIRE'] },
    },
  })
  if (contratExistant) {
    throw new AppError(ERROR_CODES.CONFLICT, 'Un contrat actif existe déjà pour cet agent sur ce chantier', 409)
  }

  return prisma.contrat.create({
    data: {
      agentId: input.agentId,
      chantierId: input.chantierId,
      entrepriseId,
      poste: input.poste,
      typeContrat: input.typeContrat,
      tauxJournalierXof: input.tauxJournalierXof,
      tauxHeureSuppXof: input.tauxHeureSuppXof,
      seuilHeuresNormales: input.seuilHeuresNormales,
      heureDebutStd: input.heureDebutStd,
      dateDebut: new Date(input.dateDebut),
      dateFin: input.dateFin ? new Date(input.dateFin) : null,
      statut: 'PROVISOIRE',
      valideParId,
    },
  })
}

export async function updateContrat(id: string, entrepriseId: string, input: UpdateContratInput) {
  const contrat = await prisma.contrat.findFirst({
    where: { id, entrepriseId, statut: { in: ['ACTIF', 'PROVISOIRE'] } },
  })
  if (!contrat) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Contrat introuvable ou déjà terminé', 404)
  }

  return prisma.contrat.update({
    where: { id },
    data: {
      ...(input.poste !== undefined && { poste: input.poste }),
      ...(input.tauxJournalierXof !== undefined && { tauxJournalierXof: input.tauxJournalierXof }),
      ...(input.tauxHeureSuppXof !== undefined && { tauxHeureSuppXof: input.tauxHeureSuppXof }),
      ...(input.seuilHeuresNormales !== undefined && { seuilHeuresNormales: input.seuilHeuresNormales }),
      ...(input.heureDebutStd !== undefined && { heureDebutStd: input.heureDebutStd }),
      ...(input.dateFin !== undefined && { dateFin: input.dateFin ? new Date(input.dateFin) : null }),
    },
  })
}

export async function validerContrat(id: string, entrepriseId: string, valideParId: string) {
  const contrat = await prisma.contrat.findFirst({
    where: { id, entrepriseId, statut: 'PROVISOIRE' },
  })
  if (!contrat) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Contrat introuvable ou déjà validé', 404)
  }

  return prisma.contrat.update({
    where: { id },
    data: { statut: 'ACTIF', valideParId },
  })
}

export async function validerTousContratsProvisoires(entrepriseId: string, valideParId: string) {
  const result = await prisma.contrat.updateMany({
    where: { entrepriseId, statut: 'PROVISOIRE' },
    data: { statut: 'ACTIF', valideParId },
  })
  return { count: result.count }
}

/**
 * Transfert atomique : clôture contrat A → création contrat B
 * Règle CLAUDE.md : prisma.$transaction() obligatoire
 */
export async function transfererContrat(
  id: string,
  entrepriseId: string,
  input: TransfererContratInput,
  valideParId: string,
) {
  const contratA = await prisma.contrat.findFirst({
    where: { id, entrepriseId, statut: { in: ['ACTIF', 'PROVISOIRE'] } },
    include: { agent: { select: { telephone: true, prenom: true } } },
  })
  if (!contratA) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Contrat introuvable ou déjà terminé', 404)
  }

  const chantierB = await prisma.chantier.findFirst({
    where: { id: input.chantierId, entrepriseId },
    select: { id: true, nom: true },
  })
  if (!chantierB) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Chantier de destination introuvable', 404)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [, contratB] = await prisma.$transaction([
    // Clôturer contrat A
    prisma.contrat.update({
      where: { id },
      data: {
        statut: 'TERMINE',
        dateFin: today,
        noteCloture: input.noteCloture ?? 'Transfert de chantier',
      },
    }),
    // Créer contrat B
    prisma.contrat.create({
      data: {
        agentId: contratA.agentId,
        chantierId: input.chantierId,
        entrepriseId,
        poste: input.poste,
        typeContrat: input.typeContrat,
        tauxJournalierXof: input.tauxJournalierXof,
        tauxHeureSuppXof: input.tauxHeureSuppXof,
        seuilHeuresNormales: input.seuilHeuresNormales,
        heureDebutStd: input.heureDebutStd,
        dateDebut: new Date(input.dateDebut),
        statut: 'PROVISOIRE',
        valideParId,
      },
    }),
  ])

  // SMS au transfert (best-effort)
  sendSms(
    contratA.agent.telephone,
    smsTransfertChantier(contratA.agent.prenom, chantierB.nom),
  ).catch((err) => console.error('SMS transfert échoué:', err))

  return contratB
}

export async function terminerContrat(
  id: string,
  entrepriseId: string,
  input: TerminerContratInput,
) {
  const contrat = await prisma.contrat.findFirst({
    where: { id, entrepriseId, statut: { in: ['ACTIF', 'PROVISOIRE'] } },
  })
  if (!contrat) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Contrat introuvable ou déjà terminé', 404)
  }

  return prisma.contrat.update({
    where: { id },
    data: {
      statut: 'TERMINE',
      dateFin: new Date(),
      noteCloture: input.noteCloture,
    },
  })
}
