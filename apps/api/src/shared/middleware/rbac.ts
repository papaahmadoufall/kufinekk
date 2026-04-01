import type { FastifyRequest, FastifyReply } from 'fastify'

type Role = 'MANAGER' | 'POINTEUR'

export function requireRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as { role: Role } | undefined
    if (!user || !roles.includes(user.role)) {
      reply.code(403).send({
        error: { code: 'forbidden', message: 'Accès non autorisé' },
      })
    }
  }
}
