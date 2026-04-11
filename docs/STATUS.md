# STATUS — Kufinekk
> Source de vérité partagée entre Claude Code et Cowork.
> Mettre à jour à chaque milestone. Commiter sur master.

**Dernière mise à jour : 2026-04-11 — `/chantiers/[id]` implémenté**

---

## Résumé en une phrase

Backend V1 complet en production sur Railway. Dashboard web 12/14 pages. 2 pages restantes + 2 intégrations externes à activer.

---

## Infrastructure

| Composant | URL | Statut |
|-----------|-----|--------|
| API (Railway) | `https://kufinekk-api.up.railway.app` | ✅ En ligne |
| Base de données | Supabase PostgreSQL | ✅ En ligne |
| Dashboard (Vercel) | `https://kufinekk.vercel.app` | ✅ En ligne |
| CI/CD | GitHub Actions → Railway + Vercel | ✅ Actif |

---

## Backend — Modules API

| Module | Endpoints | Statut |
|--------|-----------|--------|
| Auth | send-otp, verify-otp, login, logout | ✅ |
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
| Login | `/login` | ✅ | Auth Manager/Pointeur |
| Dashboard | `/dashboard` | ✅ | Stats jour/semaine |
| Liste agents | `/agents` | ✅ | Recherche + cards |
| Nouveau agent | `/agents/nouveau` | ✅ | Formulaire complet |
| Profil agent | `/agents/[id]` | ✅ | QR + contrat + historique |
| Liste chantiers | `/chantiers` | ✅ | Grid cards |
| Nouveau chantier | `/chantiers/nouveau` | ✅ | Formulaire |
| **Détail chantier** | `/chantiers/[id]` | ✅ | Calendrier présences + stats + corrections |
| Liste pointages | `/pointages` | ✅ | Tabs statut + filtre date |
| Saisie pointage | `/pointages/saisie` | ✅ | Flow 4 étapes + QR scanner |
| Cycles de paie | `/cycles-paie` | ✅ | Liste + résumé |
| Profil contrat | `/contrats/[id]` | ✅ | Valider/transférer/terminer |
| Badges QR | `/badges` | ✅ | Grille imprimable |
| **Utilisateurs** | `/utilisateurs` | ⏳ À FAIRE | Priorité 2 |

**Avancement : 13/14 pages (93%)**

---

## Intégrations externes

| Service | Statut | Bloqueur | Action |
|---------|--------|----------|--------|
| SMS AxiomText | ❌ Inactif | `AXIOMTEXT_TOKEN` manquant Railway | Obtenir token + configurer Railway |
| Wave Payout | ❌ Inactif | `WAVE_API_TOKEN` manquant Railway | Ouvrir compte Wave Business |
| Cloudflare R2 | ✅ Actif | — | — |

---

## Prochaines priorités

### Priorité 1 — `/utilisateurs` ← PROCHAINE PRIORITÉ
- Liste des pointeurs/managers
- Créer un nouveau pointeur
- Désactiver un compte
- Réinitialiser le PIN

### Priorité 3 — Export PDF Fiche de Paie
- Spec complète : `SPEC_fiche_de_paie.md`
- PDF par cycle de paie, tous agents dans un tableau
- En-tête entreprise (logo R2, nom, adresse, email)
- Tableau : nom · matricule · poste · jours · taux · heures supp (qté + montant) · salaire net · moyen paiement · date
- Endpoint `GET /cycles-paie/:id/export-pdf` (MANAGER uniquement)
- À ajouter : champ `moyenPaiement` + `datePaiement` sur `CyclePaie`
- À vérifier : upload logo sur profil entreprise

### Priorité 4 — Activer les intégrations
- Configurer `AXIOMTEXT_TOKEN` sur Railway → SMS actifs
- Configurer `WAVE_API_TOKEN` sur Railway → paiements Wave actifs

---

## Bugs connus / Points de vigilance

| # | Problème | Fichier | Impact |
|---|----------|---------|--------|
| 1 | SMS non envoyés (token manquant) | `axiomtext.ts` | Moyen — SMS OTP fallback à confirmer |
| 2 | Wave Payout non activé | `wave.ts` | Fort — paiements manuels pour l'instant |

---

## Variables d'environnement Railway

| Variable | Statut |
|----------|--------|
| DATABASE_URL | ✅ Configurée |
| JWT_SECRET | ✅ Configurée |
| JWT_EXPIRES_IN | ✅ Configurée |
| NODE_ENV | ✅ Configurée |
| PORT / HOST | ✅ Configurées |
| CORS_ORIGIN | ✅ Configurée |
| API_BASE_URL | ✅ Configurée |
| AXIOMTEXT_SIGNATURE | ✅ Configurée |
| WAVE_API_URL | ✅ Configurée |
| R2_* (4 variables) | ✅ Configurées |
| **AXIOMTEXT_TOKEN** | ❌ Manquante |
| **WAVE_API_TOKEN** | ❌ Manquante |

---

## Nouvelles features identifiées (session 11 avril 2026)

| Feature | Décision | Version |
|---------|----------|---------|
| Import Excel agents | Enrôlement uniquement (one-shot) | V1 enrichie |
| Calendrier présence hebdo | Intégré dans `/chantiers/[id]` | V1 — P1 |
| Fiche de présence PDF | Export depuis `/chantiers/[id]` | V1 enrichie |
| Résumé de paie PDF | Spec dans `SPEC_fiche_de_paie.md` | V1 enrichie |
| Workflow approbation paie | Gestionnaire / Validateur — à valider pilote | V2 |
| Historique paiements archivé | Stockage R2 à validation cycle | V1 enrichie |
| Flow d'enrôlement self-serve | Après 10 onboardings manuels | V2 |

**Règle décidée :** Import Excel = enrôlement uniquement. Post-enrôlement = QR obligatoire.
**3 documents distincts :** Fiche de présence (opérationnel) · Résumé de paie (validation) · Fiche de paie (archive post-paiement)

---

## Roadmap globale

| Version | Statut | Description |
|---------|--------|-------------|
| V1 Backend | ✅ Terminé | API complète en prod |
| V1 Dashboard | 🔄 En cours | 12/14 pages |
| V2 | ⏳ Planifié | Exports, KYC, analytics, multi-pays |
| V3 | ⏳ Planifié | Mobile natif, GPS, hors-ligne, SaaS |
