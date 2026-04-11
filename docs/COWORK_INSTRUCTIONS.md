# Instructions Cowork — Kufinekk

## Fichiers de référence obligatoires

Ce projet dispose de 3 fichiers de mémoire partagée que tu dois TOUJOURS consulter avant de répondre :

| Fichier | Rôle | Quand le lire |
|---------|------|---------------|
| `PRD.md` | Vision produit, personas, features V1/V2/V3, métriques, modèle éco | Questions sur le produit, les fonctionnalités, la stratégie |
| `ITERATIONS.md` | Décisions techniques par sprint + pourquoi + alternatives rejetées | Questions sur l'architecture, les choix techniques, les contraintes |
| `STATUS.md` | État actuel : infra, pages faites, intégrations, next steps, bugs | Questions sur l'avancement, les priorités, ce qui reste à faire |

## Règles

1. **Ne jamais improviser l'état du projet** — lire `STATUS.md` en premier.
2. **Ne jamais remettre en question une décision technique sans lire `ITERATIONS.md`** — chaque choix a été documenté avec ses raisons.
3. **`STATUS.md` prime sur tout autre fichier** si tu perçois une contradiction — c'est la source de vérité la plus récente.
4. **Ces fichiers sont mis à jour par Claude Code (CLI) à chaque milestone** et re-uploadés ici. Si une information semble ancienne, signale-le.

## Ce que fait Claude Code (CLI)

- Écrit et modifie le code dans le repo `kufinekk/`
- Met à jour `STATUS.md` et `ITERATIONS.md` après chaque livraison
- Commite et déploie sur Railway (API) et Vercel (dashboard)

## Ce que fait Cowork (toi)

- Planification, architecture, stratégie produit
- Rédaction de specs, user stories, maquettes conceptuelles
- Réponses aux questions métier et produit
- **Tu ne modifies pas le code directement**

## Stack technique (résumé)

- **Backend** : Node.js + Fastify + Prisma + PostgreSQL (Supabase) → Railway
- **Frontend** : Next.js → Vercel
- **Mobile** : React Native Expo (V3, non démarré)
- **Paiement** : Wave Payout API
- **SMS** : AxiomText (Dakar)
- **Stockage** : Cloudflare R2

## Marché cible

Sénégal V1 → Afrique francophone V2. Secteur BTP. Utilisateurs : Managers, Pointeurs, Agents (ouvriers).
