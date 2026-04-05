import { z } from 'zod'

// ── Inputs ─────────────────────────────────────────────────────────────────

export const sendOtpSchema = z.object({
  telephone: z
    .string()
    .regex(/^\+221[0-9]{9}$/, 'Numéro invalide — format attendu : +221XXXXXXXXX'),
})

export const verifyOtpSchema = z.object({
  telephone: z
    .string()
    .regex(/^\+221[0-9]{9}$/, 'Numéro invalide — format attendu : +221XXXXXXXXX'),
  code: z.string().length(6, 'Le code OTP doit contenir 6 chiffres').regex(/^\d+$/, 'Chiffres uniquement'),
})

export const loginSchema = z
  .object({
    telephone: z
      .string()
      .regex(/^\+221[0-9]{9}$/, 'Numéro invalide — format attendu : +221XXXXXXXXX'),
    pin: z
      .string()
      .length(4, 'Le PIN doit contenir 4 chiffres')
      .regex(/^\d+$/, 'Chiffres uniquement')
      .optional(),
    motDePasse: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional(),
  })
  .refine((d) => d.pin !== undefined || d.motDePasse !== undefined, {
    message: 'Fournir un PIN (Pointeur) ou un mot de passe (Manager)',
  })

// ── Types inférés ──────────────────────────────────────────────────────────

export type SendOtpInput = z.infer<typeof sendOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type LoginInput = z.infer<typeof loginSchema> & { pin?: string; motDePasse?: string }
