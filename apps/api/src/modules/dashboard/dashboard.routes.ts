import type { FastifyInstance } from 'fastify'
import { resumeSchema, semaineSchema } from './dashboard.schema'
import { getResume, getSemaine } from './dashboard.service'
import { authMiddleware } from '../../shared/middleware/auth'
import { entrepriseScopeMiddleware } from '../../shared/middleware/entreprise-scope'
import { requireRole } from '../../shared/middleware/rbac'

export async function dashboardRoutes(app: FastifyInstance) {
  const managerOnly = [authMiddleware, entrepriseScopeMiddleware, requireRole('MANAGER')]

  // ── GET /resume ───────────────────────────────────────────────────────────

  app.get('/resume', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    const result = resumeSchema.safeParse(req.query)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Paramètres invalides', details: result.error.issues },
      })
    }

    const data = await getResume(entrepriseId, result.data)
    return reply.code(200).send({ data })
  })

  // ── GET /semaine ──────────────────────────────────────────────────────────

  app.get('/semaine', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    const result = semaineSchema.safeParse(req.query)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Paramètres invalides', details: result.error.issues },
      })
    }

    const data = await getSemaine(entrepriseId, result.data)
    return reply.code(200).send({ data })
  })
}
