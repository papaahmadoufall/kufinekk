# Kufinekk — Roadmap Produit v2
**Système de pointage BTP · Sénégal**
Dernière mise à jour : 5 avril 2026

---

## Vue d'ensemble

Kufinekk est une application web + mobile de gestion de présence sur chantier pour le secteur BTP au Sénégal. Le produit est articulé autour du scan QR, d'un dashboard manager et d'un moteur de calcul de paie adapté aux deux cycles du secteur (mensuel contractuel / hebdomadaire non-contractuel via Wave).

**Utilisateurs actifs V1 :** Managers · Pointeurs
**Agents :** sujets passifs du système — pas d'interface, pas de compte, SMS uniquement.

**Stack retenue :** Node.js (Fastify) · PostgreSQL + Prisma (Supabase) · Next.js (Vercel) · Cloudflare R2 · AxiomText SMS · Wave Payout API · React Native Expo (V3 uniquement)

---

## Cadrage des phases

| Phase | Périmètre | Objectif |
|-------|-----------|----------|
| **V1 — NOW** | Backend + Web app | Enregistrement → Pointage (2 modes) → Calcul paie → Paiement Wave |
| **V2 — NEXT** | Web app enrichie | Exports, KYC, Dashboard analytique, Notifications push web |
| **V3 — LATER** | App mobile native | GPS, QR dynamique, notifications push agent, mode hors-ligne |

---

## Infra V1

| Composant | Service | Coût |
|-----------|---------|------|
| Backend API | Railway | ~0 XOF (free tier) |
| Dashboard web | Vercel | 0 XOF |
| Base de données | Supabase (PostgreSQL + Prisma) | 0 XOF |
| Stockage fichiers | Cloudflare R2 | 0 XOF |
| SMS | AxiomText (Dakar) | ~5 000 XOF/mois |
| Paiement | Wave Payout API | Commission Wave |

**Coût infra V1 : ~5 000 XOF/mois**

---

## Authentification — Décision finale

| Rôle | Connexion |
|------|-----------|
| **Manager** | Numéro de téléphone + **mot de passe** |
| **Pointeur** | Numéro de téléphone + **code PIN** |

> Le manager crée son mot de passe à la création de son compte. Aucun OTP à la connexion — flux simple et rapide sur le terrain.

---

## Modes de pointage — Décision finale

**2 modes uniquement (le mode PIN statique a été supprimé) :**

| Mode | Quand | Flux |
|------|-------|------|
| **QR** (nominal) | Agent a son QR (lien SMS ou carte imprimée) | Agent présente son QR → pointeur scanne → entrée enregistrée |
| **OTP SMS** | Agent sans QR mais avec téléphone | Pointeur envoie code → SMS reçu par l'agent → agent lit le code oralement → pointeur saisit → entrée enregistrée |

> Le mode PIN statique a été abandonné : un code à 4 chiffres est trop difficile à mémoriser pour les agents sur le terrain.
> **Sortie :** pas de vérification d'identité — la présence physique face au pointeur est une garantie suffisante.

---

## NOW — V1 · État d'avancement (5 avril 2026)

---

### Backend API — Railway ✅ COMPLET ET DÉPLOYÉ

URL : `https://kufinekk-production.up.railway.app`

| Module | Endpoints | Statut |
|--------|-----------|--------|
| Auth (OTP SMS + mot de passe Manager + PIN Pointeur + JWT) | POST /auth/send-otp · /auth/verify-otp · /auth/login · /auth/logout | ✅ |
| Entreprises | GET/PATCH /entreprises/me | ✅ |
| Utilisateurs + RBAC | GET/POST/PATCH/DELETE /utilisateurs | ✅ |
| Agents + matricule auto (KFN-XXXXX) | GET/POST /agents · GET /agents/search · GET/PATCH /agents/:id | ✅ |
| Chantiers | GET/POST /chantiers · GET/PATCH /chantiers/:id | ✅ |
| Contrats + transfert atomique | POST /contrats · PATCH/POST /contrats/:id/\* | ✅ |
| Pointages + calcul A+C | POST /pointages/entree · /sortie · /absence · PATCH /pointages/:id/corriger | ✅ |
| Cycles de paie + Wave Payout | GET/POST /cycles-paie · /cycles-paie/:id/valider · /statut-wave | ✅ |
| Dashboard stats | GET /dashboard/resume · /dashboard/semaine | ✅ |

> ⚠️ **Patch requis** suite aux amendements : `POST /auth/login` doit distinguer Manager (mot de passe) vs Pointeur (PIN). Champ `passwordHash` à ajouter sur `Utilisateur` pour les managers. Suppression de la logique mode `"PIN"` dans `/pointages/entree`.

---

### Dashboard Web — Vercel 🔄 EN COURS

URL : `https://kufinekk.vercel.app`

