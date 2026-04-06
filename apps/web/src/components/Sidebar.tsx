'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  HardHat,
  Clock,
  FileText,
  LogOut,
  ClipboardList,
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard',   label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/agents',      label: 'Agents',           icon: Users },
  { href: '/chantiers',   label: 'Chantiers',        icon: HardHat },
  { href: '/pointages',   label: 'Présences',        icon: Clock },
  { href: '/cycles-paie', label: 'Paie',             icon: FileText },
]

// 4 items visibles dans la tab bar mobile
const tabItems = [
  { href: '/dashboard',   label: 'Accueil',    icon: LayoutDashboard },
  { href: '/agents',      label: 'Agents',     icon: Users },
  { href: '/pointages',   label: 'Présences',  icon: ClipboardList },
  { href: '/chantiers',   label: 'Chantiers',  icon: HardHat },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* ── Sidebar desktop — dark olive ── */}
      <aside className="hidden lg:flex w-60 min-h-screen flex-col bg-dark">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-600 rounded-icon flex items-center justify-center flex-shrink-0">
              <span className="text-white text-base font-bold font-display">K</span>
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight tracking-wide uppercase">Kufinekk</p>
              <p className="text-xs text-white/40 leading-tight">Pointage BTP</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-600/15 text-brand-200'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Déconnexion */}
        <div className="px-3 pb-5">
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium text-white/40 hover:bg-absent/10 hover:text-absent-light transition-colors"
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* ── Tab bar mobile (fixe en bas) ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex h-16 items-stretch border-t border-surface-soft bg-surface-card">
        {tabItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                active ? 'text-brand-600' : 'text-ink-faint'
              )}
            >
              <Icon
                size={22}
                className={clsx(active ? 'text-brand-600' : 'text-ink-faint')}
              />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
