'use client'

import { Download, QrCode } from 'lucide-react'
import Image from 'next/image'

interface Props {
  matricule: string
  qrCodeUrl: string
  nom: string
  prenom: string
}

export default function QrCodeCard({ matricule, qrCodeUrl, nom, prenom }: Props) {
  async function handleDownload() {
    try {
      const res = await fetch(qrCodeUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `badge-${matricule}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(qrCodeUrl, '_blank')
    }
  }

  return (
    <div className="card p-5 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 self-start">
        <QrCode size={16} className="text-ink-faint" />
        <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Badge / QR Code</h2>
      </div>

      <div className="border-2 border-surface-soft rounded-card p-3 bg-white">
        <Image
          src={qrCodeUrl}
          alt={`QR Code ${matricule}`}
          width={160}
          height={160}
          className="block"
          unoptimized
        />
      </div>

      <div className="text-center">
        <p className="font-bold text-ink">{prenom} {nom}</p>
        <p className="matricule">{matricule}</p>
      </div>

      <button
        onClick={handleDownload}
        className="btn-secondary flex items-center gap-2"
      >
        <Download size={16} />
        Télécharger le badge
      </button>
    </div>
  )
}
