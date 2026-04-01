# Kufinekk — Système de Pointage BTP

> Fichier de référence pour Claude Code, Cowork et tout outil IA.
> Toutes les décisions d'architecture sont ici. Ne pas improviser en dehors de ce document.

---

## Vue d'ensemble

Application de gestion de présence sur chantier BTP au Sénégal.
- **Marché cible** : Sénégal V1, Afrique francophone V2
- **Utilisateurs** : Managers · Pointeurs · Agents (ouvriers BTP)
- **Cycle de paie** : Non-contractuels vendredi→jeudi, payés chaque vendredi via Wave

---

## Stack technique

| Composant        | Technologie              | Hébergement       |
|------------------|--------------------------|-------------------|
| Backend API      | Node.js + Fastify        | Render.com (free) |
| Dashboard web    | Next.js                  | Vercel            |
| App mobile       | React Native (Expo)      | V2 uniquement     |
| Base de données  | PostgreSQL + Prisma ORM  | Supabase          |
| Stockage fichiers| Cloudflare R2            | —                 |
| SMS              | AxiomText (Dakar)        | —                 |
| Paiement         | Wave Payout API          | —                 |
| Anti-sleep       | UptimeRobot              | —                 |

**Coût infra V1 : ~5 000 XOF/mois (SMS uniquement)**

Migration Render → Railway prévue dès les premiers clients payants.

---

## Structure du monorepo

```
kufinekk/
├── apps/
│   ├── api/                          ← Backend Fastify (ce repo)
│   │   ├── src/
│   │   │   ├── plugins/              ← fastify-jwt, cors, rate-limit, sensible
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── entreprises/
│   │   │   │   ├── utilisateurs/
│   │   │   │   ├── agents/
│   │   │   │   ├── chantiers/
│   │   │   │   ├── contrats/
│   │   │   │   ├── pointages/
│   │   │   │   ├── cycles-paie/
│   │   │   │   └── dashboard/
│   │   │   ├── shared/
│   │   │   │   ├── middleware/       ← auth.ts, rbac.ts, entreprise-scope.ts
│   │   │   │   ├── services/         ← axiomtext.ts, wave.ts, qr.ts, matricule.ts
│   │   │   │   └── errors/           ← AppError.ts, codes.ts
│   │   │   └── app.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── tests/
│   ├── web/                          ← Dashboard Next.js
│   └── mobile/                       ← React Native Expo (V2)
├── packages/
│   └── types/                        ← Types partagés API ↔ Web
└── .github/
    └── workflows/
        └── deploy.yml                ← CI/CD GitHub Actions → Render + Vercel
```

### Pattern obligatoire par module

Chaque module contient exactement 3 fichiers :

```
agents/
  agents.routes.ts    ← définition des routes Fastify + handlers
  agents.service.ts   ← logique métier + appels Prisma
  agents.schema.ts    ← schémas Zod (input validation + types output)
```

---

## Règles d'architecture — NON NÉGOCIABLES

### 1. Cloisonnement entreprise systématique

Le middleware `entreprise-scope.ts` extrait `entrepriseId` du JWT et l'injecte dans **toutes** les requêtes Prisma. Aucune route ne peut accéder aux données d'une autre entreprise. Cette règle s'applique sans exception, même pour les lectures.

```typescript
// Toujours faire ça :
prisma.agent.findMany({ where: { contrats: { some: { entrepriseId: req.user.entrepriseId } } } })

// Jamais faire ça :
prisma.agent.findMany() // ← données de toutes les entreprises
```

### 2. Calcul de paie A+C — un seul endroit

`totalJournalierXof` est calculé **uniquement** dans `pointages.service.ts > calculerTotalJournalier()`.
Aucune route, aucun autre service n'effectue ce calcul.

```typescript
function calculerTotalJournalier(
  heureEntree: Date,
  heureSortie: Date,
  contrat: {
    tauxJournalierXof: number
    tauxHeureSuppXof: number | null
    seuilHeuresNormales: number   // hérité de Chantier, overridable par Contrat
  }
): number {
  const dureeH = (heureSortie.getTime() - heureEntree.getTime()) / 3_600_000

  if (!contrat.tauxHeureSuppXof || dureeH <= contrat.seuilHeuresNormales) {
    return Math.round((dureeH / contrat.seuilHeuresNormales) * contrat.tauxJournalierXof)
  }

  const heuresSupp = dureeH - contrat.seuilHeuresNormales
  return contrat.tauxJournalierXof + Math.round(heuresSupp * contrat.tauxHeureSuppXof)
}
```

