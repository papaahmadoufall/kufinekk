import bcrypt from 'bcrypt'
import { prisma } from '../../shared/db'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/codes'
import { genererMatricule } from '../../shared/services/matricule'
import { genererEtStockerQrCode } from '../../shared/services/qr'
import { sendSms, smsEnregistrementAgent } from '../../shared/services/axiomtext'
import type { CreateAgentInput, UpdateAgentInput, ListAgentsInput, SearchAgentInput } from './agents.schema'

const BCRYPT_ROUNDS = 10

export async function searchAgent(input: SearchAgentInput) {
  const agent = await prisma.agent.findUnique({
    where: { telephone: input.telephone },
    select: {
      id: true,
      matricule: true,
      telephone: true,
      nom: true,
      prenom: true,
      telephoneVerifie: true,
      qrCodeUrl: true,
      createdAt: true,
    },
  })
  return agent // null si introuvable — pas d'erreur, c'est une recherche
}

export async function listAgents(entrepriseId: string, input: ListAgentsInput) {
  const { chantier_id, statut, page, per_page } = input
  const skip = (page - 1) * per_page

  const whereContrat: Record<string, unknown> = { entrepriseId }
  if (chantier_id) whereContrat.chantierId = chantier_id
  if (statut) whereContrat.statut = statut

  const [items, total] = await Promise.all([
    prisma.agent.findMany({
      where: { contrats: { some: whereContrat } },
      select: {
        id: true,
        matricule: true,
        telephone: true,
        nom: true,
        prenom: true,
        telephoneVerifie: true,
        qrCodeUrl: true,
        createdAt: true,
        contrats: {
          where: whereContrat,
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            poste: true,
            statut: true,
            chantierId: true,
            chantier: { select: { nom: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: per_page,
    }),
    prisma.agent.count({
      where: { contrats: { some: whereContrat } },
    }),
  ])

  return {
    data: items,
    meta: { total, page, per_page, total_pages: Math.ceil(total / per_page) },
  }
}

export async function getAgent(id: string, entrepriseId: string) {
  const agent = await prisma.agent.findFirst({
    where: { id, contrats: { some: { entrepriseId } } },
    select: {
      id: true,
      matricule: true,
      telephone: true,
      nom: true,
      prenom: true,
      telephoneVerifie: true,
      qrCodeUrl: true,
      createdAt: true,
      contrats: {
        where: { entrepriseId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          poste: true,
          typeContrat: true,
          statut: true,
          tauxJournalierXof: true,
          tauxHeureSuppXof: true,
          dateDebut: true,
          dateFin: true,
          chantier: { select: { id: true, nom: true } },
        },
      },
    },
  })

  if (!agent) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Agent introuvable', 404)
  }

  return agent
}

export async function createAgent(entrepriseId: string, input: CreateAgentInput) {
  // Vérifier doublon téléphone
  const existant = await prisma.agent.findUnique({ where: { telephone: input.telephone } })
  if (existant) {
    throw new AppError(ERROR_CODES.CONFLICT, 'Un agent avec ce numéro existe déjà', 409)
  }

  const [matricule, pinHash] = await Promise.all([
    genererMatricule(entrepriseId),
    bcrypt.hash(input.pin, BCRYPT_ROUNDS),
  ])

  const qrCodeUrl = await genererEtStockerQrCode(matricule)

  const agent = await prisma.agent.create({
    data: {
      matricule,
      telephone: input.telephone,
      nom: input.nom,
      prenom: input.prenom,
      pinHash,
      qrCodeUrl,
    },
    select: {
      id: true,
      matricule: true,
      telephone: true,
      nom: true,
      prenom: true,
      telephoneVerifie: true,
      qrCodeUrl: true,
      createdAt: true,
    },
  })

  // SMS avec QR code + PIN (best-effort, ne bloque pas la création)
  sendSms(input.telephone, smsEnregistrementAgent(input.prenom, qrCodeUrl, input.pin)).catch(
    (err) => console.error('SMS enregistrement agent échoué:', err),
  )

  return agent
}

export async function updateAgent(id: string, entrepriseId: string, input: UpdateAgentInput) {
  const agent = await prisma.agent.findFirst({
    where: { id, contrats: { some: { entrepriseId } } },
  })

  if (!agent) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Agent introuvable', 404)
  }

  const data: Record<string, unknown> = {}
  if (input.nom) data.nom = input.nom
  if (input.prenom) data.prenom = input.prenom
  if (input.pin) data.pinHash = await bcrypt.hash(input.pin, BCRYPT_ROUNDS)

  return prisma.agent.update({
    where: { id },
    data,
    select: {
      id: true,
      matricule: true,
      telephone: true,
      nom: true,
      prenom: true,
      telephoneVerifie: true,
      qrCodeUrl: true,
      createdAt: true,
    },
  })
}
