# ITERATIONS — Kufinekk
> Journal des sprints, décisions techniques et architecturales.
> Format : contexte → décision → pourquoi → alternatives rejetées.

---

## Sprint S0 — Monorepo + Infra (semaine 1)
**Commit** : `be6f35e` | **Date** : ~2026-03-10

### Décisions prises

**Monorepo npm workspaces**
- Décision : `apps/api` + `apps/web` + `packages/types` dans un seul repo
- Pourquoi : partage des types TypeScript API↔Web sans publication npm
- Rejeté : deux repos séparés (trop de friction pour synchroniser les types)

**Railway au lieu de Render**
- Décision : migration Render → Railway dès le début
- Pourquoi : Railway supporte mieux les monorepos (nixpacks.toml), healthchecks plus fiables, pas de cold start sur free tier
- Rejeté : Render (cold start 30s+ sur free tier = UX inacceptable)

**Supabase PostgreSQL + pooler session mode port 5432**
- Décision : pooler session mode au lieu de transaction mode
- Pourquoi : Prisma n'est pas compatible avec le transaction mode (prepared statements)
- Rejeté : connexion directe (limite de connexions Supabase free tier)

---

## Sprint S1 — Auth (semaine 2)
**Commit** : `8a4755e` | **Date** : ~2026-03-17

### Décisions prises

**Double auth : PIN pour managers/pointeurs, OTP SMS pour agents**
- Décision : deux flows distincts dans `/auth/login` (PIN) et `/auth/send-otp` + `/auth/verify-otp` (SMS)
- Pourquoi : les agents n'ont pas d'email, leur téléphone est leur identité unique
- Rejeté : PIN pour tout le monde (impossible de distribuer des PINs à 50+ ouvriers)

**JWT + table Session (double token)**
- Décision : JWT signé + hash du token en base (table `Session`)
- Pourquoi : permet la révocation (logout réel), audit trail, multi-device
- Rejeté : JWT seul sans persistance (impossible de révoquer)

**bcrypt pour PIN et OTP**
- Décision : stocker `pinHash` et `codeHash` en bcrypt, jamais en clair
- Pourquoi : conformité CDP, protection si dump base
- Rejeté : SHA256 (réversible avec rainbow tables)

**Logout 303 See Other**
- Décision : POST `/auth/logout` retourne 303 vers `/login`
- Pourquoi : fix bug 405 Method Not Allowed — le navigateur suit la redirection en GET
- Rejeté : 204 No Content (le client devait gérer la redirection manuellement, cassait le flow)

---

## Sprint S2 — Entreprises + RBAC (semaine 3)
**Commit** : `3dfc278` | **Date** : ~2026-03-24

### Décisions prises

