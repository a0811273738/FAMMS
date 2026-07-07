'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Globe, Settings, User, Check, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useI18n, LOCALES } from '@/lib/i18n'
import { PERMISSIONS } from '@/lib/permissions'
import { ROLE_LABELS, label, type UserRole } from '@/types/qc'
import { toast } from 'sonner'

export default function MeContent({ name, role }: { name: string; role: UserRole }) {
  const router = useRouter()
  const { t, locale, setLocale } = useI18n()
  const canSettings = PERMISSIONS.viewSettings(role)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success(t('me.loggedOut'))
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">{t('me.title')}</h1>

      {/* Identity */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <User className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{name || '—'}</div>
            <div className="text-sm text-gray-500">
              {t('me.role')}: {label(ROLE_LABELS[role], locale)}
            </div>
          </div>
        </div>
      </Card>

      {/* Settings entry (supervisor+) */}
      {canSettings && (
        <Link href="/settings">
          <Card className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between min-h-[24px]">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">{t('me.settings')}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Card>
        </Link>
      )}

      {/* Language */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
          <Globe className="w-4 h-4" /> {t('me.language')}
        </h2>
        <Card className="p-1">
          {LOCALES.map((l) => (
            <button
              key={l.value}
              onClick={() => setLocale(l.value)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 min-h-[48px]"
            >
              <span className="text-gray-900">{l.label}</span>
              {l.value === locale && <Check className="w-5 h-5 text-emerald-600" />}
            </button>
          ))}
        </Card>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-lg border border-red-200 bg-white text-red-600 font-medium hover:bg-red-50"
      >
        <LogOut className="w-5 h-5" />
        {t('me.logout')}
      </button>
    </div>
  )
}
