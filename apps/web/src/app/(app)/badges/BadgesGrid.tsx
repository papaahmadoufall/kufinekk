'use client'

import { Download, QrCode, MapPin } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Agent {
  id: string
  matricule: string
  nom: string
  prenom: string
  telephone: string
  qrCodeUrl?: string
  contratActif?: {
    poste: string
    chantier: { id: string; nom: string }
    statut: string
  }
}

async function downloadQr(url: string, matricule: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `badge-${matricule}.png`
    a.click()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, '_blank')
  }
}

function BadgeCard({ agent }: { agent: Agent }) {
  return (
    <div className="card p-4 flex flex-col items-center gap-3 print:border print:border-gray-300 print:rounded-none print:shadow-none">
      {agent.qrCodeUrl ? (
        <div className="border-2 border-surface-soft rounded-card p-2 bg-white">
          <Image
            src={agent.qrCodeUrl}
            alt={`QR ${agent.matricule}`}
            width={120}
            height={120}
            unoptimized
          />
        </div>
      ) : (
        <div className="w-[120px] h-[120px] border-2 border-dashed border-surface-soft rounded-card flex flex-col items-center justify-center gap-2 bg-surface-muted">
          <QrCode size={32} className="text-ink-faint" />
          <span className="text-xs text-ink-faint text-center leading-tight px-2">QR non généré</span>
        </div>
      )}

      <div className="text-center">
        <p className="font-bold text-ink text-sm leading-tight">{agent.prenom} {agent.nom}</p>
        <p className="font-mono text-xs text-ink-muted mt-0.5 tracking-wider">{agent.matricule}</p>
        {agent.contratActif && (
          <div className="flex items-center gap-1 justify-center mt-1.5 text-xs text-ink-faint">
            <MapPin size={11} />
            <span className="truncate max-w-[140px]">{agent.contratActif.chantier.nom}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 w-full print:hidden">
        <Link
          href={`/agents/${agent.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-semibold border border-surface-soft rounded-btn bg-surface-card hover:bg-surface-muted transition-colors text-ink"
        >
          Voir profil
        </Link>
        {agent.qrCodeUrl && (
          <button
            onClick={() => downloadQr(agent.qrCodeUrl!, agent.matricule)}
            className="flex items-center justify-center w-9 h-9 border border-surface-soft rounded-btn bg-surface-card hover:bg-surface-muted transition-colors text-ink-muted"
            title="Télécharger le badge"
          >
            <Download size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function BadgesGrid({ agents }: { agents: Agent[] }) {
  function handlePrint() {
    window.print()
  }

  return (
    <>
      {/* Bouton imprimer — client-side */}
      <div className="mb-4 print:hidden flex items-center justify-between">
        <p className="text-sm text-ink-faint">
          {agents.filter(a => a.qrCodeUrl).length} badge{agents.filter(a => a.qrCodeUrl).length > 1 ? 's' : ''} avec QR · {agents.filter(a => !a.qrCodeUrl).length} sans QR
        </p>
        <button
          onClick={handlePrint}
          className="btn-secondary h-9 px-4 text-sm"
        >
          Imprimer tous les badges
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {agents.map((agent) => (
          <BadgeCard key={agent.id} agent={agent} />
        ))}
      </div>
    </>
  )
}
