import { z } from 'zod'

export const createAgentSchema = z.object({
  telephone: z
    .string()
    .regex(/^\+221[0-9]{9}$/, 'Numéro invalide — format attendu : +221XXXXXXXXX'),
  nom: z.string().min(2).max(100),
  prenom: z.string().min(2).max(100),
  pin: z.string().length(4, 'Le PIN doit contenir 4 chiffres').regex(/^\d+$/, 'Chiffres uniquement'),
})

export const updateAgentSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  prenom: z.string().min(2).max(100).optional(),
  pin: z.string().length(4).regex(/^\d+$/).optional(),
})

export const listAgentsSchema = z.object({
  chantier_id: z.string().uuid().optional(),
  statut: z.enum(['PROVISOIRE', 'ACTIF', 'TERMINE']).optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})

export const searchAgentSchema = z.object({
  telephone: z
    .string()
    .regex(/^\+221[0-9]{9}$/, 'Numéro invalide — format attendu : +221XXXXXXXXX'),
})

export type CreateAgentInput = z.infer<typeof createAgentSchema>
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>
export type ListAgentsInput = z.infer<typeof listAgentsSchema>
export type SearchAgentInput = z.infer<typeof searchAgentSchema>
