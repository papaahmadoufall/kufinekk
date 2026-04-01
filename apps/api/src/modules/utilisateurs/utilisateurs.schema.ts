import { z } from 'zod'

export const createUtilisateurSchema = z.object({
  nom: z.string().min(2).max(100),
  telephone: z
    .string()
    .regex(/^\+221[0-9]{9}$/, 'Numéro invalide — format attendu : +221XXXXXXXXX'),
  role: z.enum(['MANAGER', 'POINTEUR']),
  pin: z.string().length(4, 'Le PIN doit contenir 4 chiffres').regex(/^\d+$/, 'Chiffres uniquement'),
})

export const updateUtilisateurSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  role: z.enum(['MANAGER', 'POINTEUR']).optional(),
  pin: z.string().length(4).regex(/^\d+$/).optional(),
  actif: z.boolean().optional(),
})

export const listUtilisateursSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateUtilisateurInput = z.infer<typeof createUtilisateurSchema>
export type UpdateUtilisateurInput = z.infer<typeof updateUtilisateurSchema>
export type ListUtilisateursInput = z.infer<typeof listUtilisateursSchema>