Stratégie A+C :
- **A** : Calcul immédiat à chaque `POST /pointages/sortie` → stocké en `totalJournalierXof`
- **C** : Recalcul à la demande sur `PATCH /pointages/:id/corriger` (ce jour uniquement)
- Dashboard = `SUM(totalJournalierXof)` — jamais recalculé à la volée

### 3. Transfert agent = transaction atomique

`POST /contrats/:id/transferer` utilise `prisma.$transaction()`. Les deux opérations (clôture Contrat A + création Contrat B) sont atomiques. Si l'une échoue, rien n'est persisté.

```typescript
await prisma.$transaction([
  prisma.contrat.update({ where: { id }, data: { statut: 'TERMINE', dateFin: today, noteCloture } }),
  prisma.contrat.create({ data: { ...nouveauContrat, statut: 'PROVISOIRE' } }),
])
```

Règle métier validée : le pointage IN déjà ouvert ce jour reste sur Contrat A. Contrat B démarre le lendemain matin.

### 4. Format de réponse standardisé

```typescript
// Succès — ressource unique
{ "data": { ...ressource } }

// Succès — collection
{
  "data": [...],
  "meta": { "total": 142, "page": 1, "per_page": 20, "total_pages": 8 }
}

// Erreur
{ "error": { "code": "validation_error", "message": "...", "details": [...] } }
```

Codes HTTP : 200 GET/PATCH, 201 POST, 204 DELETE, 400 bad request, 401 non authentifié, 403 non autorisé, 404 not found, 409 conflit, 422 validation, 429 rate limit, 500 erreur serveur.

### 5. Validation Zod sur tous les inputs

Chaque route définit son schéma dans `*.schema.ts`. Aucune donnée non validée ne touche la base.

---

## Schéma Prisma complet

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Enums ─────────────────────────────────────────────────

enum Role {
  MANAGER
  POINTEUR
}

enum Plan {
  ESSENTIEL
  PRO
  ENTREPRISE
}

enum TypeContrat {
  CONTRACTUEL
  NON_CONTRACTUEL
}

enum StatutContrat {
  PROVISOIRE
  ACTIF
  TERMINE
}

enum StatutPointage {
  EN_COURS
  VALIDE
  CORRIGE
  ABSENT
}

enum StatutCycle {
  EN_COURS
  VALIDE
  PAYE
  ECHOUE
}

// ── Modèles ───────────────────────────────────────────────

model Entreprise {
  id          String    @id @default(uuid())
  nom         String
  telephone   String    @unique
  adresse     String?
  plan        Plan      @default(ESSENTIEL)
  actif       Boolean   @default(true)
  createdAt   DateTime  @default(now())

  utilisateurs Utilisateur[]
  chantiers    Chantier[]
  contrats     Contrat[]
}

model Utilisateur {
  id           String   @id @default(uuid())
  entrepriseId String
  nom          String
  telephone    String   @unique
  role         Role
  pinHash      String
  actif        Boolean  @default(true)
  createdAt    DateTime @default(now())

  entreprise          Entreprise @relation(fields: [entrepriseId], references: [id])
  pointagesEffectues  Pointage[] @relation("PointeePar")
  pointagesCoriges    Pointage[] @relation("CorrigePar")
  contratsValides     Contrat[]  @relation("ValideParUtilisateur")
  cyclesValides       CyclePaie[] @relation("CycleValideePar")
  sessions            Session[]
}

model Agent {
  id                String   @id @default(uuid())
  matricule         String   @unique  // KFN-XXXXX auto-généré
  telephone         String   @unique  // clé de recherche principale
  nom               String
  prenom            String
  pinHash           String
  telephoneVerifie  Boolean  @default(false)
  qrCodeUrl         String?
  createdAt         DateTime @default(now())

  contrats Contrat[]
}

model Chantier {
  id                   String    @id @default(uuid())
  entrepriseId         String
  nom                  String
  adresse              String?
  dateDebut            DateTime
  dateFinPrevue        DateTime?
  statut               String    @default("ACTIF")
  heureDebutStd        String    // "08:00"
  seuilHeuresNormales  Float     @default(8.0)  // seuil heures supp par défaut
  createdAt            DateTime  @default(now())

  entreprise Entreprise @relation(fields: [entrepriseId], references: [id])
  contrats   Contrat[]
}

