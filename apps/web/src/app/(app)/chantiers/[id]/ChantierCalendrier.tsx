'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, X, Clock, Download, XCircle } from 'lucide-react'
import { formatXof } from '@/lib/copy'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

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

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getSemaineActuelle(): string {
  const now = new Date()
  const dow = now.getDay()
  const diff = (dow + 2) % 7
  const fri = new Date(now)
  fri.setDate(now.getDate() - diff)
  return fri.toISOString().slice(0, 10)
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
  const cellWrap = (content: React.ReactNode, tip?: string) => (
    <TableCell className="px-1 py-1.5 text-center">
      {tip ? (
        <Tooltip>
          <TooltipTrigger asChild>{content as React.ReactElement}</TooltipTrigger>
          <TooltipContent>{tip}</TooltipContent>
        </Tooltip>
      ) : (
        content
      )}
    </TableCell>
  )

  if (!cell) {
    if (isFuture) {
      return cellWrap(
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted">
          <span className="text-xs text-ink-faint">—</span>
        </div>
      )
    }
    return cellWrap(
      <button
        onClick={() => isManager && onCorrect(day, agent, null)}
        disabled={!isManager}
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg border-2 border-dashed border-surface-soft transition-colors hover:border-ink-faint disabled:cursor-default"
      >
        <span className="text-xs text-ink-faint">⬜</span>
      </button>,
      isManager ? 'Marquer absent' : 'Aucun pointage'
    )
  }

  if (cell.statut === 'ABSENT') {
    return cellWrap(
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-absent-light">
        <X size={14} className="text-absent-text" />
      </div>,
      'Absent'
    )
  }

  if (cell.statut === 'EN_COURS') {
    return cellWrap(
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-encours-light">
        <Clock size={13} className="text-encours-text" />
      </div>,
      `En cours · entrée ${cell.heureEntree ? new Date(cell.heureEntree).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}`
    )
  }

  // VALIDE ou CORRIGE
  const tip = cell.heureEntree && cell.heureSortie
    ? `${new Date(cell.heureEntree).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} → ${new Date(cell.heureSortie).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}${cell.heuresSupp > 0 ? ` (+${cell.heuresSupp}h supp)` : ''}`
    : 'Présent'
  return cellWrap(
    <button
      onClick={() => isManager && onCorrect(day, agent, cell)}
      disabled={!isManager}
      className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-entree-light transition-colors hover:bg-entree-subtle disabled:cursor-default"
    >
      <Check size={14} className="text-entree-text" />
    </button>,
    tip
  )
}

// ── Popover de correction (Dialog shadcn) ─────────────

