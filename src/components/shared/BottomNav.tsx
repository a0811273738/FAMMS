'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ClipboardList, Plus, LayoutDashboard, Settings, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'
import { PERMISSIONS } from '@/lib/permissions'

interface NavItem {
  href: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  primary?: boolean
  requiredRole?: (role: UserRole) => boolean
}

interface BottomNavProps {
  userRole?: UserRole
}

export default function BottomNav({ userRole = 'technician' }: BottomNavProps) {
  const pathname = usePathname()
  const { t } = useTranslation()

  const NAV: NavItem[] = [
    { href: '/dashboard', labelKey: 'navigation.dashboard', icon: LayoutDashboard, requiredRole: (r) => PERMISSIONS.dashboard(r) },
    { href: '/incidents', labelKey: 'navigation.incidents', icon: ClipboardList },
    { href: '/incidents/new', labelKey: 'navigation.newIncident', icon: Plus, primary: true },
    { href: '/pm', labelKey: 'navigation.pm', icon: Wrench },
    { href: '/settings', labelKey: 'navigation.settings', icon: Settings },
  ]

  const visibleNav = NAV.filter(item => !item.requiredRole || item.requiredRole(userRole))

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {visibleNav.map(({ href, labelKey, icon: Icon, primary }) => {
          const active = href === '/incidents/new'
            ? pathname === href
            : pathname === href || (pathname.startsWith(href + '/') && href !== '/incidents/new')

          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-blue-600 font-medium mt-1">{t(labelKey)}</span>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg flex-1',
                active ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
