'use client'

import { useState, useRef, useTransition, useCallback, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  ScanLine,
} from 'lucide-react'
import { COPY, formatHeure } from '@/lib/copy'

const QrScanner = dynamic(() => import('@/components/QrScanner'), { ssr: false })

// ── Types ─────────────────────────────────────────────────

type Mode = 'entree' | 'sortie'
type Step = 'choice' | 'search' | 'confirm' | 'success' | 'error'

interface AgentResult {
  id: string
  matricule: string
  nom: string
  prenom: string
  telephone: string
  contratActif?: {
    id: string
    poste: string
    statut: string
    chantier: { nom: string }
  }
}

interface SuccessData {
  nom: string
  heure: string
  duree?: string
  montant?: number
}

// ── Helpers ───────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://kufinekk-production.up.railway.app'

async function searchAgent(telephone: string, token: string): Promise<AgentResult> {
  const res = await fetch(
    `${API_URL}/api/v1/agents/search?telephone=${encodeURIComponent(telephone)}`,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? COPY.errors.introuvable)
  return json.data
}

async function getCookie(name: string): Promise<string> {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : ''
}

async function postPointage(
  path: '/pointages/entree' | '/pointages/sortie',
  matricule: string,
  token: string
) {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ matricule }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? COPY.errors.serveur)
  return json.data
}

// ── Composants locaux ─────────────────────────────────────

function ModeButton({
  mode,
  onClick,
}: {
  mode: Mode
  onClick: () => void
}) {
  if (mode === 'entree') {
    return (
      <button onClick={onClick} className="btn-entree">
        <ArrowDown size={22} />
        Enregistrer l'entrée
      </button>
    )
  }
  return (
    <button onClick={onClick} className="btn-sortie">
      <ArrowUp size={22} />
      Valider la sortie
    </button>
  )
}

// ── Page principale ────────────────────────────────────────