function CorrectionDialog({
  day,
  agent,
  cell,
  open,
  onOpenChange,
  onDone,
}: {
  day: string
  agent: AgentPresence
  cell: PresenceCell | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultEntree = cell?.heureEntree
    ? new Date(cell.heureEntree).toISOString().slice(11, 16)
    : '08:00'
  const defaultSortie = cell?.heureSortie
    ? new Date(cell.heureSortie).toISOString().slice(11, 16)
    : '17:00'

  const [heureEntree, setHeureEntree] = useState(defaultEntree)
  const [heureSortie, setHeureSortie] = useState(defaultSortie)
  const [note, setNote] = useState('')

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{agent.nom}</DialogTitle>
          <DialogDescription className="capitalize">{dayLabel}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <XCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Cas 1 : cellule vide → marquer absent */}
        {!cell && (
          <Button
            variant="destructive"
            size="lg"
            onClick={handleAbsence}
            disabled={loading}
            className="w-full justify-start gap-3"
          >
            <X />
            <span className="text-left">
              <span className="block font-bold">{loading ? 'Enregistrement…' : 'Marquer Absent'}</span>
              <span className="block text-xs font-normal opacity-80">Enregistre une absence manuelle</span>
            </span>
          </Button>
        )}

        {/* Cas 2 : cellule VALIDE/CORRIGE → corriger les heures */}
        {cell && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="entree" className="text-xs font-semibold text-ink">
                  Heure entrée
                </Label>
                <Input
                  id="entree"
                  type="time"
                  value={heureEntree}
                  onChange={(e) => setHeureEntree(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sortie" className="text-xs font-semibold text-ink">
                  Heure sortie
                </Label>
                <Input
                  id="sortie"
                  type="time"
                  value={heureSortie}
                  onChange={(e) => setHeureSortie(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="note" className="text-xs font-semibold text-ink">
                Note <span className="font-normal text-ink-faint">(optionnel)</span>
              </Label>
              <Input
                id="note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Motif de correction…"
                className="h-10"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg">Annuler</Button>
          </DialogClose>
          {cell && (
            <Button
              size="lg"
              onClick={handleCorrection}
              disabled={loading}
            >
              {loading ? 'Correction…' : 'Corriger'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <Card className="bg-surface-card p-0">
      {/* Navigation semaine */}
      <div className="flex items-center justify-between border-b border-surface-soft bg-surface-muted px-4 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate(shiftSemaine(semaine, -1))}
              disabled={!canGoPrev}
              aria-label="Semaine précédente"
            >
              <ChevronLeft />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Semaine précédente</TooltipContent>
        </Tooltip>

        <p className="text-sm font-bold text-ink">
          {formatSemaineLabel(semaineDebut, semaineFin)}
        </p>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate(shiftSemaine(semaine, 1))}
              disabled={!canGoNext}
              aria-label="Semaine suivante"
            >
              <ChevronRight />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Semaine suivante</TooltipContent>
        </Tooltip>
      </div>

      {/* Tableau */}
      {agents.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="font-semibold text-ink">Aucun agent actif cette semaine</p>
          <p className="mt-1 text-sm text-ink-faint">
            Rattachez des agents à ce chantier pour voir les présences.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-surface-soft hover:bg-transparent">
              <TableHead className="min-w-[160px] text-label uppercase text-ink-faint">
                Agent
              </TableHead>
              {weekDays.map((day, i) => (
                <TableHead
                  key={day}
                  className={`w-12 px-1 text-center text-label uppercase ${
                    day === today ? 'text-brand-600' : 'text-ink-faint'
                  }`}
                >
                  {DAY_LABELS[i]}
                  <br />
                  <span className="text-[10px] font-normal normal-case">
                    {new Date(day + 'T00:00:00Z').getUTCDate()}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-14 text-center text-label uppercase text-ink-faint">
                Jours
              </TableHead>
              <TableHead className="w-14 text-center text-label uppercase text-ink-faint">
                H.Supp
              </TableHead>
              <TableHead className="min-w-[100px] text-right text-label uppercase text-ink-faint">
                Semaine
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent, idx) => (
              <TableRow
                key={agent.agentId}
                className={`border-surface-soft ${idx % 2 === 0 ? 'bg-white' : 'bg-surface-app/40'} hover:bg-surface-muted/30`}
              >
                <TableCell className="py-2.5">
                  <p className="max-w-[150px] truncate text-sm font-semibold text-ink">{agent.nom}</p>
                  <p className="font-mono text-[11px] text-ink-faint">{agent.matricule}</p>
                </TableCell>

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

                <TableCell className="px-2 py-2.5 text-center">
                  <span className="font-stat text-sm font-bold text-ink">{agent.totalJours}</span>
                  <span className="text-xs text-ink-faint">j</span>
                </TableCell>
                <TableCell className="px-2 py-2.5 text-center">
                  <span className="font-stat text-sm font-bold text-ink">{agent.totalHeuresSupp}</span>
                  <span className="text-xs text-ink-faint">h</span>
                </TableCell>
                <TableCell className="py-2.5 text-right">
                  <span className="font-stat text-sm font-bold text-ink">
                    {formatXof(agent.totalSemaineXof)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-surface-soft bg-surface-muted px-4 py-3">
        {/* Légende */}
        <div className="flex flex-wrap items-center gap-3">
          <Legend
            color="bg-entree-light"
            icon={<Check size={10} className="text-entree-text" />}
            label="Présent"
          />
          <Separator orientation="vertical" className="h-4 bg-surface-soft" />
          <Legend
            color="bg-absent-light"
            icon={<X size={10} className="text-absent-text" />}
            label="Absent"
          />
          <Separator orientation="vertical" className="h-4 bg-surface-soft" />
          <Legend
            color="bg-encours-light"
            icon={<Clock size={10} className="text-encours-text" />}
            label="En cours"
          />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="gap-1.5 text-xs text-ink-faint opacity-50"
            >
              <Download size={13} />
              Exporter PDF
            </Button>
          </TooltipTrigger>
          <TooltipContent>Disponible prochainement</TooltipContent>
        </Tooltip>
      </div>

      {/* Dialog correction */}
      {popover && (
        <CorrectionDialog
          day={popover.day}
          agent={popover.agent}
          cell={popover.cell}
          open={!!popover}
          onOpenChange={(o) => !o && setPopover(null)}
          onDone={handlePopoverDone}
        />
      )}
    </Card>
  )
}

function Legend({ color, icon, label }: { color: string; icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex h-4 w-4 items-center justify-center rounded ${color}`}>
        {icon}
      </div>
      <span className="text-xs text-ink-faint">{label}</span>
    </div>
  )
}
