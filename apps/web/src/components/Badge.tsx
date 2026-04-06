import { COPY } from '@/lib/copy'
import clsx from 'clsx'

type StatutPointage = 'EN_COURS' | 'VALIDE' | 'ABSENT' | 'CORRIGE'
type StatutContrat  = 'PROVISOIRE' | 'ACTIF' | 'TERMINE'
type StatutCycle    = 'EN_COURS' | 'VALIDE' | 'PAYE' | 'ECHOUE'
type StatutChantier = 'ACTIF' | 'TERMINE' | 'EN_PAUSE'

type Statut = StatutPointage | StatutContrat | StatutCycle | StatutChantier

const styles: Record<string, string> = {
  // Pointage
  EN_COURS:   'bg-encours-light text-encours-text',
  VALIDE:     'bg-entree-light text-entree-text',
  ABSENT:     'bg-absent-light text-absent-text',
  CORRIGE:    'bg-provisoire-light text-provisoire-text',
  // Contrat
  PROVISOIRE: 'bg-encours-light text-encours-text',
  ACTIF:      'bg-entree-light text-entree-text',
  TERMINE:    'bg-surface-muted text-ink-faint',
  // Cycle
  PAYE:       'bg-entree-light text-entree-text',
  ECHOUE:     'bg-absent-light text-absent-text',
  // Chantier
  EN_PAUSE:   'bg-encours-light text-encours-text',
}

interface BadgeProps {
  statut: Statut | string
  size?: 'sm' | 'md'
}

export default function Badge({ statut, size = 'sm' }: BadgeProps) {
  const label = COPY.statuts[statut] ?? statut
  const style = styles[statut] ?? 'bg-gray-100 text-gray-500'

  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold rounded-full',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        style
      )}
    >
      {label}
    </span>
  )
}

/** Point coloré pour les listes */
export function StatusDot({ statut }: { statut: string }) {
  const colors: Record<string, string> = {
    EN_COURS:   'bg-encours',
    VALIDE:     'bg-entree',
    ABSENT:     'bg-absent',
    CORRIGE:    'bg-provisoire',
    PROVISOIRE: 'bg-encours',
    ACTIF:      'bg-entree',
    TERMINE:    'bg-ink-faint',
    PAYE:       'bg-entree',
    ECHOUE:     'bg-absent',
  }

  return (
    <span
      className={clsx(
        'inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full',
        colors[statut] ?? 'bg-gray-400'
      )}
    />
  )
}
