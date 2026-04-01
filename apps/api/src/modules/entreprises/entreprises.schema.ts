import { z } from 'zod'

export const updateEntrepriseSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  adresse: z.string().max(200).optional(),
})

export type UpdateEntrepriseInput = z.infer<typeof updateEntrepriseSchema>
