'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface QrScannerProps {
  onScan: (matricule: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<any>(null)
  const onScanRef = useRef(onScan)
  const stoppedRef = useRef(false)
  const startedRef = useRef(false)

  // Keep callback ref in sync without re-running effect
  onScanRef.current = onScan

  useEffect(() => {
    let cancelled = false
    stoppedRef.current = false
    startedRef.current = false

    async function startScanner() {
      try {
        // Dynamic import to avoid SSR issues — html5-qrcode uses window/document at module level
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            const text = decodedText.trim()
            if (/^KFN-\d{5}$/.test(text) && !stoppedRef.current) {
              stoppedRef.current = true
              scannerRef.current = null  // prevent cleanup double-stop
              scanner.stop().catch(() => {})
              onScanRef.current(text)
            }
          },
          () => {} // ignore scan errors (no QR in frame)
        )

        if (cancelled) {
          scanner.stop().catch(() => {})
          return
        }
        startedRef.current = true
      } catch {
        if (!cancelled) {
          setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
        }
      }
    }

    startScanner()

    return () => {
      cancelled = true
      stoppedRef.current = true
      if (scannerRef.current && startedRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [])

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
        <div id="qr-reader" className="w-full h-full" />
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
