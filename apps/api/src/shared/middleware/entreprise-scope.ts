import type { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Vérifie que entrepriseId est présent dans le JWT.
 * Utilisé sur toutes les routes qui accèdent à des données d'entreprise.
 * Règle non-négociable : aucune requête Prisma sans ce filtre.
 */
export async function entrepriseScopeMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user as { entrepriseId?: string } | undefined
  if (!user?.entrepriseId) {
    reply.code(403).send({
      error: { code: 'forbidden', message: 'Scope entreprise manquant' },
    })
  }
}