**Middleware `entreprise-scope.ts` systématique**
- Décision : injecter `entrepriseId` du JWT dans TOUTES les requêtes Prisma
- Pourquoi : cloisonnement strict des données entre entreprises — règle non négociable
- Rejeté : filtrage au cas par cas dans chaque service (trop risqué d'oubli)

**RBAC simple : MANAGER vs POINTEUR**
- Décision : deux rôles seulement en V1
- Pourquoi : YAGNI — les cas d'usage V1 ne nécessitent pas plus de granularité
- Rejeté : système de permissions par ressource (over-engineering pour V1)

---

## Sprint S3 — Agents + Contrats (semaine 4-5)
**Commit** : `59c0629` | **Date** : ~2026-04-01

### Décisions prises

**Matricule KFN-XXXXX basé sur MAX (pas COUNT)**
- Décision : `SELECT MAX(matricule)` pour générer le suivant
- Pourquoi : COUNT échoue si des agents ont été supprimés (soft delete) — collisions
- Rejeté : séquence COUNT (bug de contrainte unique en prod)

**Transfert agent = transaction atomique Prisma**
- Décision : `prisma.$transaction([clôture Contrat A, création Contrat B])`
- Pourquoi : si l'une échoue, rien n'est persisté — cohérence garantie
- Rejeté : deux requêtes séquentielles (risque d'état intermédiaire incohérent)

**Agent peut pointer en statut PROVISOIRE**
- Décision : ne pas bloquer le pointage sur les contrats PROVISOIRE
- Pourquoi : sur chantier, le manager valide en fin de journée — bloquer = perte de productivité
- Rejeté : forcer validation avant tout pointage (trop strict pour le terrain)

**QR code = matricule encodé, stocké sur R2**
- Décision : QR code contient uniquement le matricule `KFN-XXXXX`
- Pourquoi : si l'agent change de chantier, le QR reste valide (le matricule est stable)
- Rejeté : QR code = contratId (invalide après transfert)

---

## Sprint S4 — Chantiers (semaine 5-6)
**Commit** : `d6fa26f` | **Date** : ~2026-04-02

### Décisions prises

**`seuilHeuresNormales` sur Chantier, overridable sur Contrat**
- Décision : valeur par défaut sur le Chantier (8.0h), chaque Contrat peut la surcharger
- Pourquoi : certains postes ont des horaires différents sur le même chantier
- Rejeté : valeur fixe globale (pas assez flexible)

---

## Sprint S5 — Pointages + Calcul A+C (semaine 6-7)
**Commit** : `5b58604` | **Date** : ~2026-04-03

### Décisions prises

**Stratégie A+C (calculer au OUT, recalculer sur correction)**
- Décision : `totalJournalierXof` calculé une seule fois au `POST /pointages/sortie`, recalculé uniquement sur `PATCH /corriger`
- Pourquoi : dashboard = SUM simple, pas de recalcul à la volée → performances garanties
- Rejeté : calcul dynamique à chaque lecture (explosion des coûts si 1000 agents)

**`calculerTotalJournalier()` dans pointages.service.ts uniquement**
- Décision : une seule fonction, un seul endroit
- Pourquoi : règle DRY critique — divergence de calcul = contestations de paie
- Rejeté : logique dupliquée dans cycles-paie.service.ts (risque de divergence)

---

## Sprint S6 — CyclePaie + Wave (semaine 7-8)
**Commit** : `c456022` | **Date** : ~2026-04-04

### Décisions prises

**Cycle vendredi→jeudi (non lundi→dimanche)**
- Décision : semaine de paie = vendredi→jeudi, paiement chaque vendredi
- Pourquoi : convention du secteur BTP sénégalais
- Rejeté : semaine calendaire (inadapté aux usages terrain)

**Wave API token non activé en prod**
- Décision : laisser Wave désactivé jusqu'à obtention du token Wave Business
- Pourquoi : Wave Payout nécessite un compte Business vérifié
- Action requise : `WAVE_API_TOKEN` à configurer sur Railway

---

## Sprint S7 — Dashboard + Sécurité (semaine 8-9)
**Commit** : `5fbd850` | **Date** : ~2026-04-05

### Décisions prises

**Rate limiting sur toutes les routes publiques**
- Décision : `@fastify/rate-limit` sur `/auth/*`
- Pourquoi : protection contre bruteforce OTP/PIN
- Config : 5 tentatives / 15 minutes par IP

---

## Patches post-S7 (2026-04-05 → 2026-04-11)

| Date | Fix | Commit |
|------|-----|--------|
| 2026-04-06 | Proxy API calls côté web (CORS) | `77e2fcc` |
| 2026-04-07 | QR Scanner crash — dynamic import html5-qrcode | `af3ccc6` |
| 2026-04-07 | Formulaire nouvel agent refonte (poste + contrat) | `75436f0` |
| 2026-04-08 | Baseline migration Prisma `20260401000000_init` | `3932523` |
| 2026-04-09 | Badges statut=ACTIF uppercase fix | `06eecdb` |
| 2026-04-09 | Matricule MAX-based (fix unique constraint) | `fa1b2f4` |
| 2026-04-10 | Logout 303 See Other (fix 405) | `8ab1ff9` |
| 2026-04-10 | GET /contrats/:id + QR regenerate | `552edf2` |
| 2026-04-11 | Gzip + cache Vercel 20s + keepalive TCP | `b1a3ab5` |
| 2026-04-11 | loading.tsx toutes les routes (Speed Index fix) | `3268309` |

---

## Session Cowork — 11 avril 2026 (planification pré-pilote)

### Décisions produit prises

**3 documents distincts — fiche de présence ≠ fiche de paie ≠ résumé de paie**
- Décision : traiter ces 3 documents comme 3 étapes d'un pipeline, pas 3 features
- Fiche de présence = document opérationnel pendant la semaine (grille jours × agents)
- Résumé de paie = document de validation en fin de cycle (consolidé)
- Fiche de paie = document archive après paiement Wave (par agent)
- Pourquoi : les entreprises BTP utilisent déjà ces 3 documents séparément — ne pas les fusionner

**Import Excel = enrôlement uniquement, QR obligatoire après**
- Décision : l'import Excel est une fonctionnalité d'onboarding one-shot, pas un flux récurrent
- Pourquoi : autoriser l'import en continu crée une porte de sortie au QR scanning — adoption compromise
- Rejeté : import Excel permanent en parallèle du QR (hybride trop complexe, adoption risquée)
- Cas limite : première semaine partielle → démarrage propre au jour de l'enrôlement, pas de rétroactif Excel

**Calendrier de présence hebdo intégré dans `/chantiers/[id]`**
- Décision : la page détail chantier est aussi le calendrier de présence semaine par semaine
- Grille : agents en lignes, jours en colonnes (Lun→Dim), navigation prev/next semaine
- Alimenté uniquement par les pointages QR/OTP — pas d'import sur cette vue
- Pourquoi : un seul endroit pour voir ET corriger les présences, pas deux pages séparées
- Rejeté : page `/presences` séparée (fragmentation inutile)

**Workflow approbation paie (Gestionnaire/Validateur) — décision reportée**
- Décision : à valider avec le client pilote en réunion — dépend de leur organisation interne
- Question clé : est-ce que le chef de chantier et le directeur sont deux personnes différentes ?
- Rejeté pour l'instant : builder le workflow sans validation terrain

**Fiche de paie PDF — 6 colonnes, générée à la validation du cycle**
- Décision : stocker sur R2 au moment de la validation (pas à la volée)
- Colonnes retenues : Agent + Matricule · Poste · Jours présents · Jours absents · Taux journalier · Heures supp (qté + montant) · Salaire net · Moyen de paiement
- Pourquoi stockage R2 : évite les divergences si corrections post-génération
- Rejeté : génération à la volée sans stockage (pas d'audit trail)
- Spec complète : `SPEC_fiche_de_paie.md`

---

## Décisions ouvertes

| # | Question | Options | Statut |
|---|----------|---------|--------|
| 1 | Migration Railway → Sonatel Cloud | Après régularisation CDP | En attente |
| 2 | Plan tarifaire définitif | 15k/35k XOF/mois hypothèse | À valider avec premiers clients |
| 3 | V2 : KYC agents | Photo CNI via R2 | Planifié |

---

## Sprint S8 — Landing publique + Onboarding self-serve (2026-04-25/26)
**Commits** : `d727864` (merge feat/landing-onboarding) → `d782324` (chip fix)

### Décisions prises

**Landing `/` accessible sans auth + middleware ouvert sur 3 routes**
- Décision : middleware Next.js autorise `/`, `/login`, `/onboarding/*` sans token ; redirige les anonymes vers `/` (au lieu de `/login`)
- Pourquoi : le visiteur découvre Kufinekk via la landing avant de s'inscrire — `/login` n'est plus la porte d'entrée publique
- Fichier : `apps/web/src/middleware.ts`

**Onboarding 7 étapes en wizard client-side**
- Étapes : Compte → Vérification OTP → Entreprise → Chantier → Pointeur → Agents → Prêt
- Décision : tout l'état du wizard reste en mémoire client (`useState`) ; un seul appel `POST /onboarding/register` à la fin crée Entreprise + Manager + Chantier + Pointeur + Agents en transaction Prisma
- Pourquoi : un visiteur peut quitter sans pollution DB ; pas de comptes orphelins
- Rejeté : créer chaque ressource étape par étape (cleanup compliqué en cas d'abandon)

**OTP : vérification non-destructive au step 2**
- Décision : nouvelle route `POST /onboarding/verify-otp` qui valide le code SANS le marquer `utilise=true`
- Le `register` final consomme le même OTP (toujours valide tant qu'il n'expire pas — 10 min)
- Pourquoi : feedback UX immédiat à l'étape OTP sans bloquer le register final
- Rejeté : valider seulement à la fin (UX dégradée — l'utilisateur découvre l'erreur 5 étapes plus tard)

**SMS AxiomText — signature par défaut `OTP` en attendant approbation `yaatal`**
- Décision : config `AXIOMTEXT_SIGNATURE=OTP` (signature générique fournie par AxiomText pour comptes non-approuvés)
- Demande de changement de nom vers `yaatal` en cours d'examen côté Sonatel/Orange
- Code rendu signature obligatoire + normalise le téléphone vers `+221xxxxxxxxx` automatiquement
- Fichier : `apps/api/src/shared/services/axiomtext.ts`

**Agents wizard : 4 colonnes (sans téléphone)**
- Décision : ne demander que prénom/nom/poste/taux à l'onboarding ; téléphone optionnel à compléter depuis la page Agents
- Pourquoi : friction minimale au moment de l'inscription ; un manager rentre 3-4 agents rapidement
- Le téléphone reste nécessaire pour le SMS QR code, mais c'est une étape post-onboarding

**Migration DB `entreprise_onboarding_fields`**
- Ajout colonnes `Entreprise.raisonSociale | ville | ninea | taille` (toutes nullable)
- Appliquée en prod via Supabase MCP (`apply_migration`) le 26/04/2026
- Pourquoi nullable : préserve la compatibilité avec les entreprises créées avant onboarding self-serve

**Vercel deployment — vercel.json à la racine du monorepo**
- Décision finale : `outputDirectory: apps/web/.next` (chemin depuis racine repo) + `buildCommand: npm run build:web`
- Override Install Command supprimé du dashboard Vercel (`npm install --prefix=../..` qui causait conflits)
- Production branch : `master`
