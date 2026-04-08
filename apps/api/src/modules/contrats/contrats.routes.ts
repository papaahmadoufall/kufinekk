import type { FastifyInstance } from 'fastify'
import {
  createContratSchema,
  updateContratSchema,
  transfererContratSchema,
  terminerContratSchema,
} from './contrats.schema'
import {
  getContrat,
  createContrat,
  updateContrat,
  validerContrat,
  validerTousContratsProvisoires,
  transfererContrat,
  terminerContrat,
} from './contrats.service'
import { authMiddleware } from '../../shared/middleware/auth'
import { entrepriseScopeMiddleware } from '../../shared/middleware/entreprise-scope'
import { requireRole } from '../../shared/middleware/rbac'
import { AppError } from '../../shared/errors/AppError'

export async function contratsRoutes(app: FastifyInstance) {
  const preHandler = [authMiddleware, entrepriseScopeMiddleware]
  const managerOnly = [...preHandler, requireRole('MANAGER')]

  // ── GET /:id ──────────────────────────────────────────────────────────────

  app.get('/:id', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const { id } = req.params as { id: string }

    try {
      const data = await getContrat(id, entrepriseId)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST / ────────────────────────────────────────────────────────────────

  app.post('/', { preHandler }, async (req, reply) => {
    const { entrepriseId, sub } = req.user as { entrepriseId: string; sub: string }

    const result = createContratSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await createContrat(entrepriseId, result.data, sub)
      return reply.code(201).send({ data })
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

    const result = updateContratSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await updateContrat(id, entrepriseId, result.data)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST /:id/valider ─────────────────────────────────────────────────────

  app.post('/:id/valider', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId, sub } = req.user as { entrepriseId: string; sub: string }
    const { id } = req.params as { id: string }

    try {
      const data = await validerContrat(id, entrepriseId, sub)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST /valider-tous ────────────────────────────────────────────────────

  app.post('/valider-tous', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId, sub } = req.user as { entrepriseId: string; sub: string }
    const data = await validerTousContratsProvisoires(entrepriseId, sub)
    return reply.code(200).send({ data })
  })

  // ── POST /:id/transferer ──────────────────────────────────────────────────

  app.post('/:id/transferer', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId, sub } = req.user as { entrepriseId: string; sub: string }
    const { id } = req.params as { id: string }

    const result = transfererContratSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await transfererContrat(id, entrepriseId, result.data, sub)
      return reply.code(201).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST /:id/terminer ────────────────────────────────────────────────────

  app.post('/:id/terminer', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const { id } = req.params as { id: string }

    const result = terminerContratSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await terminerContrat(id, entrepriseId, result.data)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })
}
