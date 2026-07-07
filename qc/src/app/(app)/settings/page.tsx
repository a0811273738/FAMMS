'use client'

import Link from 'next/link'
import { Package, ListChecks, Users, SlidersHorizontal, LayoutTemplate, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'

const ENTRIES = [
  { href: '/settings/products', icon: Package, titleKey: 'settings.products', descKey: 'settings.productsDesc' },
  { href: '/settings/test-items', icon: ListChecks, titleKey: 'settings.testItems', descKey: 'settings.testItemsDesc' },
  { href: '/settings/customers', icon: Users, titleKey: 'settings.customers', descKey: 'settings.customersDesc' },
  { href: '/settings/specs', icon: SlidersHorizontal, titleKey: 'settings.specs', descKey: 'settings.specsDesc' },
  { href: '/settings/templates', icon: LayoutTemplate, titleKey: 'settings.templates', descKey: 'settings.templatesDesc' },
]

export default function SettingsPage() {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-sm text-gray-500">{t('settings.subtitle')}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {ENTRIES.map(({ href, icon: Icon, titleKey, descKey }) => (
          <Link key={href} href={href}>
            <Card className="p-4 hover:bg-gray-50 transition-colors h-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{t(titleKey)}</div>
                  <div className="text-xs text-gray-500 truncate">{t(descKey)}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
