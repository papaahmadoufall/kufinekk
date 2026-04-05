---
name: Kufinekk — Système de Pointage BTP
description: Projet de gestion de présence sur chantier BTP pour le Sénégal. Décisions produit et architecture documentées ici.
type: project
---

## Vue d'ensemble
Application web + mobile de gestion de présence sur chantier BTP au Sénégal.
Marché cible : Sénégal V1, Afrique francophone V2.
Secteur : BTP (Bâtiment et Travaux Publics).

**Utilisateurs actifs V1 :** Managers · Pointeurs
**Agents :** sujets passifs — pas d'interface, pas de compte, SMS uniquement.

---

## Stack technique retenue

| Composant | Technologie | Hébergement |
|-----------|-------------|-------------|
| Backend API | Node.js + Fastify | Railway |
| Dashboard web | Next.js 14 | Vercel |
| App mobile | React Native (Expo) | V3 uniquement |
| Base de données | PostgreSQL + Prisma ORM | Supabase |
| Stockage fichiers | Cloudflare R2 | — |
| SMS | AxiomText (Dakar) | — |
| Paiement | Wave Payout API | — |

> Redis/BullMQ abandonné — calcul de paie synchrone (stratégie A+C) suffisant pour V1.

**Coût infra V1 : ~5 000 XOF/mois (SMS uniquement)**

---

## Authentification — Décision finale

| Rôle | Connexion |
|------|-----------|
| **Manager** | Numéro de téléphone + **mot de passe** |
| **Pointeur** | Numéro de téléphone + **code PIN** |

> OTP SMS utilisé uniquement pour le mode pointage fallback — pas à la connexion manager/pointeur.
> ⚠️ Patch API requis : ajouter `passwordHash` sur `Utilisateur`, distinguer les deux flux dans `POST /auth/login`.

---

## Modes de pointage — Décision finale

**2 modes uniquement :**

| Mode | Quand | Flux |
|------|-------|------|
| **QR** (nominal) | Agent a son QR (SMS ou carte imprimée) | Agent présente son QR → pointeur scanne → entrée enregistrée |
| **OTP SMS** | Agent sans QR mais avec téléphone | Pointeur envoie code → SMS agent → agent lit oralement → pointeur saisit → entrée enregistrée |

> Mode PIN statique abandonné : trop difficile à mémoriser sur le terrain.
> Sortie : pas de vérification d'identité — présence physique face au pointeur = garantie suffisante.

---

## Personnel BTP géré

**Contractuels (paiement mensuel) :**
Conducteur des travaux, Chef de chantier, Chef équipe maçon, Chef équipe coffreur, Chef équipe ferrailleur

**Non-contractuels (cycle vendredi→jeudi, payés chaque vendredi via Wave) :**
Ferrailleur, Maçon, Coffreur, Manœuvre, Chef manœuvre, Conducteur bétonnière, Conducteur monte-charge

---

## Décisions de conception — Module Agent

- Matricule unique par agent (KFN-XXXXX), suit l'ouvrier d'un chantier à l'autre
- 1 seul chantier actif à la fois, historique complet conservé
- Taux journalier libre par contrat (pas de taux fixe par poste)
- Mode provisoire : agent peut pointer dès l'enregistrement, validation manager après
- Agents en attente mis en évidence sur dashboard (badge "En attente validation")
- SMS automatique avec lien QR après enregistrement
- Recherche par téléphone avant création (éviter les doublons)
- Correction de pointage : manager uniquement, sans limite de temps
- Fin de contrat : automatique à la date de fin (agent ne peut plus pointer)
- Absences : automatique (pas de pointage un jour ouvré = absent), correction manuelle manager
- `seuilHeuresNormales` défini sur Chantier (défaut 8h), overridable par Contrat

---

## Calcul de paie — Stratégie A+C

- **A** : calcul immédiat à chaque `POST /pointages/sortie` → stocké en `totalJournalierXof`
- **C** : recalcul à la demande sur `PATCH /pointages/:id/corriger` (ce jour uniquement)
- Dashboard = `SUM(totalJournalierXof)` — jamais recalculé à la volée

```
Si tauxHeureSuppXof est null OU durée ≤ seuilHeuresNormales :
  total = (durée / seuil) × tauxJournalierXof
Sinon :
  total = tauxJournalierXof + (heuresSupp × tauxHeureSuppXof)
```

---

## Intégrations externes

- **SMS** : AxiomText (Dakar) — OTP pointage + notifications agents + alertes manager
- **Paiement masse** : Wave Payout API — `POST /v1/payout-batch` · `GET /v1/payouts-batch/:id` · `POST /v1/payout/:id/reverse`
- **QR code** : matricule KFN-XXXXX encodé, stocké sur Cloudflare R2, envoyé par SMS

---

## Notifications SMS V1 (AxiomText)

**Manager :**
- 🔴 Wave batch échoué
- 🔴 Cycle de paie non validé le vendredi
- 🟡 Contrat expirant dans 3 jours
- 🟡 Agent en attente de validation depuis +24h
- 🟢 Transfert agent confirmé
- 🟢 Paiement Wave envoyé

**Agent :**
- Enregistrement (lien QR)
- Paiement Wave reçu
- Transfert de chantier

---

## Points ouverts

| Question | Décision |
|----------|----------|
| Taux majoration heures supp | `tauxHeureSuppXof` libre par contrat, `null` = pas d'heures supp ✅ |
| Jours ouvrés | Configurable par le manager à la création du chantier ✅ |
| Alertes SMS manager | Liste validée ci-dessus ✅ |
| Auth Manager (passwordHash) | Patch API requis — `passwordHash` sur `Utilisateur` 🔴 |

---

## Réglementation

- Loi CDP Sénégal n°2008-12 — déclaration à déposer avant lancement production
- Hébergement actuel hors Sénégal (Supabase/Railway) — acceptable pour V1 développement
- Migration vers Sonatel Cloud prévue après régularisation CDP

---

## Dépendances critiques avant production

| Dépendance | Statut |
|------------|--------|
| Compte AxiomText actif | À contractualiser |
| Compte Wave Business (token API) | À obtenir |
| Déclaration CDP Sénégal n°2008-12 | Guide généré — dépôt à faire |
| Hébergement Sénégal (Sonatel Cloud) | Migration après régularisation CDP |
