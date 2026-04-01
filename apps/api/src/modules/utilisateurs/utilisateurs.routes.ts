import type { FastifyInstance } from 'fastify'
import { createUtilisateurSchema, updateUtilisateurSchema, listUtilisateursSchema } from './utilisateurs.schema'
import { listUtilisateurs, createUtilisateur, updateUtilisateur, deleteUtilisateur } from './utilisateurs.service'
import { authMiddleware } from '../../shared/middleware/auth'
import { entrepriseScopeMiddleware } from '../../shared/middleware/entreprise-scope'
import { requireRole } from '../../shared/middleware/rbac'
import { AppError } from '../../shared/errors/AppError'

export async function utilisateursRoutes(app: FastifyInstance) {
  // Toutes les routes utilisateurs sont réservées aux MANAGERs
  const preHandler = [authMiddleware, entrepriseScopeMiddleware, requireRole('MANAGER')]

  // ── GET / ─────────────────────────────────────────────────────────────────

  app.get('/', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    const result = listUtilisateursSchema.safeParse(req.query)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Paramètres invalides', details: result.error.issues },
      })
    }

    const data = await listUtilisateurs(entrepriseId, result.data)
    return reply.code(200).send(data)
  })

  // ── POST / ────────────────────────────────────────────────────────────────

  app.post('/', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }

    const result = createUtilisateurSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await createUtilisateur(entrepriseId, result.data)
      return reply.code(201).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── PATCH /:id ────────────────────────────────────────────────────────────

  app.patch('/:id', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const { id } = req.params as { id: string }

    const result = updateUtilisateurSchema.safeParse(req.body)
    if (!result.success) {
      return reply.code(422).send({
        error: { code: 'validation_error', message: 'Données invalides', details: result.error.issues },
      })
    }

    try {
      const data = await updateUtilisateur(id, entrepriseId, result.data)
      return reply.code(200).send({ data })
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })

  // ── DELETE /:id ───────────────────────────────────────────────────────────

  app.delete('/:id', { preHandler }, async (req, reply) => {
    const { entrepriseId } = req.user as { entrepriseId: string }
    const { id } = req.params as { id: string }

    try {
      await deleteUtilisateur(id, entrepriseId)
      return reply.code(204).send()
    } catch (err) {
      if (err instanceof AppError) {
        return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } })
      }
      throw err
    }
  })
}
