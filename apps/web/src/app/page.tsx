import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Banknote,
  QrCode,
  FileSpreadsheet,
  Send,
  Check,
  AlertTriangle,
  Clock,
  Users,
  LineChart,
  ScanLine,
} from 'lucide-react'

// ── Wordmark ─────────────────────────────────────────────────────────────────
function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-display font-extrabold text-xl shadow-float">K</div>
      <div className="flex flex-col leading-none">
        <span className={`font-display font-extrabold uppercase tracking-wider text-lg ${light ? 'text-brand-50' : 'text-ink'}`}>Kufinekk</span>
        <span className={`font-sans font-semibold text-[10px] uppercase tracking-[0.12em] mt-0.5 ${light ? 'text-brand-50/60' : 'text-ink-faint'}`}>Pointage BTP</span>
      </div>
    </div>
  )
}

// ── Eyebrow ──────────────────────────────────────────────────────────────────
function Eyebrow({ children, tone = 'brand' }: { children: React.ReactNode; tone?: 'brand' | 'dark' | 'entree' }) {
  const tones = {
    brand: 'bg-brand-100 text-brand-700',
    dark: 'bg-white/10 text-brand-100',
    entree: 'bg-entree-light text-entree',
  }
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-chip font-display font-bold text-xs tracking-[0.14em] uppercase ${tones[tone]}`}>
      {children}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <main className="bg-surface-app text-ink min-h-screen">
      <TopNav />
      <Hero />
      <Probleme />
      <Fonctionnement />
      <WaveSection />
      <Tarifs />
      <CtaBand />
      <Footer />
    </main>
  )
}

// ── Top nav ──────────────────────────────────────────────────────────────────
function TopNav() {
  const links = [
    { href: '#probleme', label: 'Problème' },
    { href: '#fonctionnement', label: 'Comment ça marche' },
    { href: '#wave', label: 'Wave' },
    { href: '#tarifs', label: 'Tarifs' },
  ]
  return (
    <header className="sticky top-0 z-20 bg-surface-app/90 backdrop-blur border-b border-surface-soft">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/">
          <Wordmark />
        </Link>
        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="font-sans font-semibold text-sm text-ink-muted hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex h-10 px-4 items-center rounded-btn font-sans font-semibold text-sm text-ink hover:bg-ink/5">
            Se connecter
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex h-10 px-4 items-center gap-2 rounded-btn bg-brand-600 text-white font-display font-bold text-sm uppercase tracking-wider shadow-float hover:bg-brand-700 transition"
          >
            Créer un compte <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-8 pt-16 lg:pt-24 pb-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          <Eyebrow>Pointage BTP · Sénégal</Eyebrow>
          <h1 className="mt-5 font-display font-extrabold uppercase tracking-tight text-ink text-[clamp(40px,6vw,72px)] leading-[0.95]">
            Payez vos agents chaque vendredi.
            <br />
            <span className="text-brand-600">Sans cash. Sans erreur.</span>
          </h1>
          <p className="mt-5 font-sans text-lg text-ink-muted max-w-[560px] leading-relaxed">
            Kufinekk gère le pointage, le calcul des heures et le versement Wave de vos ouvriers sur chantier. Zéro feuille volante.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              className="inline-flex h-14 px-6 items-center gap-2.5 rounded-btn bg-brand-600 text-white font-display font-bold text-base uppercase tracking-wider shadow-float hover:bg-brand-700 transition"
            >
              Créer mon compte (essai gratuit) <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#fonctionnement"
              className="inline-flex h-14 px-6 items-center rounded-btn border-2 border-dark text-ink font-sans font-semibold hover:border-ink"
            >
              Voir comment ça marche
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 font-sans text-sm text-ink-muted">
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-entree" /> Conforme CDP Sénégal</span>
            <span className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-entree" /> Fonctionne sur tout smartphone</span>
            <span className="flex items-center gap-2"><Banknote className="w-4 h-4 text-entree" /> Paiement Wave intégré</span>
          </div>
        </div>
        <HeroMockup />
      </div>
    </section>
  )
}

function HeroMockup() {
  return (
    <div className="relative">
      <div className="bg-white rounded-card shadow-float border border-surface-soft p-6">
        <div className="flex items-center justify-between">
          <Eyebrow tone="entree">Dashboard — Aujourd&apos;hui</Eyebrow>
          <span className="font-mono text-xs text-ink-faint">Ven. 15 Nov</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Présents', val: '34', foot: '/ 36 agents' },
            { label: 'Heures cumulées', val: '272h', foot: 'aujourd’hui' },
            { label: 'Masse jour', val: '485k', foot: 'XOF' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-app rounded-xl p-3">
              <div className="font-sans text-[11px] uppercase tracking-wider text-ink-faint">{s.label}</div>
              <div className="font-stat font-bold text-[28px] text-ink mt-1 leading-none">{s.val}</div>
              <div className="font-sans text-xs text-ink-faint mt-1">{s.foot}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-2">
          {[
            { n: 'Moussa Diop', p: 'Maçon', s: 'entree' },
            { n: 'Fatou Sow', p: 'Ferrailleur', s: 'entree' },
            { n: 'Ibrahima Ba', p: 'Manœuvre', s: 'encours' },
          ].map((a) => (
            <div key={a.n} className="flex items-center justify-between p-3 bg-surface-app rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-display font-extrabold text-sm inline-flex items-center justify-center">
                  {a.n.split(' ').map((p) => p[0]).join('')}
                </div>
                <div>
                  <div className="font-sans font-semibold text-sm text-ink">{a.n}</div>
                  <div className="font-sans text-xs text-ink-faint">{a.p}</div>
                </div>
              </div>
              <span
                className={`font-display font-bold text-[11px] tracking-wider uppercase px-2.5 py-1 rounded-chip ${
                  a.s === 'entree' ? 'bg-entree-light text-entree' : 'bg-encours-light text-encours-text'
                }`}
              >
                {a.s === 'entree' ? 'Entré' : 'En cours'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-6 -left-6 bg-dark rounded-card p-4 w-[240px] shadow-float hidden sm:block">
        <div className="font-display font-bold text-[10px] tracking-[0.14em] uppercase text-brand-100 mb-2">SMS envoyé</div>
        <p className="font-sans text-sm text-brand-50 leading-relaxed">
          Bonjour Moussa, votre paiement de <b>62 500 XOF</b> a été envoyé via Wave.
        </p>
      </div>
    </div>
  )
}

// ── Problème ─────────────────────────────────────────────────────────────────
function Probleme() {
  const items = [
    { Ic: Clock, t: 'Le cahier de pointage, ça suffit.', b: 'Feuilles perdues, écritures illisibles, calculs à la main le jeudi soir.' },
    { Ic: AlertTriangle, t: 'Les erreurs de paie coûtent cher.', b: 'Un agent sous-payé = un agent qui s’en va. Un surpayé = votre marge.' },
    { Ic: Users, t: 'Le cash, c’est un risque.', b: 'Retraits en liquide, tournées de chantier, attestations manquantes.' },
  ]
  return (
    <section id="probleme" className="bg-white border-y border-surface-soft">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          <Eyebrow>Le problème</Eyebrow>
          <h2 className="mt-4 font-display font-extrabold uppercase tracking-tight text-ink text-[clamp(30px,4vw,44px)] leading-tight">
            Gérer la paie de 30 ouvriers, ça ne devrait pas prendre 8h par semaine.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {items.map((i) => (
            <div key={i.t} className="p-6 bg-surface-app rounded-card border border-surface-soft">
              <div className="w-12 h-12 rounded-icon bg-white text-brand-600 inline-flex items-center justify-center">
                <i.Ic className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-display font-extrabold uppercase text-xl text-ink">{i.t}</h3>
              <p className="mt-2 font-sans text-[15px] text-ink-muted leading-relaxed">{i.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Fonctionnement ───────────────────────────────────────────────────────────
function Fonctionnement() {
  const steps = [
    { n: '01', Ic: QrCode, t: 'Enrôlement en 2 minutes', b: 'Créez votre compte, ajoutez votre chantier et vos ouvriers. Un QR code est généré pour chaque agent.' },
    { n: '02', Ic: ScanLine, t: 'Pointage sur chantier', b: 'Votre pointeur scanne les QR codes à l’entrée et à la sortie. Les heures sont calculées en temps réel.' },
    { n: '03', Ic: FileSpreadsheet, t: 'Cycle hebdo automatique', b: 'Ven→Jeu. Chaque jeudi, la fiche de paie de chaque agent est prête. Vous validez en 1 clic.' },
    { n: '04', Ic: Send, t: 'Versement Wave', b: 'Tous vos agents sont payés en simultané via Wave Business. Un SMS de confirmation leur est envoyé.' },
  ]
  return (
    <section id="fonctionnement" className="py-24">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
        <div className="max-w-2xl">
          <Eyebrow>Comment ça marche</Eyebrow>
          <h2 className="mt-4 font-display font-extrabold uppercase tracking-tight text-ink text-[clamp(30px,4vw,44px)] leading-tight">
            4 étapes, du chantier au compte Wave de l&apos;ouvrier.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {steps.map((s) => (
            <div key={s.n} className="bg-white rounded-card border border-surface-soft p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-icon bg-brand-50 text-brand-600 inline-flex items-center justify-center">
                  <s.Ic className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs text-ink-faint">{s.n}</span>
              </div>
              <h3 className="mt-5 font-display font-extrabold uppercase text-xl text-ink">{s.t}</h3>
              <p className="mt-2 font-sans text-[14px] text-ink-muted leading-relaxed">{s.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Wave Section ─────────────────────────────────────────────────────────────
function WaveSection() {
  return (
    <section id="wave" className="bg-dark text-brand-50">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Eyebrow tone="dark">Wave Payout</Eyebrow>
          <h2 className="mt-4 font-display font-extrabold uppercase tracking-tight text-brand-50 text-[clamp(30px,4vw,46px)] leading-tight">
            Un clic. 30 agents payés.
          </h2>
          <p className="mt-5 font-sans text-lg text-brand-50/70 leading-relaxed max-w-[540px]">
            Kufinekk se branche directement sur Wave Business. Vous validez le cycle, nous déclenchons le batch. Chaque ouvrier reçoit son dû et un SMS.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              'Aucun retrait en liquide',
              'Traçabilité complète (batch ID + statut)',
              'Relance automatique si échec',
              'SMS de confirmation à chaque agent',
            ].map((p) => (
              <li key={p} className="flex items-center gap-3 font-sans text-[15px] text-brand-50">
                <Check className="w-5 h-5 text-entree-subtle shrink-0" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white text-ink rounded-card p-6 shadow-float">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-[11px] tracking-[0.14em] uppercase text-ink-faint">Cycle · Ven 8 Nov — Jeu 14 Nov</div>
              <div className="font-display font-extrabold uppercase text-2xl mt-1">Chantier Almadies 3</div>
            </div>
            <Eyebrow tone="entree">Prêt à verser</Eyebrow>
          </div>
          <div className="h-px bg-surface-soft my-5" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-sans text-xs text-ink-faint uppercase tracking-wider">Agents</div>
              <div className="font-stat font-bold text-[34px] text-ink leading-none mt-1">34</div>
            </div>
            <div>
              <div className="font-sans text-xs text-ink-faint uppercase tracking-wider">Total</div>
              <div className="font-stat font-bold text-[34px] text-ink leading-none mt-1">
                2 418 500 <span className="text-base text-ink-faint">XOF</span>
              </div>
            </div>
          </div>
          <button className="mt-6 h-14 w-full rounded-btn bg-brand-600 text-white font-display font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-float">
            <Send className="w-5 h-5" /> Verser via Wave
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Tarifs ───────────────────────────────────────────────────────────────────
function Tarifs() {
  const plans = [
    {
      nom: 'Essai',
      prix: '0',
      desc: '14 jours gratuits. Aucun engagement.',
      items: ['1 chantier', 'Jusqu’à 10 agents', 'SMS inclus', 'Support WhatsApp'],
      cta: 'Commencer',
    },
    {
      nom: 'Chantier',
      prix: '25 000',
      desc: 'Pour 1 chantier actif à la fois.',
      items: ['1 chantier actif', 'Agents illimités', 'Wave Payout inclus', 'Export PDF paie', 'SMS illimités'],
      cta: 'Choisir Chantier',
      featured: true,
    },
    {
      nom: 'Entreprise',
      prix: '75 000',
      desc: 'Multi-chantiers et multi-pointeurs.',
      items: ['Chantiers illimités', 'Pointeurs illimités', 'Rapports consolidés', 'Support prioritaire'],
      cta: 'Choisir Entreprise',
    },
  ]
  return (
    <section id="tarifs" className="py-24 bg-white border-y border-surface-soft">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
        <div className="max-w-2xl">
          <Eyebrow>Tarifs</Eyebrow>
          <h2 className="mt-4 font-display font-extrabold uppercase tracking-tight text-ink text-[clamp(30px,4vw,44px)] leading-tight">
            Un tarif par chantier. Pas par agent.
          </h2>
          <p className="mt-4 font-sans text-[15px] text-ink-muted">Tous les prix sont en XOF par mois, sans TVA.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {plans.map((p) => (
            <div
              key={p.nom}
              className={`p-6 rounded-card border ${
                p.featured ? 'bg-dark text-brand-50 border-dark shadow-float' : 'bg-surface-app border-surface-soft'
              }`}
            >
              <div className={`font-display font-bold text-[11px] tracking-[0.14em] uppercase ${p.featured ? 'text-brand-100' : 'text-ink-faint'}`}>
                {p.nom}
              </div>
              <div className={`mt-3 font-stat font-bold text-[44px] leading-none ${p.featured ? 'text-brand-50' : 'text-ink'}`}>
                {p.prix} <span className={`text-base ${p.featured ? 'text-brand-100' : 'text-ink-faint'}`}>XOF / mois</span>
              </div>
              <p className={`mt-3 font-sans text-sm ${p.featured ? 'text-brand-50/70' : 'text-ink-muted'}`}>{p.desc}</p>
              <ul className="mt-5 space-y-2.5">
                {p.items.map((it) => (
                  <li key={it} className={`flex items-start gap-2 font-sans text-[14px] ${p.featured ? 'text-brand-50' : 'text-ink'}`}>
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.featured ? 'text-entree-subtle' : 'text-entree'}`} /> {it}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboarding"
                className={`mt-6 h-12 w-full inline-flex items-center justify-center gap-2 rounded-btn font-display font-bold text-sm uppercase tracking-wider ${
                  p.featured ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-ink text-white hover:bg-dark'
                } transition`}
              >
                {p.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Cta band ─────────────────────────────────────────────────────────────────
function CtaBand() {
  return (
    <section className="py-20">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
        <div className="rounded-card bg-brand-600 text-white p-10 lg:p-14 text-center relative overflow-hidden">
          <LineChart className="w-20 h-20 absolute -right-4 -top-4 text-brand-700/30" />
          <h2 className="font-display font-extrabold uppercase tracking-tight text-[clamp(28px,4vw,44px)] leading-tight">
            Prêt à dire au revoir au cahier de pointage ?
          </h2>
          <p className="mt-3 font-sans text-lg text-brand-50/90 max-w-[620px] mx-auto">
            Configurez votre entreprise en 6 étapes. Vos agents pointent dès demain.
          </p>
          <Link
            href="/onboarding"
            className="mt-8 inline-flex h-14 px-6 items-center gap-2.5 rounded-btn bg-white text-brand-700 font-display font-bold uppercase tracking-wider shadow-float hover:bg-brand-50 transition"
          >
            Créer mon compte (essai gratuit) <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-dark-deep text-brand-50/70">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-8 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <Wordmark light />
          <p className="mt-4 font-sans text-sm text-brand-50/60 leading-relaxed max-w-[280px]">
            Pointage BTP conçu pour le Sénégal. Zéro cash, zéro feuille volante.
          </p>
        </div>
        <div>
          <div className="font-display font-bold text-[11px] tracking-[0.14em] uppercase text-brand-50 mb-4">Produit</div>
          <ul className="space-y-2 font-sans text-sm">
            <li><a href="#fonctionnement" className="hover:text-brand-50">Comment ça marche</a></li>
            <li><a href="#tarifs" className="hover:text-brand-50">Tarifs</a></li>
            <li><Link href="/login" className="hover:text-brand-50">Se connecter</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-display font-bold text-[11px] tracking-[0.14em] uppercase text-brand-50 mb-4">Entreprise</div>
          <ul className="space-y-2 font-sans text-sm">
            <li>Dakar, Sénégal</li>
            <li>contact@kufinekk.com</li>
            <li>+221 33 XXX XX XX</li>
          </ul>
        </div>
        <div>
          <div className="font-display font-bold text-[11px] tracking-[0.14em] uppercase text-brand-50 mb-4">Légal</div>
          <ul className="space-y-2 font-sans text-sm">
            <li>Conditions générales</li>
            <li>Politique de confidentialité</li>
            <li>Conforme CDP Sénégal</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-8 py-5 font-sans text-xs text-brand-50/50 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Kufinekk. Tous droits réservés.</span>
          <span>Fait à Dakar.</span>
        </div>
      </div>
    </footer>
  )
}
