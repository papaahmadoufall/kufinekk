---
name: Kufinekk — Roadmap sprints
description: État d'avancement des sprints de développement backend V1. À mettre à jour à chaque sprint terminé.
type: project
---

## Roadmap développement V1

| Sprint | Livrable | Statut | Date |
|--------|----------|--------|------|
| S0 | Monorepo + Prisma + CI/CD Render/Vercel | ✅ TERMINÉ | 2026-04-01 |
| S1 | Auth complète (OTP AxiomText + JWT + sessions) | ✅ TERMINÉ | 2026-04-01 |
| S2 | Entreprises + Utilisateurs + RBAC middleware | ✅ TERMINÉ | 2026-04-01 |
| S3 | Agents + Contrats + Transfert atomique | ⏳ À FAIRE | — |
| S4 | Chantiers + fin contrat automatique | ⏳ À FAIRE | — |
| S5 | Pointages + calcul A+C + corrections | ⏳ À FAIRE | — |
| S6 | CyclePaie + Wave Payout + polling | ⏳ À FAIRE | — |
| S7 | Dashboard + sécurité + OpenAPI spec | ⏳ À FAIRE | — |

---

## S0 — Livré ✅

- Monorepo npm workspaces (`apps/api`, `apps/web`, `packages/types`)
- Fastify + TypeScript (`apps/api`)
- Next.js 14 (`apps/web`)
- Schéma Prisma complet (11 modèles, 6 enums)
- Middleware partagés : `auth.ts`, `rbac.ts`, `entreprise-scope.ts`
- Services stubs : `axiomtext.ts`, `wave.ts`, `qr.ts`, `matricule.ts`
- Types partagés API ↔ Web (`packages/types`)
- CI/CD GitHub Actions → Render + Vercel
- `render.yaml` avec `prisma migrate deploy` au démarrage
- Git initialisé, Conventional Commits, `.gitattributes`

---

## S1 — Auth (prochain sprint)

**Fichiers à créer** : `apps/api/src/modules/auth/`
```
auth.routes.ts
auth.service.ts
auth.schema.ts
```

**Endpoints** :
```
POST /api/v1/auth/send-otp      → envoyer OTP SMS via AxiomText
POST /api/v1/auth/verify-otp    → vérifier OTP → JWT
POST /api/v1/auth/login         → connexion PIN (managers & pointeurs)
POST /api/v1/auth/logout        → invalider session
```

**Modèles Prisma impliqués** : `OtpSession`, `Session`, `Utilisateur`, `Agent`

**Prérequis** : remplir `.env.development` avec les vraies clés Supabase + AxiomText avant de tester.

---

## S2 — Entreprises + Utilisateurs + RBAC

**Fichiers à créer** :
```
apps/api/src/modules/entreprises/
apps/api/src/modules/utilisateurs/
```

**Endpoints** :
```
GET    /api/v1/entreprises/me
PATCH  /api/v1/entreprises/me
GET    /api/v1/utilisateurs
POST   /api/v1/utilisateurs
PATCH  /api/v1/utilisateurs/:id
DELETE /api/v1/utilisateurs/:id
```

---

## S3 — Agents + Contrats + Transfert atomique

**Endpoints** :
```
GET    /api/v1/agents
GET    /api/v1/agents/search?telephone=
POST   /api/v1/agents
GET    /api/v1/agents/:id
PATCH  /api/v1/agents/:id
POST   /api/v1/contrats
PATCH  /api/v1/contrats/:id
POST   /api/v1/contrats/:id/valider
POST   /api/v1/contrats/valider-tous
POST   /api/v1/contrats/:id/transferer   ← transaction atomique prisma.$transaction()
POST   /api/v1/contrats/:id/terminer
```

---

## S4 — Chantiers

**Endpoints** :
```
GET    /api/v1/chantiers
POST   /api/v1/chantiers
GET    /api/v1/chantiers/:id
PATCH  /api/v1/chantiers/:id
```

---

## S5 — Pointages + calcul A+C

**Règle critique** : `calculerTotalJournalier()` dans `pointages.service.ts` UNIQUEMENT.

**Endpoints** :
```
POST   /api/v1/pointages/entree
POST   /api/v1/pointages/sortie
GET    /api/v1/pointages
PATCH  /api/v1/pointages/:id/corriger
POST   /api/v1/pointages/absence
```

---

## S6 — CyclePaie + Wave Payout

**Endpoints** :
```
GET    /api/v1/cycles-paie
GET    /api/v1/cycles-paie/:id
POST   /api/v1/cycles-paie/:id/valider
GET    /api/v1/cycles-paie/:id/statut-wave
```

---

## S7 — Dashboard + sécurité + OpenAPI

**Endpoints** :
```
GET    /api/v1/dashboard/resume
GET    /api/v1/dashboard/semaine
```

**Livrables** : OpenAPI spec, audit sécurité, rate-limiting fin, tests E2E.
