import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen app-bg">
      <Sidebar />

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto">
        {/* Header mobile — logo + titre app */}
        <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center border-b border-surface-soft bg-dark px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-icon flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold font-display">K</span>
            </div>
            <span className="font-display font-bold text-white text-sm tracking-wide uppercase">Kufinekk</span>
          </div>
        </header>

        {/* Zone de contenu — padding bas pour la tab bar mobile */}
        <div className="pb-20 lg:pb-0">
          {children}
        </div>
      </main>
    </div>
  )
}
