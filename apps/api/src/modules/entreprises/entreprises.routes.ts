import type { FastifyInstance } from 'fastify'
import { updateEntrepriseSchema } from './entreprises.schema'
import { getEntreprise, updateEntreprise } from './entreprises.service'
import { authMiddleware } from '../../shared/middleware/auth'
import { entrepriseScopeMiddleware } from '../../shared/middleware/entreprise-scope'
import { requireRole } from '../../shared/middleware/rbac'
import { AppError } from '../../shared/errors/AppError'

export async function entreprisesRoutes(app: FastifyInstance) {
  const preHandler = [authMiddleware, entrepriseScopeMiddleware]

  // ── GET /me ───────────────────────────────────────────────────────────────

  app.get('/me', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    try {
      const data = await getEntreprise(entrepriseId)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── PATCH /me ─────────────────────────────────────────────────────────────

  app.patch('/me', { preHandler: [...preHandler, requireRole('MANAGER')] }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    const result = updateEntrepriseSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await updateEntreprise(entrepriseId, result.data)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })
}
