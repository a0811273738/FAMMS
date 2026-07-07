'use client'

import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'

// Placeholder for routes reserved in Phase 1 but built later. Doubles as the
// "empty state = teaching" pattern (ch.5.2 rule #7): says what the screen is
// and what will happen here.
export default function ComingSoon({
  icon: Icon,
  titleKey,
  descKey,
}: {
  icon: React.ComponentType<{ className?: string }>
  titleKey: string
  descKey: string
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{t(titleKey)}</h1>
      <Card className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 mb-4">
          <Icon className="w-7 h-7 text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-gray-800">{t('tasks.comingSoon')}</p>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">{t(descKey)}</p>
      </Card>
    </div>
  )
}
