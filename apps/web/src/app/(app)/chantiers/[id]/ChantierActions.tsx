'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  chantierId: string
}

export default function ChantierActions({ chantierId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFermer() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/proxy/chantiers/${chantierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'TERMINE' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? 'Erreur serveur')
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) setError(null)
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        variant="destructive"
        size="lg"
        onClick={() => setOpen(true)}
      >
        <XCircle />
        Fermer le chantier
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fermer le chantier</DialogTitle>
          <DialogDescription>
            Cette action change le statut du chantier et bloque les pointages.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="bg-absent-light/60">
          <AlertTriangle />
          <AlertDescription className="text-ink">
            Fermer ce chantier passera son statut à <strong>TERMINÉ</strong>.
            Les agents ne pourront plus pointer. Cette action est réversible
            via l&apos;édition du chantier.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <XCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg">
              Annuler
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            size="lg"
            onClick={handleFermer}
            disabled={loading}
          >
            {loading ? 'Fermeture…' : 'Confirmer la fermeture'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