model Contrat {
  id                   String        @id @default(uuid())
  agentId              String
  chantierId           String
  entrepriseId         String
  poste                String
  typeContrat          TypeContrat
  tauxJournalierXof    Int
  tauxHeureSuppXof     Int?          // null = pas d'heures supp
  seuilHeuresNormales  Float?        // override Chantier.seuilHeuresNormales si renseigné
  heureDebutStd        String?       // override Chantier.heureDebutStd si renseigné
  dateDebut            DateTime
  dateFin              DateTime?     // null = pas de date de fin fixée
  statut               StatutContrat @default(PROVISOIRE)
  valideParId          String?
  noteCloture          String?       // motif de transfert ou clôture
  createdAt            DateTime      @default(now())

  agent       Agent        @relation(fields: [agentId], references: [id])
  chantier    Chantier     @relation(fields: [chantierId], references: [id])
  entreprise  Entreprise   @relation(fields: [entrepriseId], references: [id])
  validePar   Utilisateur? @relation("ValideParUtilisateur", fields: [valideParId], references: [id])
  pointages   Pointage[]
  cyclesPaie  CyclePaie[]
}

model Pointage {
  id                  String         @id @default(uuid())
  contratId           String
  pointeParId         String
  dateJournee         DateTime       // index principal
  heureEntree         DateTime
  heureSortie         DateTime?      // null jusqu'au OUT
  totalJournalierXof  Int?           // calculé au OUT — stratégie A+C
  statut              StatutPointage @default(EN_COURS)
  corrigeParId        String?
  corrigeLe           DateTime?
  noteCorrection      String?

  contrat    Contrat      @relation(fields: [contratId], references: [id])
  pointePar  Utilisateur  @relation("PointeePar", fields: [pointeParId], references: [id])
  corrigePar Utilisateur? @relation("CorrigePar", fields: [corrigeParId], references: [id])

  @@index([contratId, dateJournee])
}

model CyclePaie {
  id             String      @id @default(uuid())
  contratId      String
  semaineDebut   DateTime    // vendredi de début
  semaineFin     DateTime    // jeudi de fin
  totalHebdoXof  Int         // SUM(totalJournalierXof) — calculé à la clôture
  statut         StatutCycle @default(EN_COURS)
  valideParId    String?
  valideLe       DateTime?
  waveBatchId    String?
  wavePayoutId   String?
  waveStatut     String?
  createdAt      DateTime    @default(now())

  contrat    Contrat      @relation(fields: [contratId], references: [id])
  validePar  Utilisateur? @relation("CycleValideePar", fields: [valideParId], references: [id])
}

model OtpSession {
  id        String   @id @default(uuid())
  telephone String
  codeHash  String   // bcrypt — jamais en clair
  expireLe  DateTime // now() + 5 min
  utilise   Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([telephone, expireLe])
}