| Page | Statut | Priorité |
|------|--------|----------|
| Login (téléphone + mot de passe / PIN selon rôle) | ✅ Déployé | — |
| Dashboard (stats jour + totaux hebdo) | ✅ Déployé | — |
| `/agents` — liste agents | ✅ Déployé | — |
| `/agents/nouveau` — créer un agent | ✅ Déployé | — |
| `/chantiers` — liste chantiers | ✅ Déployé | — |
| `/pointages` — historique pointages | ✅ Déployé | — |
| `/cycles-paie` — liste cycles | ✅ Déployé | — |
| `/agents/[id]` — détail agent + rattacher à chantier | 🔴 À faire | Haute |
| `/chantiers/nouveau` — créer un chantier | 🔴 À faire | Haute |
| `/pointages/saisie` — pointer entrée/sortie (2 modes) | 🔴 À faire | Haute |
| `/chantiers/[id]` — détail chantier + agents actifs | 🟡 À faire | Moyenne |
| `/contrats/[id]` — valider / transférer / terminer | 🟡 À faire | Moyenne |
| `/utilisateurs` — gestion pointeurs | 🟢 À faire | Basse |

---

## Pages restantes — Détail fonctionnel

### `/pointages/saisie` — 🔴 Priorité Haute
Interface principale du pointeur. Utilisée toute la journée sur le chantier.

**Flux Entrée — Mode QR :**
Pointeur ouvre la page → active la caméra → scanne le QR de l'agent → confirmation automatique → entrée enregistrée.

**Flux Entrée — Mode OTP SMS :**
Pointeur cherche l'agent (nom ou matricule) → clique "Envoyer code" → SMS part sur le téléphone de l'agent → l'agent lit le code oralement → pointeur saisit le code → validation → entrée enregistrée.

**Flux Sortie :**
Liste des agents en statut EN_COURS → pointeur clique "Sortie" sur chaque agent → calcul A+C déclenché automatiquement → totalJournalierXof stocké.

---

### `/agents/[id]` — 🔴 Priorité Haute
Détail complet d'un agent.

- Infos agent (nom, téléphone, matricule, QR code)
- Contrat actif : chantier, poste, taux, statut (PROVISOIRE / ACTIF)
- Action : rattacher à un chantier (`POST /contrats`)
- Action : valider le contrat (`POST /contrats/:id/valider`)
- Historique des contrats passés
- Historique des pointages récents

---

### `/chantiers/nouveau` — 🔴 Priorité Haute
Formulaire de création d'un chantier.

- Nom, adresse
- Date de début, date de fin prévue
- Heure de début standard (défaut "08:00")
- Seuil heures normales (défaut 8h)
- Jours ouvrés (choix libre du manager : cases à cocher lundi → dimanche)

---

### `/chantiers/[id]` — 🟡 Priorité Moyenne
Détail chantier avec vue opérationnelle.

- Infos chantier + statut
- Liste des agents actifs sur ce chantier
- Stats du jour (présents / absents / en attente)
- Accès rapide à la saisie de pointage pour ce chantier

---

### `/contrats/[id]` — 🟡 Priorité Moyenne
Gestion d'un contrat spécifique.

- Détail contrat (poste, taux, dates, statut)
- Action : valider PROVISOIRE → ACTIF
- Action : transférer vers un autre chantier (atomique)
- Action : terminer le contrat manuellement
- Historique des pointages du contrat

---

### `/utilisateurs` — 🟢 Priorité Basse
Gestion des pointeurs et managers.

- Liste des utilisateurs de l'entreprise
- Créer un nouveau pointeur ou manager
- Modifier rôle / PIN / mot de passe / statut
- Désactiver (soft delete)

---

## Calcul de paie — Règles

**Stratégie A+C :**
- **A** : calcul immédiat à chaque `POST /pointages/sortie` → stocké en `totalJournalierXof`
- **C** : recalcul à la demande sur `PATCH /pointages/:id/corriger` (ce jour uniquement)
- Dashboard = `SUM(totalJournalierXof)` — jamais recalculé à la volée

**Formule :**
```
Si tauxHeureSuppXof est null OU durée ≤ seuilHeuresNormales :
  total = (durée / seuil) × tauxJournalierXof

Sinon :
  total = tauxJournalierXof + (heuresSupp × tauxHeureSuppXof)
```

`seuilHeuresNormales` défini sur Chantier (défaut 8h), overridable par Contrat.

---

## Transfert agent — Transaction atomique

1. `POST /contrats/:id/transferer` → `prisma.$transaction()`
2. Contrat A : `statut = TERMINE`, `dateFin = aujourd'hui`, `noteCloture = motif`
3. Contrat B : même `agentId`, nouveau `chantierId`, `statut = PROVISOIRE`
4. Pointage IN déjà ouvert ce jour → reste sur Contrat A
5. Contrat B démarre le lendemain matin
6. Deux `CyclePaie` distincts → un seul batch Wave avec deux lignes

