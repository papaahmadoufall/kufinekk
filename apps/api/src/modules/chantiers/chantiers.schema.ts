import { z } from 'zod'

const heureRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const createChantierSchema = z.object({
  nom: z.string().min(2).max(100),
  adresse: z.string().max(200).optional(),
  dateDebut: z.string().datetime(),
  dateFinPrevue: z.string().datetime().optional(),
  heureDebutStd: z.string().regex(heureRegex, 'Format attendu : HH:MM').default('08:00'),
  seuilHeuresNormales: z.number().positive().default(8.0),
})

export const updateChantierSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  adresse: z.string().max(200).nullable().optional(),
  dateFinPrevue: z.string().datetime().nullable().optional(),
  heureDebutStd: z.string().regex(heureRegex, 'Format attendu : HH:MM').optional(),
  seuilHeuresNormales: z.number().positive().optional(),
  statut: z.enum(['ACTIF', 'TERMINE', 'EN_PAUSE']).optional(),
})

export const listChantiersSchema = z.object({
  statut: z.enum(['ACTIF', 'TERMINE', 'EN_PAUSE']).optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateChantierInput = z.infer<typeof createChantierSchema>
export type UpdateChantierInput = z.infer<typeof updateChantierSchema>
export type ListChantiersInput = z.infer<typeof listChantiersSchema>
