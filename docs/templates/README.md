# Framework Mémoire Partagée — Claude Code × Cowork

> Framework réutilisable pour synchroniser le contexte entre Claude Code (CLI) et Claude.ai Projects (Cowork).
> Duplique ce dossier `docs/templates/` dans n'importe quel nouveau projet.

---

## Concept

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Claude Code (CLI) │         │  Cowork (claude.ai/code) │
│                     │         │                          │
│  Lit automatique :  │         │  Lit les fichiers        │
│  - CLAUDE.md        │◄───────►│  uploadés dans le        │
│  - docs/*.md        │  Git    │  Project                 │
└─────────────────────┘  repo   └──────────────────────────┘
```

**Principe** : les fichiers `docs/` sont la source de vérité unique.
- Claude Code les lit directement depuis le repo
- Cowork les reçoit via upload manuel (ou connexion GitHub si disponible)

---

## Structure

```
docs/
├── PRD.md          ← Vision produit, personas, features V1/V2/V3, métriques
├── ITERATIONS.md   ← Décisions techniques par sprint + pourquoi + alternatives rejetées
├── STATUS.md       ← État actuel (infra, pages, intégrations, next steps)
└── templates/
    ├── README.md              ← Ce fichier
    ├── PRD.template.md        ← Template vierge PRD
    ├── ITERATIONS.template.md ← Template vierge journal de décisions
    └── STATUS.template.md     ← Template vierge état courant
```

---

## Pour démarrer un nouveau projet

### 1. Copier les templates

```bash
mkdir docs
cp docs/templates/PRD.template.md docs/PRD.md
cp docs/templates/ITERATIONS.template.md docs/ITERATIONS.md
cp docs/templates/STATUS.template.md docs/STATUS.md
```

### 2. Remplir les placeholders

Remplace tous les `{{PLACEHOLDER}}` dans chaque fichier :
- `{{PROJECT_NAME}}` → nom de ton projet
- `{{DATE}}` → date du jour
- `{{TAGLINE}}` → description en une ligne
- etc.

### 3. Référencer dans CLAUDE.md

Ajoute cette section dans ton `CLAUDE.md` :

```markdown
## Mémoire partagée

Les fichiers de référence du projet sont dans `docs/` :
- `docs/PRD.md` — vision produit, features, métriques
- `docs/ITERATIONS.md` — décisions techniques et pourquoi
- `docs/STATUS.md` — état actuel, next steps, blockers

Ces fichiers sont aussi uploadés dans le Project claude.ai pour Cowork.
```

### 4. Uploader dans le Project claude.ai

Sur claude.ai → ton Project → **Add content** → upload les 3 fichiers.

---

## Workflow de mise à jour

### Après chaque milestone / feature livrée

1. Mettre à jour `docs/STATUS.md` (cases cochées, next steps)
2. Ajouter une entrée dans `docs/ITERATIONS.md` si décision importante
3. `git add docs/ && git commit -m "docs: update STATUS + ITERATIONS"`
4. `git push`
5. Re-uploader `STATUS.md` dans le Project claude.ai

### Règle simple
> **Claude Code met à jour les fichiers. Tu uploades sur Cowork.**

---

## Conventions

| Symbole | Signification |
|---------|--------------|
| ✅ | Terminé / En production |
| 🔄 | En cours |
| ⏳ | Planifié |
| ❌ | Bloqué / Inactif |

---

## Exemple de fichiers remplis

Voir les fichiers Kufinekk comme référence :
- `docs/PRD.md` — PRD complet d'une app BTP SaaS
- `docs/ITERATIONS.md` — 8 sprints avec toutes les décisions
- `docs/STATUS.md` — état à la date du 2026-04-11
