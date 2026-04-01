import { z } from 'zod'

export const entreeSchema = z.object({
  matricule: z.string().regex(/^KFN-\d{5}$/, 'Format matricule invalide : KFN-XXXXX'),
})

export const sortieSchema = z.object({
  matricule: z.string().regex(/^KFN-\d{5}$/, 'Format matricule invalide : KFN-XXXXX'),
})

export const corrigerPointageSchema = z.object({
  heureEntree: z.string().datetime(),
  heureSortie: z.string().datetime(),
  noteCorrection: z.string().max(500).optional(),
})

export const absenceSchema = z.object({
  agentId: z.string().uuid(),
  dateJournee: z.string().datetime(),
  noteCorrection: z.string().max(500).optional(),
})

export const listPointagesSchema = z.object({
  contrat_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD').optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})

export type EntreeInput = z.infer<typeof entreeSchema>
export type SortieInput = z.infer<typeof sortieSchema>
export type CorrigerPointageInput = z.infer<typeof corrigerPointageSchema>
export type AbsenceInput = z.infer<typeof absenceSchema>
export type ListPointagesInput = z.infer<typeof listPointagesSchema>
