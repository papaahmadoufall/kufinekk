# Prompt — Génération de présentation Kufinekk

> Copier ce prompt dans Claude, ChatGPT, ou Gamma.app pour générer la présentation.
> Modifier les paramètres de la section `CONFIG` avant de lancer.

---

## CONFIG (à adapter avant utilisation)

```
AUDIENCE      : clients BTP Sénégal  // options : investisseurs | partenaires | clients BTP | équipe interne
FORMAT        : slides structurés    // options : Marp (markdown) | Gamma.app | PowerPoint outline | HTML/Reveal.js
NOMBRE_SLIDES : 12
LANGUE        : français
DURÉE_PITCH   : 10 minutes
TON           : direct, terrain, chiffres concrets — pas de jargon tech
```

---

## PROMPT

Tu es un expert en pitch commercial B2B pour des logiciels SaaS vendus à des PME africaines.

Génère une présentation de **12 slides** pour **Kufinekk**, un système de pointage et de paie pour les chantiers BTP au Sénégal. L'audience est composée de **directeurs et chefs de chantier BTP sénégalais** qui gèrent aujourd'hui la présence de leurs ouvriers sur papier ou via WhatsApp.

---

### Contexte produit (source de vérité)

**Le problème**
- La gestion de présence BTP au Sénégal se fait manuellement (papier, WhatsApp, mémoire)
- Conséquences directes : erreurs de calcul de paie, contestations ouvriers, heures supplémentaires non tracées, paiements Wave chronophages chaque vendredi, zéro visibilité pour le manager sur plusieurs chantiers simultanément

**La solution — Kufinekk**
- Pointage entrée/sortie par QR code (scan en moins de 30 secondes)
- Calcul automatique de la paie journalière (taux normal + heures supplémentaires)
- Paiement Wave automatique chaque vendredi pour tous les ouvriers du chantier
- Dashboard temps réel : masse salariale, absences, historique par agent et par chantier
- Accessible depuis n'importe quel téléphone avec internet (web app)

**Utilisateurs**
| Rôle | Qui c'est | Ce qu'il fait avec Kufinekk |
|------|-----------|---------------------------|
| Manager | Patron d'entreprise / chef de projet | Valide les paiements, voit les stats, gère les agents |
| Pointeur | Superviseur sur chantier | Scanne les QR codes à l'arrivée et au départ |
| Agent | Ouvrier BTP | Reçoit son QR code par SMS, consulte ses heures |

**Tarifs**
| Plan | Prix / mois | Pour qui |
|------|-------------|---------|
| Essentiel | 15 000 XOF | 1 chantier, jusqu'à 50 agents |
| Pro | 35 000 XOF | 5 chantiers, jusqu'à 200 agents, exports PDF |
| Entreprise | Sur devis | Illimité, SLA, onboarding dédié |

**État actuel**
- Produit fonctionnel, déployé en production
- API : Railway · Base de données : Supabase · Dashboard : Vercel
- Coût infrastructure : ~5 000 XOF/mois
- Intégration Wave Payout (paiement automatique) : disponible dès l'ouverture compte Wave Business
- SMS AxiomText (Dakar) : intégré

**Métriques cibles à 6 mois**
- 10 entreprises BTP actives
- 500 agents pointés par mois
- >95% de paiements Wave réussis
- Churn entreprises < 10%

**Roadmap**
- V2 : exports PDF fiches de paie, KYC agents (photo CNI), analytics avancés, expansion Mali/Côte d'Ivoire
- V3 : app mobile iOS/Android, pointage GPS, mode hors-ligne

---

### Structure des slides à générer

**Slide 1 — Accroche**
Titre percutant. Une seule question ou affirmation qui résume le problème. Visuellement : une image de chantier africain, des ouvriers en file.

**Slide 2 — Le problème (terrain)**
3 bullets maximum. Rester concret : "Le vendredi, vous passez combien de temps à calculer les salaires à la main ?" Données chiffrées si disponibles.

**Slide 3 — Ce que ça coûte vraiment**
Conséquences business : conflits avec les ouvriers, erreurs de paie, perte de temps manager, risque légal. Un chiffre ou ratio marquant si possible.

**Slide 4 — La solution en 30 secondes**
Démonstration du flux principal : Pointeur scanne → calcul automatique → Wave paie. 3 étapes visuelles maximum. Pas de screenshot technique.

**Slide 5 — Fonctionnalités clés**
3 blocs : Pointage QR | Calcul auto paie | Paiement Wave vendredi. Icônes simples, une ligne par feature.

**Slide 6 — Dashboard (preuve)**
Capture ou maquette du dashboard manager. Mettre en avant : vue chantier en temps réel, masse salariale du jour, liste des absents.

**Slide 7 — Qui utilise Kufinekk ?**
3 personas (Manager / Pointeur / Agent) avec leur quotidien avant vs après. Format tableau ou cards.

**Slide 8 — Pourquoi maintenant ?**
Wave au Sénégal : >7M utilisateurs actifs. BTP sénégalais en croissance (chiffre Plan Sénégal Emergent si disponible). Digitalisation PME : moment idéal.

**Slide 9 — Tarifs**
Tableau des 3 plans. Mettre en évidence le plan Pro comme "recommandé". Comparer avec le coût d'une erreur de paie mensuelle.

**Slide 10 — Roadmap**
Timeline simple : Aujourd'hui → V2 (exports, KYC, Afrique) → V3 (mobile, GPS). Montrer la vision long terme sans surcharger.

**Slide 11 — Prochaine étape**
CTA clair et sans friction : "Démarrez gratuitement pendant 30 jours" ou "Planifiez une démo de 20 minutes". QR code ou lien direct.

**Slide 12 — Contacts & Questions**
Nom, téléphone WhatsApp, email, URL. Slogan final court.

---

### Contraintes de style

- Chaque slide : **1 idée principale**, pas plus de 4 bullets
- Phrases courtes, actives, terrain : "Vos ouvriers pointent en 20 secondes"
- Éviter tout jargon technique (API, PostgreSQL, Prisma, JWT) — parler résultats
- Utiliser des chiffres partout où c'est possible
- Conclure chaque slide sur un bénéfice concret pour le manager BTP
- Palette couleurs suggérée : orange (#F97316) + blanc + gris foncé (#1F2937) — chantier, énergie, fiabilité
- Pas plus de 2 polices : 1 titre bold, 1 corps régulier

---

### Variantes selon l'audience (si besoin d'adapter)

**Pour investisseurs :** Remplacer slides 3, 8, 9 par : TAM/SAM/SOM Sénégal BTP, modèle de revenus MRR projeté, métriques traction actuelles (entreprises inscrites, agents, paiements traités).

**Pour partenaires techniques :** Remplacer slides 4, 5, 6 par : stack technique (Fastify + Next.js + Prisma + Railway), API publique V3, intégrations disponibles (Wave, AxiomText, R2).

**Pour équipe interne :** Supprimer slides 9-12, ajouter : dette technique actuelle, priorités sprint suivant, KPIs internes.
