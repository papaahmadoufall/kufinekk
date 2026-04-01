---
name: Kufinekk — Système de Pointage BTP
description: Projet de conception d'une app de pointage BTP pour le Sénégal. Décisions produit et architecture documentées ici.
type: project
---

## Vue d'ensemble
Application mobile + web de gestion de présence sur chantier BTP au Sénégal.
Marché cible : Sénégal en priorité, puis Afrique francophone.
Secteur : BTP (Bâtiment et Travaux Publics).

## Décisions Architecture Technique
- Backend : Node.js (Fastify/NestJS)
- App mobile : React Native (Expo)
- Dashboard web : Next.js
- DB : PostgreSQL
- Cache/Queue : Redis (BullMQ)
- QR : Statique (matricule encodé) — V1. TOTP / GPS en V2 app mobile uniquement
- Auth : Numéro de téléphone + PIN 4 chiffres + OTP SMS
- Hébergement : Sénégal (conformité CDP)

## Personnel BTP Géré
**Contractuels (paiement mensuel, durée chantier) :**
Conducteur des travaux, Chef de chantier, Chef équipe maçon, Chef équipe coffreur, Chef équipe ferrailleur

**Non-contractuels (cycle vendredi→jeudi, payés chaque vendredi) :**
Ferrailleur, Maçon, Coffreur, Manœuvre, Chef manœuvre, Conducteur bétonnière, Conducteur monte-charge

## Décisions de Conception — Module Agent
- Matricule unique par agent/entreprise (KFN-XXXXX), suit l'ouvrier d'un chantier à l'autre
- 1 seul chantier actif à la fois par ouvrier, mais historique complet par agent
- Taux journalier : libre par contrat (pas de taux fixe par poste)
- Mode provisoire : agent peut pointer dès l'enregistrement, validation manager après
- Dès ajout → agent mis en évidence sur dashboard (badge "En attente validation")
- SMS envoyé automatiquement avec lien QR + PIN après enregistrement
- PIN communiqué oralement par le pointeur pour confirmation
- Si numéro non confirmé → flag sur dashboard, l'agent passe quand même
- Manager peut valider tous les agents en attente en une seule action
- Correction de pointage : manager uniquement, pas de limite de temps
- Fin de contrat : automatique à la date de fin (l'agent ne peut plus pointer)
- Absences : automatique (pas de pointage un jour ouvré = absent), correction manuelle manager
- Calcul heures : différence départ − arrivée
- Heure standard définie à l'enregistrement de l'agent, modifiable par le manager
- Recherche d'abord par téléphone avant de créer un nouvel agent (éviter les doublons)

## Roadmap V1 → V2
- V1 (web app) : QR statique, pas de GPS, scan par pointeur, carte plastifiée ou écran agent
- V2 (app mobile React Native/Expo) : GPS activé au scan, position enregistrée à titre informatif (pas bloquant), app agent dédiée avec QR dynamique
- GPS ne bloque jamais le pointage — présence physique face au pointeur = garantie suffisante

## Points Encore Ouverts
- Taux de majoration heures supp : défini par chantier ou par poste ?
- Notifications push : quelles alertes reçoit le manager exactement ?
- Correction d'absence manuelle : interface à concevoir

## Intégrations Externes Retenues
- SMS OTP : HSMS.ci (multi-pays Afrique de l'Ouest) ou AxiomText (Sénégal). Décision finale selon scope géographique V1.
- Paiement masse : Wave Payout API (docs.wave.com/payout). Endpoints : POST /v1/payout-batch · GET /v1/payouts-batch/:id · POST /v1/payout/:id/reverse. Auth Bearer token via Wave Business Portal.
- Flow paie : calcul auto (BullMQ) → validation manager → POST payout-batch → polling statut → dashboard temps réel.
- Champ wave_batch_id + wave_payout_id + statut_paiement ajoutés à cycles_paie.

## Réglementation (occulté pour la conception)
- Loi CDP Sénégal n°2008-12 — déclaration à déposer avant lancement
- Guide de remplissage CDP généré : Kufinekk_Guide_Remplissage_CDP.docx