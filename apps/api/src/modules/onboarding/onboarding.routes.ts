import type { FastifyInstance } from 'fastify'
import { sendOtpPublicSchema, registerSchema } from './onboarding.schema'
import { sendOtpPublic, register } from './onboarding.service'
import { AppError } from '../../shared/errors/AppError'

export async function onboardingRoutes(app: FastifyInstance) {
  // ── POST /send-otp : public (toute entrée) ────────────────────────────────
  app.post('/send-otp', async (req, reply) => {
    const parsed = sendOtpPublicSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: parsed.error.issues },
      })
    }
    try {
      await sendOtpPublic(parsed.data)
      return reply.code(200).send({ data: { message: 'OTP envoyé' } })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST /register : inscription complète ─────────────────────────────────
  app.post('/register', async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: parsed.error.issues },
      })
    }
    try {
      const data = await register(parsed.data, (p) => app.jwt.sign(p))
      return reply.code(201).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })
}
