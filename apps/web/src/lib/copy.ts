export const COPY = {
  actions: {
    entree:       "Enregistrer l'entrée",
    sortie:       "Valider la sortie",
    valider:      "Valider",
    annuler:      "Annuler",
    creerAgent:   "Créer l'agent",
    rattacher:    "Rattacher au chantier",
    reessayer:    "Réessayer",
    saisirNumero: "Saisir le numéro",
    pointerAutre: "Pointer un autre agent",
    retour:       "Retour",
    nouveau:      "Nouveau",
  },

  errors: {
    qrInvalide:      "Badge non reconnu. Vérifiez que le QR code est bien visible.",
    dejaPointe:      (nom: string, heure: string) => `${nom} est déjà enregistré à ${heure}.`,
    contratTermine:  "Ce contrat est terminé. L'agent ne peut plus pointer.",
    introuvable:     "Numéro non trouvé dans Kufinekk.",
    horsLigne:       "Pas de connexion internet. Vérifiez votre réseau.",
    serveur:         "Une erreur s'est produite. Réessayez dans quelques secondes.",
    champRequis:     "Ce champ est obligatoire.",
    telephoneInvalide: "Numéro invalide. Format attendu : +221 XX XXX XX XX",
    montantInvalide: "Montant invalide. Entrez un nombre entier en XOF.",
    identifiantsInvalides: "Téléphone ou code PIN incorrect.",
  },

  success: {
    entree:         (nom: string, heure: string) => `Entrée enregistrée\n${nom} · ${heure}`,
    sortie:         (nom: string, duree: string, montant: string) =>
                      `Sortie enregistrée\n${nom} · ${duree} · ${montant} XOF`,
    agentCree:      (nom: string) => `Agent créé\nUn SMS a été envoyé à ${nom}.`,
    contratValide:  (nom: string) => `Contrat validé\n${nom} est maintenant actif.`,
    paiementEnvoye: "Paiement envoyé via Wave.",
    chantierCree:   "Chantier créé avec succès.",
  },

  loading: {
    connexion:       "Connexion en cours…",
    recherche:       "Recherche de l'agent…",
    enregistrement:  "Enregistrement…",
    envoi:           "Envoi en cours…",
    chargement:      "Chargement…",
    creation:        "Création en cours…",
  },

  empty: {
    agents: {
      title: "Aucun agent sur ce chantier",
      body:  "Ajoutez le premier agent pour commencer à pointer.",
      cta:   "+ Ajouter un agent",
    },
    presences: {
      title: "Aucune présence aujourd'hui",
      body:  "Les entrées du jour apparaîtront ici.",
    },
    chantiers: {
      title: "Aucun chantier actif",
      body:  "Créez votre premier chantier pour organiser les équipes.",
      cta:   "+ Créer un chantier",
    },
    cycles: {
      title: "Aucun cycle de paie",
      body:  "Les cycles sont créés automatiquement chaque vendredi.",
    },
  },

  statuts: {
    EN_COURS:   "En cours",
    VALIDE:     "Validé",
    ABSENT:     "Absent",
    CORRIGE:    "Corrigé",
    PROVISOIRE: "En attente",
    ACTIF:      "Actif",
    TERMINE:    "Terminé",
    PAYE:       "Payé",
    ECHOUE:     "Échoué",
  } as Record<string, string>,
} as const

/** Formate un montant en XOF avec espace milliers */
export function formatXof(montant: number): string {
  return `${montant.toLocaleString('fr-FR')} XOF`
}

/** Formate une heure ISO en HH:MM */
export function formatHeure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/** Calcule la durée entre deux ISO strings en "Xh YY" */
export function formatDuree(entree: string, sortie: string): string {
  const diffMs = new Date(sortie).getTime() - new Date(entree).getTime()
  const diffH = Math.floor(diffMs / 3_600_000)
  const diffMin = Math.floor((diffMs % 3_600_000) / 60_000)
  if (diffMin === 0) return `${diffH}h`
  return `${diffH}h${String(diffMin).padStart(2, '0')}`
}
