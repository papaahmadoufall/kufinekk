import type { FastifyInstance } from 'fastify'
import { createAgentSchema, updateAgentSchema, listAgentsSchema, searchAgentSchema } from './agents.schema'
import { searchAgent, listAgents, getAgent, createAgent, updateAgent, regenererQrCode } from './agents.service'
import { authMiddleware } from '../../shared/middleware/auth'
import { entrepriseScopeMiddleware } from '../../shared/middleware/entreprise-scope'
import { requireRole } from '../../shared/middleware/rbac'
import { AppError } from '../../shared/errors/AppError'

export async function agentsRoutes(app: FastifyInstance) {
  const preHandler = [authMiddleware, entrepriseScopeMiddleware]

  // ── GET /search?telephone= ────────────────────────────────────────────────

  app.get('/search', { preHandler }, async (req, reply) => {
    const result = searchAgentSchema.safeParse(req.query)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Paramètres invalides', details: result.error.issues },
      })
    }

    const data = await searchAgent(result.data)
    return reply.code(200).send({ data })
  })

  // ── GET / ─────────────────────────────────────────────────────────────────

  app.get('/', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    const result = listAgentsSchema.safeParse(req.query)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Paramètres invalides', details: result.error.issues },
      })
    }

    const data = await listAgents(entrepriseId, result.data)
    return reply.code(200).send(data)
  })

  // ── POST / ────────────────────────────────────────────────────────────────

  app.post('/', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    const result = createAgentSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await createAgent(entrepriseId, result.data)
      return reply.code(201).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── GET /:id ──────────────────────────────────────────────────────────────

  app.get('/:id', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const { id } = req.params as { id: string }

    try {
      const data = await getAgent(id, entrepriseId)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST /:id/regenerer-qr (Manager uniquement) ──────────────────────────

  app.post('/:id/regenerer-qr', { preHandler: [...preHandler, requireRole('MANAGER')] }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const { id } = req.params as { id: string }

    try {
      const data = await regenererQrCode(id, entrepriseId)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── PATCH /:id (Manager uniquement) ──────────────────────────────────────

  app.patch('/:id', { preHandler: [...preHandler, requireRole('MANAGER')] }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const { id } = req.params as { id: string }

    const result = updateAgentSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await updateAgent(id, entrepriseId, result.data)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })
}
