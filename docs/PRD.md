# PRD — Kufinekk
> Système de pointage BTP au Sénégal
> Dernière mise à jour : 2026-04-11

---

## 1. Problème

Les chantiers BTP au Sénégal gèrent la présence des ouvriers sur papier ou via WhatsApp. Cela entraîne :
- Des erreurs de calcul de paie (contestations fréquentes)
- Une impossibilité de tracer les heures supplémentaires
- Des paiements Wave manuels chronophages chaque vendredi
- Zéro visibilité pour le manager sur plusieurs chantiers simultanément

---

## 2. Solution

Application web + mobile permettant :
- Pointage entrée/sortie par QR code ou OTP
- Calcul automatique de la paie journalière (taux normal + heures supp)
- Paiement Wave automatique chaque vendredi
- Dashboard temps réel par chantier

---

## 3. Utilisateurs cibles

| Persona | Rôle | Besoin principal |
|---------|------|-----------------|
| **Manager BTP** | Propriétaire de l'entreprise / chef de chantier | Voir la masse salariale, valider les paiements, gérer les agents |
| **Pointeur** | Superviseur sur chantier | Enregistrer les entrées/sorties rapidement, sans erreur |
| **Agent (ouvrier)** | Travailleur BTP | Recevoir son QR code, consulter ses heures, être payé à temps |

---

## 4. Périmètre par version

### V1 — MVP (en cours)
**Marché** : Sénégal uniquement
**Infra** : Railway + Supabase + Vercel
**Coût** : ~5 000 XOF/mois (SMS uniquement)

Fonctionnalités :
- [x] Auth Manager/Pointeur (PIN) + Agent (OTP SMS)
- [x] Gestion entreprise, utilisateurs (RBAC)
- [x] Création et gestion des agents (matricule KFN-XXXXX, QR code R2)
- [x] Gestion des chantiers
- [x] Contrats : création, validation, transfert atomique, clôture
- [x] Pointage QR/OTP : entrée + sortie + calcul A+C automatique
- [x] Corrections de pointage (Manager)
- [x] Cycles de paie hebdo + Wave Payout batch
- [x] Dashboard stats jour/semaine
- [x] Dashboard web (12/14 pages)
- [ ] Page détail chantier `/chantiers/[id]`
- [ ] Page gestion utilisateurs `/utilisateurs`
- [ ] SMS AxiomText activé (token manquant)
- [ ] Wave Payout activé (token manquant)

### V2 — Croissance (planifié)
**Marché** : Afrique francophone (Mali, Côte d'Ivoire, Guinée)
**Nouvelles fonctionnalités** :
- Exports PDF/Excel (fiches de paie, récapitulatifs)
- KYC agents (photo CNI + selfie)
- Analytics avancés (productivité par chantier, taux d'absence)
- Push notifications web + mobile
- Multi-devises (XOF, GNF, CFA BEAC)

### V3 — Scale (planifié)
**Modèle** : SaaS multi-tenant
**Nouvelles fonctionnalités** :
- App mobile React Native (iOS + Android)
- Pointage GPS (géofencing chantier)
- Mode hors-ligne (sync différée)
- API publique pour intégrations tierces
- Tableau de bord analytics SaaS (MRR, churn, usage)

---

## 5. Non-goals V1

- Gestion des congés / absences justifiées (V2)
- Contrats à durée déterminée avec renouvellement auto (V2)
- Application mobile native (V3)
- Support multi-devises (V2)
- Intégration comptable (V2+)

---

## 6. Métriques de succès V1

| Métrique | Cible 6 mois |
|----------|-------------|
| Entreprises actives | 10 |
| Agents pointés / mois | 500 |
| Paiements Wave réussis | >95% |
| Temps moyen pointage entrée | <30s |
| Churn entreprises | <10% |

---

## 7. Contraintes

| Contrainte | Détail |
|------------|--------|
| **Conformité CDP** | Loi n°2008-12 Sénégal — déclaration avant lancement prod |
| **Hébergement** | Hors Sénégal acceptable en dev, migration Sonatel Cloud à la régularisation |
| **Budget infra** | Gratuit jusqu'aux premiers clients payants, puis Railway payant |
| **Connectivité** | Chantiers avec 3G/4G instable → pas de dépendance temps réel critique |
| **Langue** | Français uniquement en V1 |

---

## 8. Modèle économique (hypothèses V1)

| Plan | Prix / mois | Inclus |
|------|-------------|--------|
| Essentiel | 15 000 XOF | 1 chantier, 50 agents, pointage QR |
| Pro | 35 000 XOF | 5 chantiers, 200 agents, exports PDF |
| Entreprise | Sur devis | Illimité, SLA, onboarding dédié |
