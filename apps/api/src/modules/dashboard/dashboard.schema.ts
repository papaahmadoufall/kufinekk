import { z } from 'zod'

export const resumeSchema = z.object({
  chantier_id: z.string().uuid().optional(),
})

export const semaineSchema = z.object({
  chantier_id: z.string().uuid().optional(),
  semaine: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD').optional(),
})

export type ResumeInput = z.infer<typeof resumeSchema>
export type SemaineInput = z.infer<typeof semaineSchema>
