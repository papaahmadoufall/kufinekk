# STATUS — Kufinekk
> Source de vérité partagée entre Claude Code et Cowork.
> Mettre à jour à chaque milestone. Commiter sur master.

**Dernière mise à jour : 2026-04-26 — Landing publique + Onboarding self-serve + SMS AxiomText activé**

---

## Résumé en une phrase

Backend V1 complet en production. Dashboard 13/14 pages. Landing publique + onboarding 7-étapes self-serve déployés. SMS AxiomText opérationnel. Reste : page `/utilisateurs` + activation Wave Payout.

---

## Infrastructure

| Composant | URL | Statut |
|-----------|-----|--------|
| API (Railway) | `https://kufinekk-production.up.railway.app` | ✅ En ligne |
| Base de données | Supabase PostgreSQL (`sdbrpkzxwbuooggktpqg`) | ✅ En ligne |
| Dashboard (Vercel) | `https://kufinekk.vercel.app` | ✅ En ligne |
| Production branch | `master` (auto-deploy Vercel + Railway) | ✅ Actif |

---

## Backend — Modules API

| Module | Endpoints | Statut |
|--------|-----------|--------|
| Auth | send-otp, verify-otp, login, logout | ✅ |
| **Onboarding** | send-otp, **verify-otp**, register | ✅ **NOUVEAU** |
| Entreprises | GET/PATCH /entreprises/me | ✅ |
| Utilisateurs | CRUD /utilisateurs | ✅ |
| Agents | CRUD + search + QR regenerate | ✅ |
| Chantiers | CRUD /chantiers | ✅ |
| Contrats | CRUD + valider + transferer + terminer | ✅ |
| Pointages | entree + sortie + corriger + absence | ✅ |
| Cycles de paie | CRUD + valider + statut Wave | ✅ |
| Dashboard | resume + semaine | ✅ |

---

## Dashboard Web — Pages

| Page | Route | Statut | Notes |
|------|-------|--------|-------|
| **Landing publique** | `/` | ✅ **NOUVEAU** | Page marketing accessible sans auth |
| **Onboarding** | `/onboarding` | ✅ **NOUVEAU** | Wizard 7 étapes self-serve avec OTP |
| Login | `/login` | ✅ | Auth Manager/Pointeur |
| Dashboard | `/dashboard` | ✅ | Stats jour/semaine |
| Liste agents | `/agents` | ✅ | Recherche + cards |
| Nouveau agent | `/agents/nouveau` | ✅ | Formulaire complet |
| Profil agent | `/agents/[id]` | ✅ | QR + contrat + historique |
| Liste chantiers | `/chantiers` | ✅ | Grid cards |
| Nouveau chantier | `/chantiers/nouveau` | ✅ | Formulaire |
| Détail chantier | `/chantiers/[id]` | ✅ | Calendrier présences + stats |
| Liste pointages | `/pointages` | ✅ | Tabs statut + filtre date |
| Saisie pointage | `/pointages/saisie` | ✅ | Flow 4 étapes + QR scanner |
| Cycles de paie | `/cycles-paie` | ✅ | Liste + résumé |
| Profil contrat | `/contrats/[id]` | ✅ | Valider/transférer/terminer |
| Badges QR | `/badges` | ✅ | Grille imprimable |
| **Utilisateurs** | `/utilisateurs` | ⏳ À FAIRE | Priorité 1 |

**Avancement : 15/16 pages (94%)** — landing + onboarding ajoutés à la roadmap

---

## Intégrations externes

| Service | Statut | Détails |
|---------|--------|---------|
| **SMS AxiomText** | ✅ **ACTIF** | Token `sms_***` + signature `OTP` (compte par défaut, en attente d'approbation `yaatal`) |
| Wave Payout | ❌ Inactif | `WAVE_API_TOKEN` manquant — ouvrir compte Wave Business |
| Cloudflare R2 | ✅ Actif | — |

---

## Prochaines priorités

### Priorité 1 — `/utilisateurs`
Liste pointeurs/managers · créer · désactiver · réinitialiser PIN

### Priorité 2 — Approbation signature `yaatal` côté AxiomText
Une fois validé par Sonatel, switcher `AXIOMTEXT_SIGNATURE=OTP` → `AXIOMTEXT_SIGNATURE=yaatal`

### Priorité 3 — Wave Payout
Ouvrir compte Wave Business · obtenir `WAVE_API_TOKEN` · configurer Railway

### Priorité 4 — Export PDF Fiche de Paie
Spec : `SPEC_fiche_de_paie.md` · endpoint `GET /cycles-paie/:id/export-pdf`

---

## Bugs connus / Points de vigilance

| # | Problème | Fichier | Impact |
|---|----------|---------|--------|
| 1 | Wave Payout non activé | `wave.ts` | Fort — paiements manuels |
| 2 | Signature SMS = `OTP` (générique) en attendant `yaatal` | env Railway | Cosmétique |

---

## Variables d'environnement Railway

| Variable | Statut |
|----------|--------|
| DATABASE_URL · JWT_SECRET · JWT_EXPIRES_IN | ✅ |
| NODE_ENV · PORT · HOST · CORS_ORIGIN · API_BASE_URL | ✅ |
| **AXIOMTEXT_TOKEN** | ✅ **CONFIGURÉ** |
| AXIOMTEXT_SIGNATURE | ✅ (`OTP` — temporaire) |
| WAVE_API_URL | ✅ |
| R2_* (4 variables) | ✅ |
| **WAVE_API_TOKEN** | ❌ Manquante |

---

## Migrations Prisma — Production

| Migration | Date | Statut |
|-----------|------|--------|
| `20260401000000_init` | 2026-04-01 | ✅ Appliquée |
| `20260423000000_entreprise_onboarding_fields` | 2026-04-26 | ✅ Appliquée (raisonSociale, ville, ninea, taille) |

---

## Roadmap globale

| Version | Statut | Description |
|---------|--------|-------------|
| V1 Backend | ✅ Terminé | API complète en prod |
| V1 Dashboard | 🔄 En cours | 15/16 pages |
| V1 Self-serve | ✅ **Terminé** | Landing + onboarding 7 étapes opérationnels |
| V2 | ⏳ Planifié | Exports PDF, KYC, analytics, multi-pays |
| V3 | ⏳ Planifié | Mobile natif, GPS, hors-ligne, SaaS |
