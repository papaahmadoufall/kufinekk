import type { Metadata } from 'next'
import { Manrope, Barlow_Condensed, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-mono-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kufinekk — Pointage BTP',
  description: 'Système de gestion de présence sur chantier',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={cn(manrope.variable, barlowCondensed.variable, spaceGrotesk.variable, jetbrainsMono.variable, "font-sans")}>
      <body>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </body>
    </html>
  )
}
