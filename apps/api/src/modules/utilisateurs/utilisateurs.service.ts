import bcrypt from 'bcrypt'
import { prisma } from '../../shared/db'
import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/codes'
import type { CreateUtilisateurInput, UpdateUtilisateurInput, ListUtilisateursInput } from './utilisateurs.schema'

const BCRYPT_ROUNDS = 10

export async function listUtilisateurs(entrepriseId: string, input: ListUtilisateursInput) {
  const { page, per_page } = input
  const skip = (page - 1) * per_page

  const [items, total] = await Promise.all([
    prisma.utilisateur.findMany({
      where: { entrepriseId },
      select: {
        id: true,
        nom: true,
        telephone: true,
        role: true,
        actif: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: per_page,
    }),
    prisma.utilisateur.count({ where: { entrepriseId } }),
  ])

  return {
    data: items,
    meta: {
      total,
      page,
      per_page,
      total_pages: Math.ceil(total / per_page),
    },
  }
}

export async function createUtilisateur(entrepriseId: string, input: CreateUtilisateurInput) {
  const existant = await prisma.utilisateur.findUnique({
    where: { telephone: input.telephone },
  })

  if (existant) {
    throw new AppError(ERROR_CODES.CONFLICT, 'Ce numéro est déjà utilisé', 409)
  }

  const pinHash = await bcrypt.hash(input.pin, BCRYPT_ROUNDS)

  const utilisateur = await prisma.utilisateur.create({
    data: {
      entrepriseId,
      nom: input.nom,
      telephone: input.telephone,
      role: input.role,
      pinHash,
    },
    select: {
      id: true,
      nom: true,
      telephone: true,
      role: true,
      actif: true,
      createdAt: true,
    },
  })

  return utilisateur
}

export async function updateUtilisateur(
  id: string,
  entrepriseId: string,
  input: UpdateUtilisateurInput,
) {
  const utilisateur = await prisma.utilisateur.findFirst({
    where: { id, entrepriseId },
  })

  if (!utilisateur) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Utilisateur introuvable', 404)
  }

  const data: Record<string, unknown> = {}
  if (input.nom) data.nom = input.nom
  if (input.role) data.role = input.role
  if (input.actif !== undefined) data.actif = input.actif
  if (input.pin) data.pinHash = await bcrypt.hash(input.pin, BCRYPT_ROUNDS)

  return prisma.utilisateur.update({
    where: { id },
    data,
    select: {
      id: true,
      nom: true,
      telephone: true,
      role: true,
      actif: true,
      createdAt: true,
    },
  })
}

export async function deleteUtilisateur(id: string, entrepriseId: string) {
  const utilisateur = await prisma.utilisateur.findFirst({
    where: { id, entrepriseId },
  })

  if (!utilisateur) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Utilisateur introuvable', 404)
  }

  // Soft delete
  await prisma.utilisateur.update({
    where: { id },
    data: { actif: false },
  })
}