model Session {
  id         String   @id @default(uuid())
  userId     String   // agentId ou utilisateurId
  userType   String   // "AGENT" | "UTILISATEUR"
  tokenHash  String   @unique
  expireLe   DateTime
  createdAt  DateTime @default(now())
}
```

---

## Endpoints API — /api/v1

### Auth (public)
```
POST /auth/send-otp          → 200  Envoyer OTP SMS via AxiomText
POST /auth/verify-otp        → 200  Vérifier OTP → JWT
POST /auth/login             → 200  Connexion PIN (managers & pointeurs)
POST /auth/logout            → 204  Invalider session
```

### Entreprises (Manager)
```
GET    /entreprises/me       → 200  Profil entreprise
PATCH  /entreprises/me       → 200  Mise à jour infos
```

### Utilisateurs (Manager)
```
GET    /utilisateurs         → 200  Liste paginée
POST   /utilisateurs         → 201  Créer pointeur/manager
PATCH  /utilisateurs/:id     → 200  Modifier rôle/PIN/statut
DELETE /utilisateurs/:id     → 204  Désactiver (soft delete)
```

### Agents (Manager + Pointeur)
```
GET    /agents               → 200  Liste · ?chantier_id= · ?statut=
GET    /agents/search        → 200  Recherche par ?telephone= (anti-doublon)
POST   /agents               → 201  Créer agent + SMS QR code
GET    /agents/:id           → 200  Détail + contrat actif + historique
PATCH  /agents/:id           → 200  Modifier infos (Manager uniquement)
GET    /agents/me            → 200  Profil agent connecté (V2)
```

### Chantiers (Manager + Pointeur en lecture)
```
GET    /chantiers            → 200  Liste · ?statut=actif
POST   /chantiers            → 201  Créer chantier
GET    /chantiers/:id        → 200  Détail + agents actifs
PATCH  /chantiers/:id        → 200  Modifier infos/statut
```

### Contrats (Manager + Pointeur pour création)
```
POST   /contrats                    → 201  Rattacher agent → chantier (PROVISOIRE)
PATCH  /contrats/:id                → 200  Modifier taux/poste/heure
POST   /contrats/:id/valider        → 200  PROVISOIRE → ACTIF
POST   /contrats/valider-tous       → 200  Valider tous les PROVISOIRE
POST   /contrats/:id/transferer     → 201  Clôturer A + créer B (atomique)
POST   /contrats/:id/terminer       → 200  Clôturer manuellement
```

### Pointages (Pointeur pour création, Manager pour corrections)
```
POST   /pointages/entree            → 201  Scanner QR → heure entrée
POST   /pointages/sortie            → 200  Scanner QR → sortie + calcul A+C
GET    /pointages                   → 200  Historique · ?contrat_id= · ?date=
PATCH  /pointages/:id/corriger      → 200  Corriger + recalcul (Manager)
POST   /pointages/absence           → 201  Absence manuelle (Manager)
```

### Cycles de paie (Manager)
```
GET    /cycles-paie                 → 200  Liste · ?chantier_id= · ?semaine=
GET    /cycles-paie/:id             → 200  Détail + pointages inclus
POST   /cycles-paie/:id/valider     → 200  Valider → déclencher Wave batch
GET    /cycles-paie/:id/statut-wave → 200  Polling statut paiement Wave
```

### Dashboard (Manager)
```
GET    /dashboard/resume            → 200  Stats jour · ?chantier_id=
GET    /dashboard/semaine           → 200  Totaux hebdo + masse salariale
```

---

## Intégrations externes

### AxiomText SMS
```typescript
// shared/services/axiomtext.ts
POST https://api.axiomtext.com/api/sms/message
Authorization: Bearer ${AXIOMTEXT_TOKEN}
Body: { to: "+221XXXXXXXXX", message: "...", signature: "Kufinekk" }

// SMS envoyés en V1 :
// - Agent : enregistrement (lien QR + PIN)
// - Agent : paiement Wave reçu
// - Agent : transfert de chantier
// - Manager : Wave batch échoué (critique)
// - Manager : rappel cycle vendredi (si dashboard fermé)
```

### Wave Payout API
```typescript
// shared/services/wave.ts
POST   https://api.wave.com/v1/payout-batch    // déclencher paiement
GET    https://api.wave.com/v1/payouts-batch/:id  // polling statut
POST   https://api.wave.com/v1/payout/:id/reverse // reversal si erreur
Authorization: Bearer ${WAVE_API_TOKEN}

// Champs sur CyclePaie : waveBatchId · wavePayoutId · waveStatut
```

### Génération QR code
```typescript
// shared/services/qr.ts
// QR code = matricule KFN-XXXXX encodé en base64
// Stocké sur Cloudflare R2
// URL envoyée par SMS à l'agent à l'enregistrement
```

### Génération matricule
```typescript
// shared/services/matricule.ts
// Format : KFN-XXXXX (5 chiffres padded)
// Séquence auto-incrémentée par entreprise
// Ex : KFN-00001, KFN-00002...
```

---

## Règles métier importantes

### Agent — enregistrement
1. Rechercher d'abord par téléphone (`GET /agents/search?telephone=`)
2. Si trouvé → rattacher au chantier via `POST /contrats`
3. Si non trouvé → créer via `POST /agents` → SMS automatique QR + PIN
4. Contrat créé en statut `PROVISOIRE` → badge "En attente" sur dashboard
5. Agent peut pointer immédiatement malgré statut PROVISOIRE

### Transfert agent
1. `POST /contrats/:id/transferer` → transaction atomique
2. Contrat A : `statut = TERMINE`, `dateFin = aujourd'hui`, `noteCloture = motif`
3. Contrat B : même `agentId`, nouveau `chantierId`, `statut = PROVISOIRE`
4. Pointage IN déjà ouvert ce jour → reste sur Contrat A
5. Contrat B démarre le lendemain matin
6. Deux `CyclePaie` distincts → un seul batch Wave avec deux lignes

