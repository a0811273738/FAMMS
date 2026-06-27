'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { ROLE_ZH } from '@/lib/incident-display'
import { Wrench, LogOut, User } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopBarProps {
  profile: Profile | null
}

export default function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const supabase = createClient()
  const { i18n, t } = useTranslation()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-12 max-w-lg mx-auto">
        <div className="flex items-center gap-2 text-blue-600 font-bold">
          <Wrench className="w-4 h-4" />
          <span className="text-sm">FAMMS</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher - inline buttons */}
          <div className="flex items-center rounded-md border border-gray-200 overflow-hidden text-xs">
            {[
              { code: 'id', label: 'ID' },
              { code: 'en', label: 'EN' },
              { code: 'zh', label: '中' },
            ].map((lang, idx) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-2 py-1 ${idx > 0 ? 'border-l border-gray-200' : ''} ${
                  i18n.language === lang.code
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                suppressHydrationWarning
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-700">{initials}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                {profile?.role && (
                  <p className="text-xs text-gray-400 mt-0.5">{ROLE_ZH[profile.role]}</p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')} className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" /> {t('navigation.profile')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600 flex items-center gap-2 cursor-pointer">
                <LogOut className="w-4 h-4" /> {t('navigation.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
