'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'

interface QrScannerProps {
  onScan: (matricule: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scannerId = 'qr-reader'

    const scanner = new Html5Qrcode(scannerId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Vérifier que c'est un matricule Kufinekk
          const text = decodedText.trim()
          if (/^KFN-\d{5}$/.test(text)) {
            scanner.stop().catch(() => {})
            onScan(text)
          }
        },
        () => {} // ignore scan errors (no QR in frame)
      )
      .catch(() => {
        setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
      })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 bg-dark-deep/90 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
        <p className="text-white font-display font-bold uppercase tracking-wide">Scanner QR</p>
        <button onClick={onClose} className="p-2 rounded-icon bg-white/10 text-white">
          <X size={20} />
        </button>
      </div>

      {/* Scanner area */}
      <div className="w-72 h-72 rounded-card overflow-hidden relative">
        <div id="qr-reader" ref={containerRef} className="w-full h-full" />
        {/* Corner markers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-brand-600 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-brand-600 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-brand-600 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-brand-600 rounded-br-lg" />
        </div>
      </div>

      <p className="text-white/60 text-sm mt-6 text-center max-w-xs">
        Placez le QR code de l'agent dans le cadre
      </p>

      {error && (
        <div className="mt-4 bg-absent/20 text-absent-light px-4 py-3 rounded-btn text-sm max-w-xs text-center">
          {error}
        </div>
      )}
    </div>
  )
}
