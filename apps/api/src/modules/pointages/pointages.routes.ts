import type { FastifyInstance } from 'fastify'
import {
  entreeSchema,
  sortieSchema,
  corrigerPointageSchema,
  absenceSchema,
  listPointagesSchema,
} from './pointages.schema'
import {
  pointageEntree,
  pointageSortie,
  listPointages,
  corrigerPointage,
  creerAbsence,
} from './pointages.service'
import { authMiddleware } from '../../shared/middleware/auth'
import { entrepriseScopeMiddleware } from '../../shared/middleware/entreprise-scope'
import { requireRole } from '../../shared/middleware/rbac'
import { AppError } from '../../shared/errors/AppError'

export async function pointagesRoutes(app: FastifyInstance) {
  const preHandler = [authMiddleware, entrepriseScopeMiddleware]
  const managerOnly = [...preHandler, requireRole('MANAGER')]

  // ── POST /entree ──────────────────────────────────────────────────────────

  app.post('/entree', { preHandler }, async (req, reply) => {
    const { entrepriseId, sub } = req.user as { entrepriseId: string; sub: string }

    const result = entreeSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await pointageEntree(result.data, sub, entrepriseId)
      return reply.code(201).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST /sortie ──────────────────────────────────────────────────────────

  app.post('/sortie', { preHandler }, async (req, reply) => {
    const { entrepriseId, sub } = req.user as { entrepriseId: string; sub: string }

    const result = sortieSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await pointageSortie(result.data, sub, entrepriseId)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── GET / ─────────────────────────────────────────────────────────────────

  app.get('/', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    const result = listPointagesSchema.safeParse(req.query)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Paramètres invalides', details: result.error.issues },
      })
    }

    const data = await listPointages(entrepriseId, result.data)
    return reply.code(200).send(data)
  })

  // ── PATCH /:id/corriger (Manager) ─────────────────────────────────────────

  app.patch('/:id/corriger', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId, sub } = req.user as { entrepriseId: string; sub: string }
    const { id } = req.params as { id: string }

    const result = corrigerPointageSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await corrigerPointage(id, entrepriseId, sub, result.data)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── POST /absence (Manager) ───────────────────────────────────────────────

  app.post('/absence', { preHandler: managerOnly }, async (req, reply) => {
    const { entrepriseId, sub } = req.user as { entrepriseId: string; sub: string }

    const result = absenceSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await creerAbsence(entrepriseId, sub, result.data)
      return reply.code(201).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })
}
