import { z } from 'zod'

export const listCyclesSchema = z.object({
  chantier_id: z.string().uuid().optional(),
  semaine: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD').optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})

export type ListCyclesInput = z.infer<typeof listCyclesSchema>
