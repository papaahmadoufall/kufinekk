import type { FastifyInstance } from 'fastify'
import { listCyclesSchema } from './cycles-paie.schema'
import {
  listCyclesPaie,
  getCyclePaie,
  validerCycle,
  getStatutWave,
  genererCyclesSemaine,
} from './cycles-paie.service'
import { authMiddleware } from '../../shared/middleware/auth'
import { entrepriseScopeMiddleware } from '../../shared/middleware/entreprise-scope'
import { requireRole } from '../../shared/middleware/rbac'
import { AppError } from '../../shared/errors/AppError'

export async function cyclesPaieRoutes(app: FastifyInstance) {
  const managerOnly = [authMiddleware, entrepriseScopeMiddleware, requireRole('MANAGER')]

  // ── GET / ─────────────────────────────────────────────────────────────────

  app.get('/', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    const result = listCyclesSchema.safeParse(req.query)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Paramètres invalides', details: result.error.issues },
      })
    }

    const data = await listCyclesPaie(entrepriseId, result.data)
    return reply.code(200).send(data)
  })

  // ── GET /:id ──────────────────────────────────────────────────────────────

  app.get('/:id', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const { id } = req.params as { id: string }

    try {
      const data = await getCyclePaie(id, entrepriseId)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST /:id/valider → déclenche Wave batch ───────────────────────────────

  app.post('/:id/valider', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId, sub } = req.user as { entrepriseId: string; sub: string }
    const { id } = req.params as { id: string }

    try {
      const data = await validerCycle(id, entrepriseId, sub)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── GET /:id/statut-wave → polling ────────────────────────────────────────

  app.get('/:id/statut-wave', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const { id } = req.params as { id: string }

    try {
      const data = await getStatutWave(id, entrepriseId)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST /generer-semaine → génère les cycles de la semaine en cours ───────

  app.post('/generer-semaine', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const data = await genererCyclesSemaine(entrepriseId)
    return reply.code(200).send({ data })
  })
}
