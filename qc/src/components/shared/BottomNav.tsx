'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

// Exactly four tabs (ch.5.3 — "超過4個就是設計失敗"). The centre "Inspect"
// tab is the primary raised action.
interface NavItem {
  href: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  primary?: boolean
}

const NAV: NavItem[] = [
  { href: '/home', labelKey: 'nav.home', icon: Home },
  { href: '/tasks', labelKey: 'nav.tasks', icon: ClipboardList },
  { href: '/inspect', labelKey: 'nav.inspect', icon: Plus, primary: true },
  { href: '/me', labelKey: 'nav.me', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV.map(({ href, labelKey, icon: Icon, primary }) => {
          const label = t(labelKey)
          const active = pathname === href || pathname.startsWith(href + '/')

          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center -mt-6"
                aria-label={label}
              >
                <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-emerald-700 font-medium mt-1">{label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg flex-1 min-h-[48px]',
                active ? 'text-emerald-700' : 'text-gray-500'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
