'use client'

import Link from 'next/link'
import { FlaskConical, Settings } from 'lucide-react'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher'
import { useI18n } from '@/lib/i18n'
import { PERMISSIONS } from '@/lib/permissions'
import type { UserRole } from '@/types/qc'

// Top bar: brand + language + (supervisor+) a Settings entry. This is the
// "extra way into settings" the spec asks for on top of the four bottom tabs.
export default function TopBar({ role }: { role?: UserRole }) {
  const { t } = useI18n()
  const canSettings = role ? PERMISSIONS.viewSettings(role) : false

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 max-w-lg lg:max-w-5xl mx-auto px-4">
        <Link href="/home" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">FQMS</span>
        </Link>
        <div className="flex items-center gap-1">
          {canSettings && (
            <Link
              href="/settings"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label={t('nav.settings')}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium">{t('nav.settings')}</span>
            </Link>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
