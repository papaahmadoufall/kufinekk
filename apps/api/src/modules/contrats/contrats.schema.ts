import { z } from 'zod'

export const createContratSchema = z.object({
  agentId: z.string().uuid(),
  chantierId: z.string().uuid(),
  poste: z.string().min(2).max(100),
  typeContrat: z.enum(['CONTRACTUEL', 'NON_CONTRACTUEL']),
  tauxJournalierXof: z.number().int().positive(),
  tauxHeureSuppXof: z.number().int().positive().optional(),
  seuilHeuresNormales: z.number().positive().optional(),
  heureDebutStd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format attendu : HH:MM')
    .optional(),
  dateDebut: z.string().datetime(),
  dateFin: z.string().datetime().optional(),
})

export const updateContratSchema = z.object({
  poste: z.string().min(2).max(100).optional(),
  tauxJournalierXof: z.number().int().positive().optional(),
  tauxHeureSuppXof: z.number().int().positive().nullable().optional(),
  seuilHeuresNormales: z.number().positive().nullable().optional(),
  heureDebutStd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format attendu : HH:MM')
    .nullable()
    .optional(),
  dateFin: z.string().datetime().nullable().optional(),
})

export const transfererContratSchema = z.object({
  chantierId: z.string().uuid(),
  poste: z.string().min(2).max(100),
  typeContrat: z.enum(['CONTRACTUEL', 'NON_CONTRACTUEL']),
  tauxJournalierXof: z.number().int().positive(),
  tauxHeureSuppXof: z.number().int().positive().optional(),
  seuilHeuresNormales: z.number().positive().optional(),
  heureDebutStd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format attendu : HH:MM')
    .optional(),
  dateDebut: z.string().datetime(),
  noteCloture: z.string().max(500).optional(),
})

export const terminerContratSchema = z.object({
  noteCloture: z.string().max(500).optional(),
})

export type CreateContratInput = z.infer<typeof createContratSchema>
export type UpdateContratInput = z.infer<typeof updateContratSchema>
export type TransfererContratInput = z.infer<typeof transfererContratSchema>
export type TerminerContratInput = z.infer<typeof terminerContratSchema>
