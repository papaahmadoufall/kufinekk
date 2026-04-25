import { z } from 'zod'

const phoneRegex = /^\+?[0-9\s-]{8,20}$/

export const sendOtpPublicSchema = z.object({
  telephone: z.string().regex(phoneRegex, 'Numéro invalide'),
})
export type SendOtpPublicInput = z.infer<typeof sendOtpPublicSchema>

export const verifyOtpPublicSchema = z.object({
  telephone: z.string().regex(phoneRegex, 'Numéro invalide'),
  code: z.string().regex(/^\d{6}$/, 'Code OTP invalide'),
})
export type VerifyOtpPublicInput = z.infer<typeof verifyOtpPublicSchema>

export const registerSchema = z.object({
  // Compte manager
  prenom: z.string().min(1),
  nom: z.string().min(1),
  telephone: z.string().regex(phoneRegex),
  motDePasse: z.string().min(8, 'Au moins 8 caractères'),
  otpCode: z.string().regex(/^\d{6}$/, 'Code OTP invalide'),

  // Entreprise
  raisonSociale: z.string().min(1),
  ninea: z.string().optional(),
  ville: z.string().optional(),
  taille: z.string().optional(),

  // Premier chantier
  chantierNom: z.string().min(1),
  chantierAdresse: z.string().optional(),
  chantierDebut: z.string().min(8), // ISO date YYYY-MM-DD
  chantierTauxJournalier: z.number().int().nonnegative(),

  // Premier pointeur (optionnel)
  pointeur: z
    .object({
      prenom: z.string().min(1),
      nom: z.string().min(1),
      telephone: z.string().regex(phoneRegex),
      pin: z.string().regex(/^\d{4}$/),
    })
    .optional(),

  // Premiers agents (optionnels)
  agents: z
    .array(
      z.object({
        prenom: z.string().min(1),
        nom: z.string().min(1),
        telephone: z.string().regex(phoneRegex).optional(),
        poste: z.string().min(1),
        tauxJournalierXof: z.number().int().nonnegative(),
      }),
    )
    .optional()
    .default([]),
})
export type RegisterInput = z.infer<typeof registerSchema>
