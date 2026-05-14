'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Terminal,
  TrendingUp,
  Music,
  ShoppingBag,
  Briefcase,
  Eye,
  Sword,
  Zap,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  accent?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Command',   icon: LayoutDashboard, accent: 'text-cyan' },
  { href: '/command',   label: 'Task Queue', icon: Terminal,         accent: 'text-cyan' },
  { href: '/hunter',   label: 'Hunter',     icon: TrendingUp,       accent: 'text-success' },
  { href: '/sapp',     label: 'SAPP',       icon: Music,            accent: 'text-purple' },
  { href: '/leon',     label: 'Leon',       icon: ShoppingBag,      accent: 'text-warning' },
  { href: '/ao',       label: 'AO',         icon: Briefcase,        accent: 'text-cyan' },
  { href: '/optix',    label: 'Optix',      icon: Eye,              accent: 'text-purple' },
  { href: '/ninja',    label: 'Ninja Squad',icon: Sword,            accent: 'text-danger' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 bg-space-800 border-r border-cyan/10 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-cyan/10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center justify-center">
            <Zap className="h-4 w-4 text-cyan" />
          </div>
          <div>
            <p className="text-xs font-mono text-cyan tracking-[0.2em] uppercase">MurphBoard</p>
            <p className="text-xs text-gray-500 font-mono">S.A. v1</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-cyan/10 text-white border border-cyan/20 shadow-glow-cyan'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-space-700'
              )}
            >
              <Icon
                className={clsx('h-4 w-4 flex-shrink-0', active ? accent : 'text-gray-500')}
              />
              <span className="truncate">{label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-cyan/10">
        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          Phase 1 Scaffold
        </p>
      </div>
    </aside>
  )
}
