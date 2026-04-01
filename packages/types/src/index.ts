// ── Enums ──────────────────────────────────────────────────────────────────

export type Role = 'MANAGER' | 'POINTEUR'
export type Plan = 'ESSENTIEL' | 'PRO' | 'ENTREPRISE'
export type TypeContrat = 'CONTRACTUEL' | 'NON_CONTRACTUEL'
export type StatutContrat = 'PROVISOIRE' | 'ACTIF' | 'TERMINE'
export type StatutPointage = 'EN_COURS' | 'VALIDE' | 'CORRIGE' | 'ABSENT'
export type StatutCycle = 'EN_COURS' | 'VALIDE' | 'PAYE' | 'ECHOUE'

// ── JWT Payload ────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string
  entrepriseId: string
  role: Role
  type: 'UTILISATEUR' | 'AGENT'
}

// ── Réponses API standard ──────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
}

export interface ApiList<T> {
  data: T[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

// ── Ressources ─────────────────────────────────────────────────────────────

export interface Agent {
  id: string
  matricule: string
  telephone: string
  nom: string
  prenom: string
  telephoneVerifie: boolean
  qrCodeUrl: string | null
  createdAt: string
}

export interface Chantier {
  id: string
  entrepriseId: string
  nom: string
  adresse: string | null
  dateDebut: string
  dateFinPrevue: string | null
  statut: string
  heureDebutStd: string
  seuilHeuresNormales: number
  createdAt: string
}

export interface Contrat {
  id: string
  agentId: string
  chantierId: string
  entrepriseId: string
  poste: string
  typeContrat: TypeContrat
  tauxJournalierXof: number
  tauxHeureSuppXof: number | null
  seuilHeuresNormales: number | null
  heureDebutStd: string | null
  dateDebut: string
  dateFin: string | null
  statut: StatutContrat
  createdAt: string
}

export interface Pointage {
  id: string
  contratId: string
  pointeParId: string
  dateJournee: string
  heureEntree: string
  heureSortie: string | null
  totalJournalierXof: number | null
  statut: StatutPointage
  corrigeLe: string | null
  noteCorrection: string | null
}

export interface CyclePaie {
  id: string
  contratId: string
  semaineDebut: string
  semaineFin: string
  totalHebdoXof: number
  statut: StatutCycle
  valideLe: string | null
  waveBatchId: string | null
  wavePayoutId: string | null
  waveStatut: string | null
  createdAt: string
}
