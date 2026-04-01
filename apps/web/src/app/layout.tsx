import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kufinekk — Pointage BTP',
  description: 'Système de gestion de présence sur chantier',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