### Fin de contrat automatique
- Si `dateFin` est renseignée et atteinte → l'agent ne peut plus pointer
- Vérification à chaque `POST /pointages/entree`

### Absences
- Absence = aucun pointage un jour ouvré
- Détectée automatiquement (pas de création active)
- Correction manuelle manager via `POST /pointages/absence`

### Calcul heures supplémentaires
- `seuilHeuresNormales` défini sur `Chantier` (défaut 8.0h)
- Overridable par `Contrat.seuilHeuresNormales` si renseigné
- `tauxHeureSuppXof` : taux horaire supp (XOF/heure)
- Si `tauxHeureSuppXof` null → pas d'heures supp sur ce contrat

---

## Variables d'environnement

```bash
# .env.development / .env.staging / .env.production

# Base de données
DATABASE_URL="postgresql://..."

# Auth
JWT_SECRET="..."
JWT_EXPIRES_IN="7d"

# AxiomText SMS
AXIOMTEXT_TOKEN="..."
AXIOMTEXT_SIGNATURE="Kufinekk"

# Wave Payout
WAVE_API_TOKEN="..."
WAVE_API_URL="https://api.wave.com"

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="kufinekk-assets"

# App
NODE_ENV="development"
PORT=3000
API_BASE_URL="https://api.kufinekk.com"
```

---

## Plan de développement — Sprints

| Sprint | Durée   | Livrable                                      |
|--------|---------|-----------------------------------------------|
| S0     | 1 sem   | Monorepo + Prisma + CI/CD Render/Vercel        |
| S1     | 1 sem   | Auth complète (OTP AxiomText + JWT + sessions) |
| S2     | 1 sem   | Entreprises + Utilisateurs + RBAC middleware   |
| S3     | 1.5 sem | Agents + Contrats + Transfert atomique         |
| S4     | 1 sem   | Chantiers + fin contrat automatique            |
| S5     | 1.5 sem | Pointages + calcul A+C + corrections           |
| S6     | 1.5 sem | CyclePaie + Wave Payout + polling              |
| S7     | 1.5 sem | Dashboard + sécurité + OpenAPI spec            |

**Total estimé : 10 semaines pour un backend V1 production-ready.**

### Sprint 0 — détail des tâches
```bash
# 1. Init monorepo
npm init -w apps/api -w apps/web -w packages/types

# 2. Setup Fastify
cd apps/api
npm install fastify @fastify/jwt @fastify/cors @fastify/sensible fastify-plugin

# 3. Setup Prisma
npm install prisma @prisma/client
npx prisma init
# → coller le schema.prisma ci-dessus
npx prisma migrate dev --name init

# 4. CI/CD
# → .github/workflows/deploy.yml
# → push main = deploy auto sur Render + Vercel

# 5. Variables d'env
# → créer .env.development avec toutes les variables ci-dessus
```

---

## Notifications — V1 vs V2

### V1 (SMS uniquement via AxiomText)
| Événement                    | Destinataire | Priorité |
|------------------------------|-------------|----------|
| Enregistrement agent         | Agent        | Haute    |
| Paiement Wave reçu           | Agent        | Haute    |
| Transfert chantier           | Agent        | Moyenne  |
| Wave batch échoué            | Manager      | Haute    |
| Rappel cycle vendredi        | Manager      | Haute    |

### V2 (Push web + push mobile)
- Alertes temps réel dashboard manager/pointeur
- Notifications mobiles agents (app React Native)
- Absences fin de journée
- Contrats expirant J-3

---

## Conformité

- **Loi CDP Sénégal n°2008-12** — déclaration à déposer avant lancement production
- Hébergement actuel hors Sénégal (Supabase/Render) — acceptable pour V1 en développement
- Migration vers hébergement Sénégal (Sonatel Cloud) prévue à la régularisation CDP

---

*Dernière mise à jour : généré depuis le Project claude.ai Kufinekk*
*Toute modification doit être répercutée ici ET dans le Project claude.ai*
