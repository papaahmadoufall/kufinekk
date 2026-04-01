import Fastify from 'fastify'
import corsPlugin from '@fastify/cors'
import jwtPlugin from '@fastify/jwt'
import rateLimitPlugin from '@fastify/rate-limit'
import sensiblePlugin from '@fastify/sensible'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  })

  // ── Plugins ────────────────────────────────────────────────────────────────

  await app.register(sensiblePlugin)

  await app.register(corsPlugin, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3001'],
    credentials: true,
  })

  await app.register(jwtPlugin, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
  })

  await app.register(rateLimitPlugin, {
    max: 100,
    timeWindow: '1 minute',
  })

  // ── Health check ───────────────────────────────────────────────────────────

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // ── Modules ────────────────────────────────────────────────────────────────
  // À décommenter au fur et à mesure des sprints :
  // await app.register(authRoutes, { prefix: '/api/v1/auth' })
  // await app.register(entreprisesRoutes, { prefix: '/api/v1/entreprises' })
  // await app.register(utilisateursRoutes, { prefix: '/api/v1/utilisateurs' })
  // await app.register(agentsRoutes, { prefix: '/api/v1/agents' })
  // await app.register(chantiersRoutes, { prefix: '/api/v1/chantiers' })
  // await app.register(contratsRoutes, { prefix: '/api/v1/contrats' })
  // await app.register(pointagesRoutes, { prefix: '/api/v1/pointages' })
  // await app.register(cyclesPaieRoutes, { prefix: '/api/v1/cycles-paie' })
  // await app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' })

  return app
}
