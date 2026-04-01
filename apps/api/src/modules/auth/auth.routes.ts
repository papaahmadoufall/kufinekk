import type { FastifyInstance } from 'fastify'
import { sendOtpSchema, verifyOtpSchema, loginSchema } from './auth.schema'
import { sendOtp, verifyOtp, login, logout } from './auth.service'
import { authMiddleware } from '../../shared/middleware/auth'
import { AppError } from '../../shared/errors/AppError'

export async function authRoutes(app: FastifyInstance) {
  // ── POST /send-otp ────────────────────────────────────────────────────────

  app.post('/send-otp', async (req, reply) => {
    const result = sendOtpSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    await sendOtp(result.data)
    return reply.code(200).send({ data: { message: 'OTP envoyé' } })
  })

  // ── POST /verify-otp ──────────────────────────────────────────────────────

  app.post('/verify-otp', async (req, reply) => {
    const result = verifyOtpSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await verifyOtp(result.data, (payload) => app.jwt.sign(payload))
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST /login ───────────────────────────────────────────────────────────

  app.post('/login', async (req, reply) => {
    const result = loginSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await login(result.data, (payload) => app.jwt.sign(payload))
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST /logout ──────────────────────────────────────────────────────────

  app.post('/logout', { preHandler: authMiddleware }, async (req, reply) => {
    const token = req.headers.authorization?.replace('Bearer ', '') ?? ''
    await logout(token)
    return reply.code(204).send()
  })
}
