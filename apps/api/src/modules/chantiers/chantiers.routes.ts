import type { FastifyInstance } from 'fastify'
import { createChantierSchema, updateChantierSchema, listChantiersSchema } from './chantiers.schema'
import { listChantiers, getChantier, createChantier, updateChantier } from './chantiers.service'
import { authMiddleware } from '../../shared/middleware/auth'
import { entrepriseScopeMiddleware } from '../../shared/middleware/entreprise-scope'
import { requireRole } from '../../shared/middleware/rbac'
import { AppError } from '../../shared/errors/AppError'

export async function chantiersRoutes(app: FastifyInstance) {
  const preHandler = [authMiddleware, entrepriseScopeMiddleware]
  const managerOnly = [...preHandler, requireRole('MANAGER')]

  // ── GET / ─────────────────────────────────────────────────────────────────

  app.get('/', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    const result = listChantiersSchema.safeParse(req.query)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Paramètres invalides', details: result.error.issues },
      })
    }

    const data = await listChantiers(entrepriseId, result.data)
    return reply.code(200).send(data)
  })

  // ── POST / ────────────────────────────────────────────────────────────────

  app.post('/', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    const result = createChantierSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    const data = await createChantier(entrepriseId, result.data)
    return reply.code(201).send({ data })
  })

  // ── GET /:id ──────────────────────────────────────────────────────────────

  app.get('/:id', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const { id } = req.params as { id: string }

    try {
      const data = await getChantier(id, entrepriseId)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── PATCH /:id ────────────────────────────────────────────────────────────

  app.patch('/:id', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const { id } = req.params as { id: string }

    const result = updateChantierSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await updateChantier(id, entrepriseId, result.data)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })
}
