import type { FastifyInstance } from 'fastify'
import { AppError } from '../errors/AppError'

/**
 * Handler global d'erreurs Fastify.
 * Normalise toutes les erreurs au format { error: { code, message } }
 */
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, req, reply) => {
    // Erreur métier connue
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({
        error: { code: err.code, message: err.message, details: err.details },
      })
    }

    // Erreur Fastify (ex: payload trop grand)
    if (err.statusCode) {
      return reply.code(err.statusCode).send({
        error: { code: 'request_error', message: err.message },
      })
    }

    // Erreur inattendue — ne pas exposer les détails en prod
    app.log.error(err)
    return reply.code(500).send({
      error: {
        code: 'internal_error',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Une erreur interne est survenue'
            : err.message,
      },
    })
  })

  // 404 global
  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({
      error: { code: 'not_found', message: `Route ${req.method} ${req.url} introuvable` },
    })
  })
}
