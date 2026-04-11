'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, X, Clock, Download } from 'lucide-react'
import { formatXof } from '@/lib/copy'

const DAY_LABELS = ['Ven', 'Sam', 'Dim', 'Lun', 'Mar', 'Mer', 'Jeu']

interface PresenceCell {
  statut: string
  pointageId: string
  heureEntree: string | null
  heureSortie: string | null
  heuresSupp: number
}

interface AgentPresence {
  agentId: string
  nom: string
  matricule: string
  contratId: string
  presences: Record<string, PresenceCell | null>
  totalJours: number
  totalHeuresSupp: number
  totalSemaineXof: number
}

interface Props {
  chantierId: string
  semaine: string       // YYYY-MM-DD (vendredi courant)
  semaineDebut: string  // YYYY-MM-DD
  semaineFin: string    // YYYY-MM-DD
  agents: AgentPresence[]
  isManager: boolean
}

// ── Helpers ───────────────────────────────────────────

function getWeekDays(debut: string): string[] {
  const days: string[] = []
  const friday = new Date(debut + 'T00:00:00Z')
  for (let i = 0; i < 7; i++) {
    const d = new Date(friday)
    d.setUTCDate(friday.getUTCDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function shiftSemaine(semaine: string, weeks: number): string {
  const d = new Date(semaine + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

function formatSemaineLabel(debut: string, fin: string): string {
  const d = new Date(debut + 'T00:00:00Z')
  const f = new Date(fin + 'T00:00:00Z')
  const debutStr = d.toLocaleDateString('fr-FR', { day: '2-digit', timeZone: 'UTC' })
  const finStr = f.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
  return `${debutStr} – ${finStr}`
}

function toLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

async function callProxy(path: string, method = 'POST', body?: object) {
  const res = await fetch(`/api/proxy/${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? 'Erreur serveur')
  return json
}

// ── Cell component ────────────────────────────────────

function CellPresence({
  day,
  cell,
  agent,
  isManager,
  isFuture,
  onCorrect,
}: {
  day: string
  cell: PresenceCell | null
  agent: AgentPresence
  isManager: boolean
  isFuture: boolean
  onCorrect: (day: string, agent: AgentPresence, cell: PresenceCell | null) => void
}) {
  if (!cell) {
    // Vide : jour passé ou futur sans pointage
    if (isFuture) {
      return (
        <td className="px-1 py-1.5 text-center">
          <div className="w-9 h-9 mx-auto rounded-lg bg-surface-muted flex items-center justify-center">
            <span className="text-xs text-ink-faint">—</span>
          </div>
        </td>
      )
    }
    return (
      <td className="px-1 py-1.5 text-center">
        <button
          onClick={() => isManager && onCorrect(day, agent, null)}
          disabled={!isManager}
          className="w-9 h-9 mx-auto rounded-lg border-2 border-dashed border-surface-soft flex items-center justify-center hover:border-ink-faint transition-colors disabled:cursor-default"
          title={isManager ? 'Marquer absent' : undefined}
        >
          <span className="text-xs text-ink-faint">⬜</span>
        </button>
      </td>
    )
  }

  if (cell.statut === 'ABSENT') {
    return (
      <td className="px-1 py-1.5 text-center">
        <div className="w-9 h-9 mx-auto rounded-lg bg-absent-light flex items-center justify-center">
          <X size={14} className="text-absent-text" />
        </div>
      </td>
    )
  }

  if (cell.statut === 'EN_COURS') {
    return (
      <td className="px-1 py-1.5 text-center">
        <div className="w-9 h-9 mx-auto rounded-lg bg-encours-light flex items-center justify-center">
          <Clock size={13} className="text-encours-text" />
        </div>
      </td>
    )
  }

  // VALIDE ou CORRIGE
  return (
    <td className="px-1 py-1.5 text-center">
      <button
        onClick={() => isManager && onCorrect(day, agent, cell)}
        disabled={!isManager}
        className="w-9 h-9 mx-auto rounded-lg bg-entree-light flex items-center justify-center hover:bg-entree-subtle transition-colors disabled:cursor-default group"
        title={isManager ? 'Corriger les heures' : undefined}
      >
        <Check size={14} className="text-entree-text" />
      </button>
    </td>
  )
}

// ── Popover de correction ─────────────────────────────

function CorrectionPopover({
  day,
  agent,
  cell,
  onClose,
  onDone,
}: {
  day: string
  agent: AgentPresence
  cell: PresenceCell | null
  onClose: () => void
  onDone: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pour marquer absent (cellule vide)
  async function handleAbsence() {
    setLoading(true)
    setError(null)
    try {
      await callProxy('pointages/absence', 'POST', {
        agentId: agent.agentId,
        dateJournee: day + 'T00:00:00.000Z',
      })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  // Pour corriger heures (cellule VALIDE/CORRIGE)
  const defaultEntree = cell?.heureEntree
    ? new Date(cell.heureEntree).toISOString().slice(11, 16)
    : '08:00'
  const defaultSortie = cell?.heureSortie
    ? new Date(cell.heureSortie).toISOString().slice(11, 16)
    : '17:00'

  const [heureEntree, setHeureEntree] = useState(defaultEntree)
  const [heureSortie, setHeureSortie] = useState(defaultSortie)
  const [note, setNote] = useState('')

  async function handleCorrection() {
    setLoading(true)
    setError(null)
    try {
      const dateBase = day + 'T'
      await callProxy(`pointages/${cell!.pointageId}/corriger`, 'PATCH', {
        heureEntree: dateBase + heureEntree + ':00.000Z',
        heureSortie: dateBase + heureSortie + ':00.000Z',
        noteCorrection: note || undefined,
      })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const dayLabel = new Date(day + 'T00:00:00Z').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-card shadow-2xl w-full max-w-sm animate-slide-up">
        <div className="px-5 py-4 border-b border-surface-soft">
          <p className="font-bold text-ink text-sm">{agent.nom}</p>
          <p className="text-xs text-ink-faint mt-0.5 capitalize">{dayLabel}</p>
        </div>

        <div className="p-5 space-y-4">
          {error && <div role="alert" className="alert-error text-sm">{error}</div>}

          {/* Cas 1 : cellule vide → marquer absent */}
          {!cell && (
            <button
              onClick={handleAbsence}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3 rounded-btn border-2 border-absent/40 bg-absent-light text-absent-text hover:bg-absent/20 transition-colors disabled:opacity-50"
            >
              <X size={18} className="flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold">{loading ? 'Enregistrement…' : 'Marquer Absent'}</p>
                <p className="text-xs font-normal opacity-75">Enregistre une absence manuelle</p>
              </div>
            </button>
          )}

          {/* Cas 2 : cellule VALIDE/CORRIGE → corriger les heures */}
          {cell && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Heure entrée</label>
                  <input
                    type="time"
                    value={heureEntree}
                    onChange={(e) => setHeureEntree(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Heure sortie</label>
                  <input
                    type="time"
                    value={heureSortie}
                    onChange={(e) => setHeureSortie(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Note <span className="text-ink-faint font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Motif de correction…"
                  className="input-field text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 btn-secondary text-sm">Annuler</button>
                <button
                  onClick={handleCorrection}
                  disabled={loading}
                  className="flex-1 btn-primary text-sm"
                >
                  {loading ? 'Correction…' : 'Corriger'}
                </button>
              </div>
            </>
          )}

          {/* Bouton fermer pour le cas absence */}
          {!cell && (
            <button onClick={onClose} className="w-full btn-secondary text-sm">Annuler</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────

export default function ChantierCalendrier({
  chantierId,
  semaine,
  semaineDebut,
  semaineFin,
  agents,
  isManager,
}: Props) {
  const router = useRouter()

  const [popover, setPopover] = useState<{
    day: string
    agent: AgentPresence
    cell: PresenceCell | null
  } | null>(null)

  const weekDays = getWeekDays(semaineDebut)
  const today = todayStr()

  // Limite : 8 semaines en arrière
  const minSemaine = shiftSemaine(semaine, -8)
  const canGoPrev = semaine > minSemaine
  // Pas de semaine future
  const canGoNext = semaine < getSemaineActuelle()

  function getSemaineActuelle(): string {
    const now = new Date()
    const dow = now.getDay()
    const diff = (dow + 2) % 7
    const fri = new Date(now)
    fri.setDate(now.getDate() - diff)
    return fri.toISOString().slice(0, 10)
  }

  function navigate(targetSemaine: string) {
    router.push(`/chantiers/${chantierId}?semaine=${targetSemaine}`)
  }

  function handleCellClick(day: string, agent: AgentPresence, cell: PresenceCell | null) {
    setPopover({ day, agent, cell })
  }

  function handlePopoverDone() {
    setPopover(null)
    router.refresh()
  }

  return (
    <div className="card overflow-hidden">
      {/* Navigation semaine */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-soft bg-surface-muted">
        <button
          onClick={() => navigate(shiftSemaine(semaine, -1))}
          disabled={!canGoPrev}
          className="p-1.5 rounded-btn hover:bg-surface-soft transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={18} className="text-ink-muted" />
        </button>

        <p className="text-sm font-bold text-ink">
          {formatSemaineLabel(semaineDebut, semaineFin)}
        </p>

        <button
          onClick={() => navigate(shiftSemaine(semaine, 1))}
          disabled={!canGoNext}
          className="p-1.5 rounded-btn hover:bg-surface-soft transition-colors disabled:opacity-30"
        >
          <ChevronRight size={18} className="text-ink-muted" />
        </button>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        {agents.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-semibold text-ink">Aucun agent actif cette semaine</p>
            <p className="text-sm text-ink-faint mt-1">Rattachez des agents à ce chantier pour voir les présences.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-soft">
                <th className="text-left px-4 py-2.5 text-label text-ink-faint uppercase font-bold min-w-[160px]">
                  Agent
                </th>
                {weekDays.map((day, i) => (
                  <th
                    key={day}
                    className={`text-center px-1 py-2.5 text-label uppercase font-bold w-12 ${
                      day === today ? 'text-brand-600' : 'text-ink-faint'
                    }`}
                  >
                    {DAY_LABELS[i]}
                    <br />
                    <span className="font-normal normal-case text-[10px]">
                      {new Date(day + 'T00:00:00Z').getUTCDate()}
                    </span>
                  </th>
                ))}
                <th className="text-center px-2 py-2.5 text-label text-ink-faint uppercase font-bold w-14">
                  Jours
                </th>
                <th className="text-center px-2 py-2.5 text-label text-ink-faint uppercase font-bold w-14">
                  H.Supp
                </th>
                <th className="text-right px-4 py-2.5 text-label text-ink-faint uppercase font-bold min-w-[100px]">
                  Semaine
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, idx) => (
                <tr
                  key={agent.agentId}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-surface-app/40'}
                >
                  {/* Nom agent */}
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-ink text-sm truncate max-w-[150px]">{agent.nom}</p>
                    <p className="text-[11px] text-ink-faint font-mono">{agent.matricule}</p>
                  </td>

                  {/* Cellules jour */}
                  {weekDays.map((day) => (
                    <CellPresence
                      key={day}
                      day={day}
                      cell={agent.presences[day]}
                      agent={agent}
                      isManager={isManager}
                      isFuture={day > today}
                      onCorrect={handleCellClick}
                    />
                  ))}

                  {/* Totaux */}
                  <td className="px-2 py-2.5 text-center">
                    <span className="text-sm font-bold text-ink font-stat">{agent.totalJours}</span>
                    <span className="text-xs text-ink-faint">j</span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className="text-sm font-bold text-ink font-stat">{agent.totalHeuresSupp}</span>
                    <span className="text-xs text-ink-faint">h</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-sm font-bold text-ink font-stat">
                      {formatXof(agent.totalSemaineXof)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-surface-soft bg-surface-muted">
        {/* Légende */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-entree-light flex items-center justify-center">
              <Check size={10} className="text-entree-text" />
            </div>
            <span className="text-xs text-ink-faint">Présent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-absent-light flex items-center justify-center">
              <X size={10} className="text-absent-text" />
            </div>
            <span className="text-xs text-ink-faint">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-encours-light flex items-center justify-center">
              <Clock size={10} className="text-encours-text" />
            </div>
            <span className="text-xs text-ink-faint">En cours</span>
          </div>
        </div>

        {/* Export PDF — désactivé pour l'instant */}
        <button
          disabled
          className="flex items-center gap-1.5 text-xs text-ink-faint opacity-50 cursor-not-allowed"
          title="Export PDF — disponible prochainement"
        >
          <Download size={13} />
          Exporter PDF
        </button>
      </div>

      {/* Popover correction */}
      {popover && (
        <CorrectionPopover
          day={popover.day}
          agent={popover.agent}
          cell={popover.cell}
          onClose={() => setPopover(null)}
          onDone={handlePopoverDone}
        />
      )}
    </div>
  )
}
