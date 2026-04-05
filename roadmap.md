---
name: Kufinekk — Roadmap sprints
description: État d'avancement du développement V1. Mis à jour au 5 avril 2026.
type: project
---

## Roadmap développement V1

### Backend API — Railway ✅ COMPLET ET DÉPLOYÉ
URL : `https://kufinekk-production.up.railway.app`

| Sprint | Livrable | Statut | Date |
|--------|----------|--------|------|
| S0 | Monorepo + Prisma + CI/CD Railway/Vercel | ✅ TERMINÉ | 2026-04-01 |
| S1 | Auth complète (OTP AxiomText + JWT + sessions) | ✅ TERMINÉ | 2026-04-01 |
| S2 | Entreprises + Utilisateurs + RBAC middleware | ✅ TERMINÉ | 2026-04-01 |
| S3 | Agents + Contrats + Transfert atomique | ✅ TERMINÉ | 2026-04-01 |
| S4 | Chantiers + fin contrat automatique | ✅ TERMINÉ | 2026-04-01 |
| S5 | Pointages + calcul A+C + corrections | ✅ TERMINÉ | 2026-04-01 |
| S6 | CyclePaie + Wave Payout + polling | ✅ TERMINÉ | 2026-04-01 |
| S7 | Dashboard stats (résumé jour + totaux hebdo) | ✅ TERMINÉ | 2026-04-01 |

> ⚠️ **Patch requis** : `POST /auth/login` doit distinguer Manager (mot de passe) vs Pointeur (PIN). Champ `passwordHash` à ajouter sur `Utilisateur`. Suppression de la logique mode `"PIN"` dans `/pointages/entree`.

---

### Dashboard Web — Vercel 🔄 EN COURS
URL : `https://kufinekk.vercel.app`

| Sprint | Page | Statut | Date |
|--------|------|--------|------|
| S8 | Login (téléphone + PIN/mot de passe) | ✅ TERMINÉ | 2026-04-02 |
| S8 | Dashboard (stats jour + totaux hebdo) | ✅ TERMINÉ | 2026-04-02 |
| S8 | `/agents` — liste agents | ✅ TERMINÉ | 2026-04-02 |
| S8 | `/agents/nouveau` — créer un agent | ✅ TERMINÉ | 2026-04-05 |
| S8 | `/chantiers` — liste chantiers | ✅ TERMINÉ | 2026-04-02 |
| S8 | `/pointages` — historique pointages | ✅ TERMINÉ | 2026-04-02 |
| S8 | `/cycles-paie` — liste cycles | ✅ TERMINÉ | 2026-04-02 |
| S9 | `/agents/[id]` — détail + rattacher à chantier | 🔴 À FAIRE | — |
| S9 | `/chantiers/nouveau` — créer un chantier | 🔴 À FAIRE | — |
| S9 | `/pointages/saisie` — saisie QR + OTP SMS | 🔴 À FAIRE | — |
| S9 | `/chantiers/[id]` — détail + agents actifs | 🟡 À FAIRE | — |
| S9 | `/contrats/[id]` — valider / transférer / terminer | 🟡 À FAIRE | — |
| S10 | `/utilisateurs` — gestion pointeurs | 🟢 À FAIRE | — |

---

## Détail des pages restantes

### `/pointages/saisie` — 🔴 Haute priorité
Interface principale du pointeur, utilisée toute la journée sur chantier.

**Flux Entrée — Mode QR :**
Pointeur ouvre la page → active la caméra → scanne le QR de l'agent → confirmation automatique → entrée enregistrée.

**Flux Entrée — Mode OTP SMS :**
Pointeur cherche l'agent (nom ou matricule) → clique "Envoyer code" → SMS part sur le téléphone de l'agent → l'agent lit le code oralement → pointeur saisit le code → validation → entrée enregistrée.

**Flux Sortie :**
Liste des agents en statut EN_COURS → pointeur clique "Sortie" sur chaque agent → calcul A+C déclenché → `totalJournalierXof` stocké.

---

### `/agents/[id]` — 🔴 Haute priorité
- Infos agent (nom, téléphone, matricule, QR code)
- Contrat actif : chantier, poste, taux, statut (PROVISOIRE / ACTIF)
- Action : rattacher à un chantier (`POST /contrats`)
- Action : valider le contrat (`POST /contrats/:id/valider`)
- Historique des contrats passés
- Historique des pointages récents

---

### `/chantiers/nouveau` — 🔴 Haute priorité
- Nom, adresse
- Date de début, date de fin prévue
- Heure de début standard (défaut "08:00")
- Seuil heures normales (défaut 8h)

---

### `/chantiers/[id]` — 🟡 Priorité moyenne
- Infos chantier + statut
- Liste des agents actifs
- Stats du jour (présents / absents / en attente)
- Accès rapide à la saisie de pointage pour ce chantier

---

### `/contrats/[id]` — 🟡 Priorité moyenne
- Détail contrat (poste, taux, dates, statut)
- Action : valider PROVISOIRE → ACTIF
- Action : transférer vers un autre chantier (atomique)
- Action : terminer le contrat manuellement

---

### `/utilisateurs` — 🟢 Priorité basse
- Liste des utilisateurs de l'entreprise
- Créer / modifier / désactiver pointeurs et managers

---

## Prochaines phases

| Phase | Contenu | Horizon |
|-------|---------|---------|
| V2 | Exports Excel/PDF · KYC · Dashboard analytique · Notifications push web | ~6 semaines après V1 |
| V3 | App mobile React Native (Expo) · GPS · QR dynamique · Mode hors-ligne | 6+ mois |