---

## NEXT — V2 · Enrichissement (~6 semaines)

> **Objectif :** Exports, KYC, dashboard analytique, notifications push web.

| Sprint | Contenu | Durée |
|--------|---------|-------|
| Sprint V2-1 | Export Excel 3 onglets · Export PDF fiche de paie · Impression carte QR | 2 sem |
| Sprint V2-2 | KYC (photo CNI) · Dashboard multi-chantiers · Tableau analytique | 2 sem |
| Sprint V2-3 | Notifications push web · Alertes contrats J-3 · Récap absences fin journée | 2 sem |

---

## LATER — V3 · App mobile & SaaS (6+ mois)

| Item | Priorité |
|------|----------|
| App mobile React Native (Expo) — pointeur + badge agent | Must |
| GPS au scan (informatif, jamais bloquant) | Should |
| QR dynamique (TOTP optionnel) | Could |
| Notifications push agent (remplacement SMS progressif) | Should |
| Mode hors-ligne + sync au retour réseau | Must |
| Multi-entreprises SaaS | Must |
| API publique (intégration logiciels de paie tiers) | Could |
| Module RH étendu (congés, avertissements) | Could |

---

## Notifications SMS — V1 (AxiomText)

### Alertes Manager

| Priorité | Événement | Message |
|----------|-----------|---------|
| 🔴 Critique | Wave batch échoué | "Kufinekk : le paiement du cycle [date] a échoué. Connectez-vous pour relancer." |
| 🔴 Critique | Cycle de paie non validé le vendredi | "Kufinekk : le cycle du [date] est prêt. Validez avant la fin de journée pour payer vos agents." |
| 🟡 Importante | Contrat arrivant à expiration J-3 | "Kufinekk : le contrat de [Prénom Nom] expire dans 3 jours. Pensez à le renouveler." |
| 🟡 Importante | Agent en attente de validation depuis +24h | "Kufinekk : [X] agent(s) en attente de validation sur le chantier [nom]." |
| 🟢 Info | Transfert d'agent confirmé | "Kufinekk : [Prénom Nom] a été transféré vers le chantier [nom]." |
| 🟢 Info | Paiement Wave envoyé avec succès | "Kufinekk : [X] agents payés pour le cycle du [date]. Total : [montant] XOF." |

### Alertes Agent

| Événement | Message |
|-----------|---------|
| Enregistrement | Lien badge QR + PIN statique communiqué oralement |
| Paiement Wave reçu | "Kufinekk : vous avez reçu [montant] XOF pour la semaine du [date]." |
| Transfert de chantier | "Kufinekk : vous avez été transféré vers le chantier [nom] à partir de demain." |

---

## Dépendances critiques

| Dépendance | Impact | Statut |
|------------|--------|--------|
| Compte AxiomText actif | OTP SMS + notifications | À contractualiser |
| Compte Wave Business (token API) | Paiements masse | À obtenir avant mise en prod |
| Déclaration CDP Sénégal n°2008-12 | Légalement requis avant lancement prod | Guide généré — dépôt à faire |
| Hébergement Sénégal (Sonatel Cloud) | Conformité CDP post-lancement | Migration après régularisation CDP |

---

## Points ouverts (décisions à prendre)

| Question | Impact | Urgence |
|----------|--------|---------|
| ~~Taux majoration heures supp~~ | Laissé à l'appréciation du manager au niveau du contrat — `tauxHeureSuppXof` libre, `null` = pas d'heures supp | ✅ Tranché |
| ~~Jours ouvrés par défaut~~ | Configurable par le manager à la création du chantier — aucune valeur imposée | ✅ Tranché |
| ~~Alertes SMS manager~~ | Liste validée — voir section Notifications | ✅ Tranché |
| Patch auth Manager (passwordHash) | `POST /auth/login` doit distinguer Manager (password) vs Pointeur (PIN) | 🔴 À faire avant prod |

---

## Métriques de succès — V1

| Métrique | Cible |
|----------|-------|
| Temps d'enregistrement d'un agent | < 3 minutes |
| Temps de scan mode QR | < 10 secondes |
| Taux d'erreur pointage (corrections demandées) | < 5% |
| Adoption sur premier chantier pilote | 100% des agents enregistrés |
| Paiement Wave déclenché dans les délais | 100% des cycles vendredi |

---

## Risques

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Réseau mobile instable sur chantier | Scan QR échoue | Mode OTP SMS en fallback |
| Agent sans smartphone | QR inaccessible · OTP impossible | Carte QR plastifiée imprimée par le manager |
| Adoption pointeur (résistance terrain) | Sous-utilisation | Interface simple · 2 modes · formation courte |
| Wave batch échoué | Agents non payés | SMS alerte manager critique · reversal API |
| Données personnelles (CDP) | Amende / blocage légal | Déclaration avant lancement production |
