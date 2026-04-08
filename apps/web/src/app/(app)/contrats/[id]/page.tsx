import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { formatXof } from '@/lib/copy'
import Badge from '@/components/Badge'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, Clock, User } from 'lucide-react'
import ContratActions from './ContratActions'

interface ContratDetail {
  id: string
  poste: string
  typeContrat: 'CONTRACTUEL' | 'NON_CONTRACTUEL'
  statut: 'PROVISOIRE' | 'ACTIF' | 'TERMINE'
  tauxJournalierXof: number
  tauxHeureSuppXof?: number | null
  seuilHeuresNormales?: number | null
  heureDebutStd?: string | null
  dateDebut: string
  dateFin?: string | null
  noteCloture?: string | null
  createdAt: string
  agent: {
    id: string
    matricule: string
    telephone: string
    nom: string
    prenom: string
    qrCodeUrl?: string | null
  }
  chantier: {
    id: string
    nom: string
    adresse?: string | null
  }
  validePar?: {
    id: string
    nom: string
  } | null
}

interface Chantier {
  id: string
  nom: string
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function ContratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const token = await getToken()

  let contrat: ContratDetail | null = null
  let chantiers: Chantier[] = []
  let error: string | null = null

  try {
    const [contratRes, chantiersRes] = await Promise.all([
      apiFetch<{ data: ContratDetail }>(`/contrats/${id}`, { token }),
      apiFetch<{ data: Chantier[] }>('/chantiers?statut=ACTIF', { token }),
    ])
    contrat = contratRes.data
    chantiers = chantiersRes.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur'
  }

  const isActif = contrat?.statut === 'ACTIF' || contrat?.statut === 'PROVISOIRE'

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="mb-6">
        <Link
          href={contrat ? `/agents/${contrat.agent.id}` : '/agents'}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4"
        >
          <ArrowLeft size={16} />
          Retour au profil agent
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-ink">
              {contrat ? contrat.poste : 'Contrat'}
            </h1>
            {contrat && (
              <p className="text-sm text-ink-faint mt-0.5">
                {contrat.chantier.nom} · depuis le {fmt(contrat.dateDebut)}
              </p>
            )}
          </div>
          {contrat && <Badge statut={contrat.statut} />}
        </div>
      </div>

      {error && (
        <div role="alert" className="alert-error mb-5">{error}</div>
      )}

      {contrat && (
        /* ── Layout horizontal desktop ─────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">

          {/* ── Colonne gauche : Agent + QR ────────────────── */}
          <div className="space-y-4">

            {/* Profil agent */}
            <div className="card p-5">
              <h2 className="text-xs font-bold text-ink-faint uppercase tracking-wide mb-3">Agent</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="avatar-initials w-12 h-12 rounded-full text-lg flex-shrink-0">
                  {contrat.agent.prenom[0]}{contrat.agent.nom[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-ink truncate">{contrat.agent.prenom} {contrat.agent.nom}</p>
                  <p className="matricule text-sm">{contrat.agent.matricule}</p>
                </div>
              </div>
              <div className="space-y-2 border-t border-surface-soft pt-3">
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <User size={14} className="text-ink-faint flex-shrink-0" />
                  <span>{contrat.agent.telephone}</span>
                </div>
              </div>
              <Link
                href={`/agents/${contrat.agent.id}`}
                className="mt-3 block text-center text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Voir le profil complet →
              </Link>
            </div>

            {/* QR Code */}
            <ContratActions
              contrat={contrat}
              chantiers={chantiers}
              mode="qr"
            />
          </div>

          {/* ── Colonne droite : Détails + Actions ─────────── */}
          <div className="space-y-4">

            {/* Détails du contrat */}
            <div className="card p-5">
              <h2 className="text-xs font-bold text-ink-faint uppercase tracking-wide mb-4">Détails du contrat</h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Chantier */}
                <div className="col-span-2">
                  <p className="text-label text-ink-faint uppercase mb-0.5">Chantier</p>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-ink-faint flex-shrink-0" />
                    <Link href={`/chantiers/${contrat.chantier.id}`} className="text-sm font-semibold text-ink hover:text-brand-600">
                      {contrat.chantier.nom}
                    </Link>
                  </div>
                  {contrat.chantier.adresse && (
                    <p className="text-xs text-ink-faint mt-0.5 ml-5">{contrat.chantier.adresse}</p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <p className="text-label text-ink-faint uppercase mb-0.5">Type</p>
                  <p className="text-sm font-semibold text-ink">
                    {contrat.typeContrat === 'CONTRACTUEL' ? 'Contractuel' : 'Non-contractuel'}
                  </p>
                </div>

                {/* Poste */}
                <div>
                  <p className="text-label text-ink-faint uppercase mb-0.5">Poste</p>
                  <p className="text-sm font-semibold text-ink">{contrat.poste}</p>
                </div>

                {/* Taux journalier */}
                <div>
                  <p className="text-label text-ink-faint uppercase mb-0.5">Taux journalier</p>
                  <p className="text-base font-bold text-ink font-stat">{formatXof(contrat.tauxJournalierXof)}</p>
                </div>

                {/* Taux heures supp */}
                <div>
                  <p className="text-label text-ink-faint uppercase mb-0.5">Taux h. supp.</p>
                  <p className="text-base font-bold text-ink font-stat">
                    {contrat.tauxHeureSuppXof ? `${formatXof(contrat.tauxHeureSuppXof)}/h` : '—'}
                  </p>
                </div>

                {/* Seuil heures normales */}
                {contrat.seuilHeuresNormales && (
                  <div>
                    <p className="text-label text-ink-faint uppercase mb-0.5">Seuil heures norm.</p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-ink-faint" />
                      <p className="text-sm text-ink">{contrat.seuilHeuresNormales}h/jour</p>
                    </div>
                  </div>
                )}

                {/* Heure début std */}
                {contrat.heureDebutStd && (
                  <div>
                    <p className="text-label text-ink-faint uppercase mb-0.5">Heure début</p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-ink-faint" />
                      <p className="text-sm text-ink">{contrat.heureDebutStd}</p>
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div>
                  <p className="text-label text-ink-faint uppercase mb-0.5">Début</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-ink-faint" />
                    <p className="text-sm text-ink">{fmt(contrat.dateDebut)}</p>
                  </div>
                </div>

                {contrat.dateFin && (
                  <div>
                    <p className="text-label text-ink-faint uppercase mb-0.5">Fin</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-ink-faint" />
                      <p className="text-sm text-ink">{fmt(contrat.dateFin)}</p>
                    </div>
                  </div>
                )}

                {/* Validé par */}
                {contrat.validePar && (
                  <div className="col-span-2">
                    <p className="text-label text-ink-faint uppercase mb-0.5">Validé par</p>
                    <p className="text-sm text-ink">{contrat.validePar.nom}</p>
                  </div>
                )}

                {/* Note clôture */}
                {contrat.noteCloture && (
                  <div className="col-span-2 bg-surface-muted rounded-btn px-3 py-2">
                    <p className="text-label text-ink-faint uppercase mb-0.5">Note de clôture</p>
                    <p className="text-sm text-ink">{contrat.noteCloture}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions (valider / transférer / terminer) */}
            {isActif && (
              <ContratActions
                contrat={contrat}
                chantiers={chantiers}
                mode="actions"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