export default function SaisiePage() {
  const [step, setStep] = useState<Step>('choice')
  const [mode, setMode] = useState<Mode>('entree')
  const [telephone, setTelephone] = useState('')
  const [agent, setAgent] = useState<AgentResult | null>(null)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()
  const [showScanner, setShowScanner] = useState(false)
  const [now, setNow] = useState('')
  const [nowTime, setNowTime] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Avoid hydration mismatch — render date/time only on client
  useEffect(() => {
    function tick() {
      setNow(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))
      setNowTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 10_000)
    return () => clearInterval(id)
  }, [])

  // Étape 1 → 2 : choisir le mode
  function handleChooseMode(m: Mode) {
    setMode(m)
    setTelephone('')
    setAgent(null)
    setErrorMsg('')
    setStep('search')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Étape 2 → 3 : rechercher l'agent
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!telephone.trim()) return

    startTransition(async () => {
      try {
        const token = await getCookie('kfn_token')
        let tel = telephone.trim().replace(/\s/g, '')
        if (!tel.startsWith('+')) tel = '+221' + tel

        const found = await searchAgent(tel, token)
        setAgent(found)
        setErrorMsg('')
        setStep('confirm')
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : COPY.errors.serveur)
      }
    })
  }

  // QR scan → pointer directement
  const handleQrScan = useCallback((matricule: string) => {
    setShowScanner(false)

    startTransition(async () => {
      try {
        const token = await getCookie('kfn_token')
        const path = mode === 'entree' ? '/pointages/entree' : '/pointages/sortie'
        const result = await postPointage(path, matricule, token)

        const heure = formatHeure(
          mode === 'entree' ? result.heureEntree : result.heureSortie
        )
        setSuccessData({
          nom: result.contrat?.agent
            ? `${result.contrat.agent.prenom} ${result.contrat.agent.nom}`
            : matricule,
          heure,
          montant: result.totalJournalierXof,
        })
        setErrorMsg('')
        setStep('success')

        setTimeout(() => {
          setStep('choice')
          setAgent(null)
          setTelephone('')
        }, 2500)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : COPY.errors.serveur)
        setStep('error')
      }
    })
  }, [mode])

  // Étape 3 → 4 : valider le pointage
  function handleConfirm() {
    if (!agent) return

    startTransition(async () => {
      try {
        const token = await getCookie('kfn_token')
        const path = mode === 'entree' ? '/pointages/entree' : '/pointages/sortie'
        const result = await postPointage(path, agent.matricule, token)

        const heure = formatHeure(
          mode === 'entree' ? result.heureEntree : result.heureSortie
        )
        setSuccessData({
          nom: `${agent.prenom} ${agent.nom}`,
          heure,
          montant: result.totalJournalierXof,
        })
        setErrorMsg('')
        setStep('success')

        setTimeout(() => {
          setStep('choice')
          setAgent(null)
          setTelephone('')
        }, 2500)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : COPY.errors.serveur)
        setStep('error')
      }
    })
  }

  // ── Rendu ──

  return (
    <div className="min-h-screen app-bg flex flex-col">

      {/* QR Scanner overlay */}
      {showScanner && (
        <QrScanner
          onScan={handleQrScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center h-14 px-4 border-b border-surface-soft bg-surface-card">
        {step === 'choice' ? (
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-ink-muted">
            <ArrowLeft size={18} />
            Retour
          </Link>
        ) : (
          <button
            onClick={() => {
              setStep(step === 'error' ? 'search' : step === 'confirm' ? 'search' : 'choice')
              setErrorMsg('')
            }}
            className="flex items-center gap-1.5 text-sm text-ink-muted"
          >
            <ArrowLeft size={18} />
            Retour
          </button>
        )}

        <h1 className="flex-1 text-center font-bold text-ink text-sm">
          {step === 'choice' && 'Pointer un agent'}
          {step === 'search' && (mode === 'entree' ? 'Enregistrer une entrée' : 'Enregistrer une sortie')}
          {step === 'confirm' && 'Confirmer'}
          {step === 'success' && ''}
          {step === 'error' && 'Erreur'}
        </h1>

        <div className="w-14" />
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 max-w-md mx-auto w-full">

        {/* ── ÉTAPE 1 : Choix entrée / sortie ── */}
        {step === 'choice' && (
          <div className="w-full space-y-4">
            <div className="text-center mb-8">
              <p className="text-ink-faint text-sm">{now || '\u00A0'}</p>
              <p className="text-ink font-bold text-lg font-stat mt-1">{nowTime || '\u00A0'}</p>
            </div>

            <ModeButton mode="entree" onClick={() => handleChooseMode('entree')} />
            <ModeButton mode="sortie" onClick={() => handleChooseMode('sortie')} />

            <Link
              href="/pointages"
              className="flex items-center justify-center gap-2 h-11 w-full text-sm text-ink-muted hover:text-ink mt-2"
            >
              Voir les présences du jour
              <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {/* ── ÉTAPE 2 : Saisie du numéro OU scan QR ── */}
        {step === 'search' && (
          <div className="w-full">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-chip text-sm font-semibold mb-6 ${
              mode === 'entree'
                ? 'bg-entree-light text-entree-text'
                : 'bg-sortie-light text-sortie-text'
            }`}>
              {mode === 'entree' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
              {mode === 'entree' ? 'Entrée' : 'Sortie'}
            </div>

            {/* Bouton Scanner QR */}
            <button
              onClick={() => setShowScanner(true)}
              className="w-full flex items-center justify-center gap-3 h-16 mb-6 rounded-card border-2 border-dashed border-brand-300 bg-brand-50 text-brand-700 font-semibold hover:bg-brand-100 transition-colors"
            >
              <ScanLine size={24} />
              Scanner le QR code
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-surface-soft" />
              <span className="text-xs text-ink-faint font-medium uppercase">ou</span>
              <div className="flex-1 h-px bg-surface-soft" />
            </div>

            <h2 className="text-lg font-bold text-ink mb-2">
              {COPY.actions.saisirNumero}
            </h2>
            <p className="text-sm text-ink-muted mb-4">
              Entrez le numéro de téléphone de l'agent
            </p>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="77 123 45 67"
                  className="input-field pl-12 text-lg"
                  disabled={isPending}
                  autoFocus
                />
              </div>

              {errorMsg && (
                <div role="alert" className="alert-error flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{errorMsg}</p>
                    {errorMsg === COPY.errors.introuvable && (
                      <Link
                        href="/agents/nouveau"
                        className="font-semibold underline mt-1 inline-block"
                      >
                        Créer cet agent →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!telephone.trim() || isPending}
                className={mode === 'entree' ? 'btn-entree' : 'btn-sortie'}
              >
                {isPending ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {COPY.loading.recherche}
                  </>
                ) : (
                  'Rechercher l\'agent'
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── ÉTAPE 3 : Confirmation ── */}
        {step === 'confirm' && agent && (
          <div className="w-full">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-chip text-sm font-semibold mb-6 ${
              mode === 'entree'
                ? 'bg-entree-light text-entree-text'
                : 'bg-sortie-light text-sortie-text'
            }`}>
              {mode === 'entree' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
              {mode === 'entree' ? 'Confirmer l\'entrée' : 'Confirmer la sortie'}
            </div>

            <div className="card p-5 mb-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="avatar-initials w-14 h-14 rounded-full text-xl">
                  {agent.prenom[0]}{agent.nom[0]}
                </div>
                <div>
                  <p className="font-bold text-ink text-lg leading-tight">
                    {agent.prenom} {agent.nom}
                  </p>
                  <p className="matricule">{agent.matricule}</p>
                </div>
              </div>

              {agent.contratActif && (
                <div className="border-t border-surface-soft pt-4 space-y-1.5">
                  <p className="text-sm text-ink-muted">
                    <span className="font-medium">Poste :</span> {agent.contratActif.poste}
                  </p>
                  <p className="text-sm text-ink-muted">
                    <span className="font-medium">Chantier :</span> {agent.contratActif.chantier.nom}
                  </p>
                  {agent.contratActif.statut === 'PROVISOIRE' && (
                    <p className="text-xs text-encours-text bg-encours-light px-2.5 py-1 rounded-chip inline-block mt-1">
                      Contrat en attente de validation — peut quand même pointer
                    </p>
                  )}
                </div>
              )}

              {!agent.contratActif && (
                <p className="text-sm text-absent border-t border-surface-soft pt-4">
                  Aucun contrat actif — cet agent ne peut pas pointer.
                </p>
              )}

              <div className="mt-4 border-t border-surface-soft pt-4">
                <p className="text-sm text-ink-muted">
                  Heure de {mode === 'entree' ? 'l\'entrée' : 'la sortie'}
                </p>
                <p className="text-2xl font-bold text-ink font-stat">
                  {nowTime || '\u00A0'}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div role="alert" className="alert-error flex items-start gap-2 mb-4">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={isPending || !agent.contratActif}
                className={mode === 'entree' ? 'btn-entree' : 'btn-sortie'}
              >
                {isPending ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {COPY.loading.enregistrement}
                  </>
                ) : (
                  mode === 'entree' ? COPY.actions.entree : COPY.actions.sortie
                )}
              </button>

              <button
                onClick={() => { setStep('search'); setErrorMsg('') }}
                className="btn-secondary w-full"
              >
                Ce n'est pas le bon agent
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 : Succès ── */}
        {step === 'success' && successData && (
          <div className="w-full text-center">
            <div className="flex items-center justify-center mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                mode === 'entree' ? 'bg-entree-light' : 'bg-sortie-light'
              }`}>
                <CheckCircle
                  size={44}
                  className={mode === 'entree' ? 'text-entree' : 'text-sortie'}
                />
              </div>
            </div>

            <h2 className="text-xl font-bold text-ink mb-1">
              {mode === 'entree' ? 'Entrée enregistrée' : 'Sortie enregistrée'}
            </h2>
            <p className="text-ink-muted text-base">
              {successData.nom} · {successData.heure}
            </p>
            {successData.montant != null && (
              <p className="text-lg font-bold text-entree-text font-stat mt-2">
                {successData.montant.toLocaleString('fr-FR')} XOF
              </p>
            )}

            <p className="text-sm text-ink-faint mt-6">Retour dans 2 secondes…</p>

            <button
              onClick={() => {
                setStep('choice')
                setAgent(null)
                setTelephone('')
              }}
              className="btn-primary mt-4"
            >
              {COPY.actions.pointerAutre}
            </button>
          </div>
        )}

        {/* ── ÉTAPE Erreur ── */}
        {step === 'error' && (
          <div className="w-full text-center">
            <div className="w-20 h-20 rounded-full bg-absent-light flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={44} className="text-absent" />
            </div>

            <h2 className="text-xl font-bold text-ink mb-2">Une erreur s'est produite</h2>
            <p className="text-ink-muted text-sm mb-6">{errorMsg}</p>

            <div className="space-y-3">
              <button
                onClick={() => { setStep('confirm'); setErrorMsg('') }}
                className="btn-primary"
              >
                {COPY.actions.reessayer}
              </button>
              <button
                onClick={() => { setStep('search'); setErrorMsg('') }}
                className="btn-secondary w-full"
              >
                Changer de numéro
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
