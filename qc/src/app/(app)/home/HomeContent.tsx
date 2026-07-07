'use client'

import Link from 'next/link'
import { ClipboardCheck, ClipboardList, AlertTriangle, PackageX, Plus, FileClock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import {
  INSPECTION_STATUS_LABELS, INSPECTION_STATUS_STYLES, STAGE_LABELS, label,
  type Inspection, type InspectionStatus,
} from '@/types/qc'

type RecentInspection = Pick<
  Inspection, 'id' | 'inspection_no' | 'status' | 'overall_result' | 'stage' | 'opened_at'
>

export interface HomeData {
  todayInspections: number
  pendingReview: number
  openNcr: number
  holdBatches: number
  recent: RecentInspection[]
  hasError: boolean
}

function StatCard({
  icon: Icon, value, labelText, tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  labelText: string
  tone: 'green' | 'blue' | 'orange' | 'red'
}) {
  const toneMap = {
    green: 'text-emerald-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  } as const
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <Icon className={`w-5 h-5 ${toneMap[tone]}`} />
      </div>
      {/* Numbers are the most important info → largest type (ch.5.6). */}
      <div className="text-3xl font-bold text-gray-900 leading-none mt-2">{value}</div>
      <div className="text-[13px] text-gray-500 mt-1">{labelText}</div>
    </Card>
  )
}

export default function HomeContent({ data, userName }: { data: HomeData; userName: string }) {
  const { t, locale } = useI18n()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {t('home.greeting')}{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-sm text-gray-500">{t('home.todayOverview')}</p>
      </div>

      {data.hasError && (
        <div className="flex items-start gap-2 rounded-xl bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{t('common.connectionError')}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={ClipboardCheck} value={data.todayInspections} labelText={t('home.todayInspections')} tone="green" />
        <StatCard icon={ClipboardList} value={data.pendingReview} labelText={t('home.pendingReview')} tone="orange" />
        <StatCard icon={AlertTriangle} value={data.openNcr} labelText={t('home.openNcr')} tone="red" />
        <StatCard icon={PackageX} value={data.holdBatches} labelText={t('home.holdBatches')} tone="orange" />
      </div>

      {/* Recent records / empty-state guidance */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('home.recentRecords')}</h2>
        {data.recent.length === 0 ? (
          <Card className="p-6 text-center">
            <FileClock className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-medium text-gray-700 mt-3">{t('home.emptyRecords')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('home.emptyRecordsHint')}</p>
            <Link
              href="/inspect"
              className="inline-flex items-center justify-center gap-1.5 mt-4 h-12 px-5 rounded-lg bg-emerald-600 text-white text-base font-medium"
            >
              <Plus className="w-5 h-5" />
              {t('home.startInspection')}
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.recent.map((ins) => {
              const s = INSPECTION_STATUS_STYLES[ins.status as InspectionStatus]
              return (
                <Card key={ins.id} className="p-0">
                  <div className="flex items-stretch">
                    <div className={`w-1 rounded-l-xl ${s?.bar ?? 'bg-gray-300'}`} />
                    <div className="flex-1 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">
                          {ins.inspection_no ?? '—'}
                        </span>
                        <span className={`text-xs font-medium ${s?.text ?? 'text-gray-500'}`}>
                          {label(INSPECTION_STATUS_LABELS[ins.status as InspectionStatus], locale)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {ins.stage ? label(STAGE_LABELS[ins.stage] ?? { zh: ins.stage, en: ins.stage, id: ins.stage }, locale) : ''}
                        {ins.opened_at ? ` · ${new Date(ins.opened_at).toLocaleDateString()}` : ''}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
