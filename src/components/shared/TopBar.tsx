'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { ROLE_ZH } from '@/lib/incident-display'
import { Wrench, LogOut, User, Globe } from 'lucide-react'
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

  const languageLabel = i18n.language === 'id' ? 'Bahasa Indonesia' : 'English'

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-12 max-w-lg mx-auto">
        <div className="flex items-center gap-2 text-blue-600 font-bold">
          <Wrench className="w-4 h-4" />
          <span className="text-sm">FAMMS</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 focus:outline-none text-xs">
              <Globe className="w-3 h-3" />
              <span className="hidden sm:inline" suppressHydrationWarning>{languageLabel}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => handleLanguageChange('id')}
                className={`cursor-pointer ${i18n.language === 'id' ? 'bg-blue-50 text-blue-700' : ''}`}
              >
                {i18n.language === 'id' && <span className="mr-2">✓</span>}
                Bahasa Indonesia
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleLanguageChange('en')}
                className={`cursor-pointer ${i18n.language === 'en' ? 'bg-blue-50 text-blue-700' : ''}`}
              >
                {i18n.language === 'en' && <span className="mr-2">✓</span>}
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
