'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  MapPin,
  HardHat,
  Calendar,
  Banknote,
  Plus,
  Trash2,
  Info,
  LayoutDashboard,
  ScanLine,
  FileText,
  Send,
} from 'lucide-react'
import { sendOtpAction, verifyOtpAction, registerAction } from './actions'

// ── Types & steps ────────────────────────────────────────────────────────────
type StepId = 'compte' | 'otp' | 'entreprise' | 'chantier' | 'pointeur' | 'agents' | 'pret'

interface Step {
  id: StepId
  label: string
  title: string
  sub: string
}

const STEPS: Step[] = [
  { id: 'compte', label: 'Compte', title: 'Créez votre compte', sub: "Un numéro de téléphone et un mot de passe. C'est tout." },
  { id: 'otp', label: 'Vérification', title: 'Entrez le code SMS', sub: "Nous venons d'envoyer un code à 6 chiffres." },
  { id: 'entreprise', label: 'Entreprise', title: 'Parlez-nous de votre entreprise', sub: 'Ces infos apparaîtront sur les feuilles de paie et les factures.' },
  { id: 'chantier', label: 'Chantier', title: 'Créez votre premier chantier', sub: 'Vous pourrez en ajouter autant que vous voulez ensuite.' },
  { id: 'pointeur', label: 'Pointeur', title: 'Ajoutez un pointeur', sub: 'Le pointeur enregistre les entrées/sorties sur le chantier.' },
  { id: 'agents', label: 'Agents', title: 'Ajoutez vos premiers agents', sub: 'Commencez avec 3-4 agents, vous ajouterez les autres plus tard.' },
  { id: 'pret', label: 'Prêt', title: 'Tout est prêt', sub: 'Votre compte Kufinekk est configuré.' },
]

interface FormData {
  prenom: string
  nom: string
  telephone: string
  password: string
  accept: boolean
  otp: string[]
  raison: string
  ninea: string
  ville: string
  taille: string
  chantier_nom: string
  chantier_adresse: string
  chantier_debut: string
  chantier_taux: string
  pointeur_prenom: string
  pointeur_nom: string
  pointeur_tel: string
  pointeur_pin: string
  addPointeur: boolean
  agents: Array<{ prenom: string; nom: string; telephone: string; poste: string; taux: string }>
}

const TAILLES = ['1–5 agents', '6–20 agents', '21–50 agents', '50+ agents']

// ── Logo wordmark ────────────────────────────────────────────────────────────
function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <div
        className="flex items-center justify-center bg-brand-600 text-white font-display font-extrabold shadow-float"
        style={{ width: size, height: size, borderRadius: size * 0.33, fontSize: size * 0.58 }}
      >
        K
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display font-extrabold uppercase tracking-wider text-ink" style={{ fontSize: size * 0.48 }}>
          Kufinekk
        </span>
        <span className="font-sans font-semibold text-[10px] uppercase tracking-[0.12em] text-ink-faint mt-0.5">
          Pointage BTP
        </span>
      </div>
    </div>
  )
}

// ── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ currentIdx }: { currentIdx: number }) {
  return (
    <div className="flex items-center gap-0 max-w-3xl mx-auto px-2">
      {STEPS.map((s, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-stat font-bold text-[13px] transition-all ${
                  done
                    ? 'bg-entree text-white'
                    : active
                    ? 'bg-brand-600 text-white ring-[6px] ring-brand-600/10 border-2 border-brand-600'
                    : 'bg-white text-ink-faint border border-surface-soft'
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <div className={`font-display font-bold text-[11px] tracking-[0.12em] uppercase whitespace-nowrap ${active ? 'text-ink' : 'text-ink-faint'}`}>
                {s.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 rounded ${done ? 'bg-entree' : 'bg-surface-soft'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── StepShell ────────────────────────────────────────────────────────────────
function StepShell({
  title,
  sub,
  side,
  children,
}: {
  title: string
  sub: React.ReactNode
  side?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className={`grid gap-12 items-start mx-auto ${side ? 'lg:grid-cols-[1.1fr_0.9fr] max-w-[1080px]' : 'max-w-[560px]'}`}
    >
      <div>
        <h1 className="font-display font-extrabold uppercase tracking-tight text-ink leading-[1.05] text-[clamp(32px,4vw,44px)]">
          {title}
        </h1>
        <p className="font-sans text-base text-ink-muted mt-3 leading-relaxed">{sub}</p>
        <div className="mt-8">{children}</div>
      </div>
      {side && <div>{side}</div>}
    </div>
  )
}

// ── Input helpers ────────────────────────────────────────────────────────────
function KLabel({ children }: { children: React.ReactNode }) {
  return <label className="font-sans font-semibold text-[13px] text-ink">{children}</label>
}

function KField({
  label,
  help,
  error,
  prefix,
  suffix,
  icon,
  children,
}: {
  label?: string
  help?: string
  error?: string
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <KLabel>{label}</KLabel>}
      <div
        className={`flex items-center h-[52px] rounded-btn border-[1.5px] overflow-hidden bg-surface-muted focus-within:bg-white focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/10 transition ${
          error ? 'border-absent' : 'border-surface-soft'
        }`}
      >
        {icon && <span className="flex pl-3.5 text-ink-faint">{icon}</span>}
        {prefix && (
          <span className="px-3.5 py-0 self-stretch flex items-center font-sans font-semibold text-[15px] text-ink-muted border-r border-surface-soft">
            {prefix}
          </span>
        )}
        {children}
        {suffix && <span className="pr-3.5 font-sans font-semibold text-[13px] text-ink-faint">{suffix}</span>}
      </div>
      {help && !error && <p className="text-xs text-ink-faint font-sans">{help}</p>}
      {error && <p className="text-xs text-absent-text font-sans font-medium">{error}</p>}
    </div>
  )
}

const inputClass =
  'flex-1 border-0 outline-none bg-transparent h-full px-4 font-sans text-[15px] text-ink placeholder:text-ink-faint/70'

// ── Button primary ───────────────────────────────────────────────────────────
function KBtn({
  variant = 'primary',
  children,
  onClick,
  type = 'button',
  disabled,
  iconRight,
  iconLeft,
  fullWidth,
  className,
}: {
  variant?: 'primary' | 'ghost' | 'outline'
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  iconRight?: React.ReactNode
  iconLeft?: React.ReactNode
  fullWidth?: boolean
  className?: string
}) {
  const base =
    'inline-flex items-center justify-center gap-2.5 h-[60px] px-7 rounded-btn font-display font-bold text-base uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'
  const variants = {
    primary: 'bg-brand-600 text-white shadow-float hover:bg-brand-700 hover:-translate-y-px',
    ghost: 'bg-transparent text-ink font-sans font-semibold normal-case tracking-normal hover:bg-ink/5',
    outline: 'bg-transparent text-ink border-2 border-dark font-sans font-semibold normal-case tracking-normal hover:border-ink',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
}

// ── Main wizard ──────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FormData>({
    prenom: '',
    nom: '',
    telephone: '',
    password: '',
    accept: true,
    otp: ['', '', '', '', '', ''],
    raison: '',
    ninea: '',
    ville: '',
    taille: '6–20 agents',
    chantier_nom: '',
    chantier_adresse: '',
    chantier_debut: new Date().toISOString().slice(0, 10),
    chantier_taux: '12500',
    pointeur_prenom: '',
    pointeur_nom: '',
    pointeur_tel: '',
    pointeur_pin: '',
    addPointeur: true,
    agents: [{ prenom: '', nom: '', telephone: '', poste: '', taux: '12500' }],
  })

  const set = (patch: Partial<FormData>) => setData((d) => ({ ...d, ...patch }))
  const step = STEPS[idx]

  const phoneFull = `+221${data.telephone.replace(/\s/g, '')}`

  const next = () => setIdx((i) => Math.min(i + 1, STEPS.length - 1))
  const back = () => (idx === 0 ? router.push('/') : setIdx((i) => Math.max(i - 1, 0)))

  // Compte → send OTP → go to OTP step
  const submitCompte = () => {
    setError(null)
    if (!data.prenom || !data.nom || !data.telephone || data.password.length < 8) {
      setError('Tous les champs sont requis (mot de passe min. 8 caractères)')
      return
    }
    startTransition(async () => {
      const res = await sendOtpAction(phoneFull)
      if (!res.ok) {
        setError(res.error ?? 'Erreur')
        return
      }
      next()
    })
  }

  // OTP → vérification immédiate côté serveur, puis avance
  const submitOtp = () => {
    const code = data.otp.join('')
    if (code.length !== 6) {
      setError('Entrez le code à 6 chiffres')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await verifyOtpAction(phoneFull, code)
      if (!res.ok) {
        setError(res.error ?? 'Code invalide')
        return
      }
      next()
    })
  }

  // Étape finale avant écran "prêt" : register
  const submitAgents = () => {
    setError(null)
    const validAgents = data.agents.filter((a) => a.prenom && a.nom && a.poste)
    startTransition(async () => {
      const payload = {
        prenom: data.prenom,
        nom: data.nom,
        telephone: phoneFull,
        motDePasse: data.password,
        otpCode: data.otp.join(''),
        raisonSociale: data.raison,
        ninea: data.ninea || undefined,
        ville: data.ville || undefined,
        taille: data.taille || undefined,
        chantierNom: data.chantier_nom,
        chantierAdresse: data.chantier_adresse || undefined,
        chantierDebut: data.chantier_debut,
        chantierTauxJournalier: parseInt(data.chantier_taux.replace(/\s/g, ''), 10) || 0,
        pointeur:
          data.addPointeur && data.pointeur_prenom && data.pointeur_tel && data.pointeur_pin.length === 4
            ? {
                prenom: data.pointeur_prenom,
                nom: data.pointeur_nom,
                telephone: `+221${data.pointeur_tel.replace(/\s/g, '')}`,
                pin: data.pointeur_pin,
              }
            : undefined,
        agents: validAgents.map((a) => ({
          prenom: a.prenom,
          nom: a.nom,
          telephone: a.telephone ? `+221${a.telephone.replace(/\s/g, '')}` : undefined,
          poste: a.poste,
          tauxJournalierXof: parseInt(a.taux.replace(/\s/g, ''), 10) || 0,
        })),
      }
      const res = await registerAction(payload)
      if (!res.ok) {
        setError(res.error ?? 'Erreur inscription')
        return
      }
      next()
    })
  }

  const finish = () => {
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-surface-app flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 bg-surface-app z-10 border-b border-surface-soft">
        <div className="max-w-[1240px] mx-auto px-8 py-3.5 flex items-center justify-between">
          <Wordmark size={32} />
          <div className="flex items-center gap-4">
            <div className="hidden sm:block font-display font-bold text-xs tracking-[0.12em] uppercase text-ink-faint">
              Étape {idx + 1} sur {STEPS.length}
            </div>
            <Link
              href="/"
              className="h-9 px-3.5 rounded-lg bg-transparent border border-surface-soft font-sans font-semibold text-[13px] text-ink-muted inline-flex items-center gap-1.5 hover:bg-white"
            >
              <X className="w-3.5 h-3.5" /> Quitter
            </Link>
          </div>
        </div>
        <div className="px-8 pt-6 pb-5 overflow-x-auto">
          <Stepper currentIdx={idx} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-14 pb-20">
       <div key={idx} className="animate-slide-up">
        {step.id === 'compte' && (
          <StepShell title={step.title} sub={step.sub}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submitCompte()
              }}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <KField label="Prénom">
                  <input className={inputClass} placeholder="Abdoulaye" value={data.prenom} onChange={(e) => set({ prenom: e.target.value })} />
                </KField>
                <KField label="Nom">
                  <input className={inputClass} placeholder="Diallo" value={data.nom} onChange={(e) => set({ nom: e.target.value })} />
                </KField>
              </div>
              <KField label="Numéro de téléphone" prefix="+221" help="Ce numéro vous servira à vous connecter.">
                <input
                  className={inputClass}
                  placeholder="77 123 45 67"
                  type="tel"
                  value={data.telephone}
                  onChange={(e) => set({ telephone: e.target.value })}
                />
              </KField>
              <KField label="Mot de passe" help="8 caractères minimum.">
                <input className={inputClass} type="password" placeholder="••••••••" value={data.password} onChange={(e) => set({ password: e.target.value })} />
              </KField>
              <label className="flex gap-2.5 items-start font-sans text-[13px] text-ink-muted mt-1">
                <input
                  type="checkbox"
                  checked={data.accept}
                  onChange={(e) => set({ accept: e.target.checked })}
                  className="mt-1 accent-brand-600"
                />
                <span>
                  J&apos;accepte les <a className="text-brand-600 font-semibold">conditions générales</a> et la{' '}
                  <a className="text-brand-600 font-semibold">politique de confidentialité</a>.
                </span>
              </label>
              {error && <p className="text-sm text-absent-text font-sans">{error}</p>}
              <div className="flex gap-2.5 mt-2">
                <KBtn variant="ghost" onClick={back} iconLeft={<ArrowLeft className="w-4.5 h-4.5" />}>Retour</KBtn>
                <KBtn type="submit" className="flex-1" disabled={isPending || !data.accept} iconRight={<ArrowRight className="w-4.5 h-4.5" />}>
                  {isPending ? 'Envoi…' : 'Recevoir le code SMS'}
                </KBtn>
              </div>
            </form>
          </StepShell>
        )}

        {step.id === 'otp' && <StepOtp data={data} set={set} next={submitOtp} back={back} error={error} isPending={isPending} />}

        {step.id === 'entreprise' && (
          <StepShell title={step.title} sub={step.sub}>
            <form onSubmit={(e) => { e.preventDefault(); setError(null); if (!data.raison) { setError('Raison sociale requise'); return } next() }} className="flex flex-col gap-4">
              <KField label="Raison sociale">
                <input className={inputClass} placeholder="Bâtiments & Co SARL" value={data.raison} onChange={(e) => set({ raison: e.target.value })} />
              </KField>
              <div className="grid grid-cols-2 gap-3">
                <KField label="NINEA" help="Numéro d'identification national">
                  <input className={inputClass} placeholder="0061234567" value={data.ninea} onChange={(e) => set({ ninea: e.target.value })} />
                </KField>
                <KField label="Ville">
                  <input className={inputClass} placeholder="Dakar" value={data.ville} onChange={(e) => set({ ville: e.target.value })} />
                </KField>
              </div>
              <div>
                <KLabel>Taille de l&apos;entreprise</KLabel>
                <div className="flex gap-2 flex-wrap mt-2">
                  {TAILLES.map((s) => {
                    const active = data.taille === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set({ taille: s })}
                        className={`h-11 px-4.5 rounded-chip border-[1.5px] font-sans font-semibold text-[13px] transition ${
                          active ? 'bg-brand-100 text-brand-700 border-brand-600' : 'bg-white text-ink border-surface-soft hover:border-brand-600/50'
                        }`}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
              {error && <p className="text-sm text-absent-text">{error}</p>}
              <div className="flex gap-2.5 mt-4">
                <KBtn variant="ghost" onClick={back} iconLeft={<ArrowLeft className="w-4.5 h-4.5" />}>Retour</KBtn>
                <KBtn type="submit" className="flex-1" iconRight={<ArrowRight className="w-4.5 h-4.5" />}>Continuer</KBtn>
              </div>
            </form>
          </StepShell>
        )}

        {step.id === 'chantier' && (
          <StepShell title={step.title} sub={step.sub} side={<ChantierPreview data={data} />}>
            <form onSubmit={(e) => { e.preventDefault(); setError(null); if (!data.chantier_nom) { setError('Nom du chantier requis'); return } next() }} className="flex flex-col gap-4">
              <KField label="Nom du chantier">
                <input className={inputClass} placeholder="Résidence Almadies 3" value={data.chantier_nom} onChange={(e) => set({ chantier_nom: e.target.value })} />
              </KField>
              <KField label="Adresse" icon={<MapPin className="w-4 h-4" />}>
                <input className={inputClass} placeholder="Route de Ngor, Dakar" value={data.chantier_adresse} onChange={(e) => set({ chantier_adresse: e.target.value })} />
              </KField>
              <div className="grid grid-cols-2 gap-3">
                <KField label="Date de démarrage">
                  <input className={inputClass} type="date" value={data.chantier_debut} onChange={(e) => set({ chantier_debut: e.target.value })} />
                </KField>
                <KField label="Taux journalier par défaut" suffix="XOF" help="Modifiable par agent">
                  <input className={inputClass} placeholder="12 500" value={data.chantier_taux} onChange={(e) => set({ chantier_taux: e.target.value })} />
                </KField>
              </div>
              {error && <p className="text-sm text-absent-text">{error}</p>}
              <div className="flex gap-2.5 mt-4">
                <KBtn variant="ghost" onClick={back} iconLeft={<ArrowLeft className="w-4.5 h-4.5" />}>Retour</KBtn>
                <KBtn type="submit" className="flex-1" iconRight={<ArrowRight className="w-4.5 h-4.5" />}>Créer le chantier</KBtn>
              </div>
            </form>
          </StepShell>
        )}

        {step.id === 'pointeur' && (
          <StepShell title={step.title} sub={step.sub}>
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2.5 font-sans text-sm text-ink-muted">
                <input type="checkbox" checked={data.addPointeur} onChange={(e) => set({ addPointeur: e.target.checked })} className="accent-brand-600" />
                <span>Ajouter un pointeur maintenant (vous pourrez le faire plus tard)</span>
              </label>
              {data.addPointeur && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <KField label="Prénom"><input className={inputClass} placeholder="Cheikh" value={data.pointeur_prenom} onChange={(e) => set({ pointeur_prenom: e.target.value })} /></KField>
                    <KField label="Nom"><input className={inputClass} placeholder="Sarr" value={data.pointeur_nom} onChange={(e) => set({ pointeur_nom: e.target.value })} /></KField>
                  </div>
                  <KField label="Téléphone du pointeur" prefix="+221" help="Il recevra ses identifiants par SMS.">
                    <input className={inputClass} type="tel" placeholder="77 987 65 43" value={data.pointeur_tel} onChange={(e) => set({ pointeur_tel: e.target.value })} />
                  </KField>
                  <KField label="Code PIN à 4 chiffres" help="Le pointeur pourra le modifier à sa première connexion.">
                    <input
                      className={inputClass + ' tracking-[0.5em] font-stat font-bold text-lg'}
                      type="text"
                      maxLength={4}
                      placeholder="4231"
                      value={data.pointeur_pin}
                      onChange={(e) => set({ pointeur_pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    />
                  </KField>
                </>
              )}
              <div className="flex gap-2.5 mt-4">
                <KBtn variant="ghost" onClick={back} iconLeft={<ArrowLeft className="w-4.5 h-4.5" />}>Retour</KBtn>
                <KBtn onClick={next} className="flex-1" iconRight={<ArrowRight className="w-4.5 h-4.5" />}>
                  Continuer
                </KBtn>
              </div>
            </div>
          </StepShell>
        )}

        {step.id === 'agents' && (
          <StepShell title={step.title} sub={step.sub}>
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-[40px_1.2fr_1.2fr_1.2fr_1fr_40px] gap-2 font-display font-bold text-[11px] tracking-[0.12em] uppercase text-ink-faint px-1">
                <span />
                <span>Prénom</span>
                <span>Nom</span>
                <span>Poste</span>
                <span>Taux / jour</span>
                <span />
              </div>
              {data.agents.map((r, i) => (
                <div key={i} className="grid grid-cols-[40px_1.2fr_1.2fr_1.2fr_1fr_40px] gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => set({ agents: data.agents.filter((_, j) => j !== i) })}
                    className="w-10 h-[52px] rounded-xl border-[1.5px] border-surface-soft bg-white text-ink-faint inline-flex items-center justify-center hover:text-absent"
                    aria-label="Supprimer l'agent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <KField><input className={inputClass} placeholder="Prénom" value={r.prenom} onChange={(e) => { const n = [...data.agents]; n[i] = { ...n[i], prenom: e.target.value }; set({ agents: n }) }} /></KField>
                  <KField><input className={inputClass} placeholder="Nom" value={r.nom} onChange={(e) => { const n = [...data.agents]; n[i] = { ...n[i], nom: e.target.value }; set({ agents: n }) }} /></KField>
                  <KField><input className={inputClass} placeholder="Maçon" value={r.poste} onChange={(e) => { const n = [...data.agents]; n[i] = { ...n[i], poste: e.target.value }; set({ agents: n }) }} /></KField>
                  <KField suffix="XOF"><input className={inputClass} placeholder="12 500" value={r.taux} onChange={(e) => { const n = [...data.agents]; n[i] = { ...n[i], taux: e.target.value }; set({ agents: n }) }} /></KField>
                  <span />
                </div>
              ))}
              <button
                type="button"
                onClick={() => set({ agents: [...data.agents, { prenom: '', nom: '', telephone: '', poste: '', taux: '12500' }] })}
                className="h-[52px] rounded-btn border-2 border-dashed border-brand-300 bg-brand-50 text-brand-700 font-sans font-semibold text-sm inline-flex items-center justify-center gap-2 mt-1 hover:bg-brand-100/50"
              >
                <Plus className="w-4 h-4" /> Ajouter un agent
              </button>
              <div className="mt-7 p-4 bg-entree-light rounded-btn border border-entree-subtle flex gap-3 items-start">
                <Info className="w-[18px] h-[18px] text-entree shrink-0 mt-0.5" />
                <div className="font-sans text-[13px] text-entree-deep leading-relaxed">
                  <b>Contrats provisoires.</b> Vos agents sont enregistrés en « provisoire » et peuvent pointer dès le jour 1. Vous régulariserez les contrats plus tard.
                </div>
              </div>
              {error && <p className="text-sm text-absent-text mt-2">{error}</p>}
              <div className="flex gap-2.5 mt-7 flex-wrap">
                <KBtn variant="ghost" onClick={back} iconLeft={<ArrowLeft className="w-4.5 h-4.5" />}>Retour</KBtn>
                <KBtn variant="outline" onClick={() => { set({ agents: [] }); submitAgents() }} disabled={isPending}>Passer pour l&apos;instant</KBtn>
                <KBtn onClick={submitAgents} disabled={isPending} className="flex-1" iconRight={<ArrowRight className="w-4.5 h-4.5" />}>
                  {isPending ? 'Création du compte…' : 'Créer mon compte'}
                </KBtn>
              </div>
            </div>
          </StepShell>
        )}

        {step.id === 'pret' && <StepPret onFinish={finish} />}
       </div>
      </div>

      <div className="border-t border-surface-soft px-8 py-4 font-sans text-xs text-ink-faint flex justify-between items-center flex-wrap gap-2">
        <span>Vos données sont chiffrées. Vous pouvez quitter et reprendre plus tard.</span>
        <span>
          Aide · WhatsApp <b>+221 33 XXX XX XX</b>
        </span>
      </div>
    </div>
  )
}

// ── StepOtp ──────────────────────────────────────────────────────────────────
function StepOtp({
  data,
  set,
  next,
  back,
  error,
  isPending,
}: {
  data: FormData
  set: (p: Partial<FormData>) => void
  next: () => void
  back: () => void
  error: string | null
  isPending: boolean
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const setCode = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const c = [...data.otp]
    c[i] = v
    set({ otp: c })
    if (v && i < 5) inputs.current[i + 1]?.focus()
  }
  return (
    <StepShell
      title="Entrez le code SMS"
      sub={
        <>
          Nous avons envoyé un code à 6 chiffres au <b>+221 {data.telephone || '77 123 45 67'}</b>.
        </>
      }
    >
      <div className="flex gap-2.5 justify-start">
        {data.otp.map((v, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el }}
            value={v}
            onChange={(e) => setCode(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !v && i > 0) inputs.current[i - 1]?.focus()
            }}
            inputMode="numeric"
            maxLength={1}
            autoFocus={i === 0}
            className={`w-14 h-16 rounded-btn border-[1.5px] text-center font-stat font-bold text-[28px] text-ink outline-none transition ${
              v ? 'border-brand-600 bg-white' : 'border-surface-soft bg-surface-muted'
            }`}
          />
        ))}
      </div>
      <div className="mt-5 flex gap-4 font-sans text-sm text-ink-muted items-center">
        <span>Pas reçu ?</span>
        <button type="button" className="text-brand-600 font-semibold">Renvoyer le code</button>
      </div>
      {error && <p className="text-sm text-absent-text mt-3">{error}</p>}
      <div className="flex gap-2.5 mt-8">
        <KBtn variant="ghost" onClick={back} iconLeft={<ArrowLeft className="w-4.5 h-4.5" />}>Retour</KBtn>
        <KBtn onClick={next} className="flex-1" disabled={isPending} iconRight={<ArrowRight className="w-4.5 h-4.5" />}>
          {isPending ? 'Vérification…' : 'Vérifier le code'}
        </KBtn>
      </div>
    </StepShell>
  )
}

// ── ChantierPreview ──────────────────────────────────────────────────────────
function ChantierPreview({ data }: { data: FormData }) {
  return (
    <div className="bg-white border border-surface-soft rounded-card p-5 shadow-card">
      <div className="font-display font-bold text-[11px] tracking-[0.14em] uppercase text-ink-faint">Aperçu fiche chantier</div>
      <div className="mt-3.5 flex items-center gap-3.5">
        <div className="w-[54px] h-[54px] rounded-icon bg-brand-50 text-brand-600 inline-flex items-center justify-center">
          <HardHat className="w-6 h-6" />
        </div>
        <div>
          <div className="font-display font-extrabold text-[22px] uppercase text-ink leading-none">
            {data.chantier_nom || 'Nom du chantier'}
          </div>
          <div className="font-mono text-[11px] text-ink-faint tracking-widest mt-1">
            CHT-{(data.chantier_nom || 'AAA').slice(0, 3).toUpperCase()}-01
          </div>
        </div>
      </div>
      <div className="h-px bg-surface-soft my-4" />
      <div className="flex flex-col gap-2.5 font-sans text-[13px]">
        <div className="flex items-center gap-2 text-ink-muted">
          <MapPin className="w-3.5 h-3.5 text-ink-faint" />
          {data.chantier_adresse || 'Adresse du chantier'}
        </div>
        <div className="flex items-center gap-2 text-ink-muted">
          <Calendar className="w-3.5 h-3.5 text-ink-faint" />
          Démarrage : {data.chantier_debut || 'à définir'}
        </div>
        <div className="flex items-center gap-2 text-ink-muted">
          <Banknote className="w-3.5 h-3.5 text-ink-faint" />
          Taux journalier : <b className="font-stat">{data.chantier_taux || '0'} XOF</b>
        </div>
      </div>
      <div className="mt-4 p-3 bg-surface-app rounded-xl font-sans text-xs text-brand-700 leading-relaxed">
        Un QR code unique sera généré pour le chantier. Affichez-le à l&apos;entrée pour que les pointeurs s&apos;y associent.
      </div>
    </div>
  )
}

// ── StepPret ─────────────────────────────────────────────────────────────────
function StepPret({ onFinish }: { onFinish: () => void }) {
  const tour = [
    { Ic: LayoutDashboard, t: 'Tableau de bord', b: 'Vue quotidienne : présents, absents, masse salariale du jour.' },
    { Ic: ScanLine, t: 'Pointer un agent', b: 'QR code ou numéro de téléphone. Entrée, sortie, en 10 secondes.' },
    { Ic: FileText, t: 'Cycle de paie', b: 'Chaque jeudi, validez la semaine. Exportez la feuille en PDF.' },
    { Ic: Send, t: 'Verser via Wave', b: 'Un seul bouton : toute l\'équipe payée par Wave Business.' },
  ]
  return (
    <div className="max-w-[880px] mx-auto text-center">
      <div className="inline-flex w-[88px] h-[88px] rounded-3xl bg-entree-light text-entree items-center justify-center shadow-[0_12px_32px_rgba(24,105,64,0.22)]">
        <Check className="w-11 h-11" />
      </div>
      <h1 className="font-display font-extrabold uppercase tracking-tight mt-6 text-ink text-[clamp(40px,5.4vw,64px)] leading-none">
        Tout est prêt.
        <br />
        <span className="text-brand-600">Bienvenue sur Kufinekk.</span>
      </h1>
      <p className="font-sans text-lg text-ink-muted mt-4 max-w-[540px] mx-auto leading-relaxed">
        Votre compte est configuré. Voici où vous passerez le plus de temps :
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-10 text-left">
        {tour.map((s) => (
          <div key={s.t} className="bg-white border border-surface-soft rounded-2xl p-5">
            <div className="w-11 h-11 rounded-icon bg-surface-app text-brand-600 inline-flex items-center justify-center">
              <s.Ic className="w-5 h-5" />
            </div>
            <div className="font-display font-extrabold text-lg uppercase tracking-wide mt-3.5 text-ink">{s.t}</div>
            <div className="font-sans text-[13px] text-ink-muted mt-1.5 leading-relaxed">{s.b}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center mt-10 flex-wrap">
        <KBtn onClick={onFinish} iconRight={<ArrowRight className="w-4.5 h-4.5" />}>
          Aller au tableau de bord
        </KBtn>
      </div>
      <p className="font-sans text-[13px] text-ink-faint mt-6">
        Besoin d&apos;un coup de main ? Notre équipe est sur WhatsApp : <b>+221 33 XXX XX XX</b>
      </p>
    </div>
  )
}
