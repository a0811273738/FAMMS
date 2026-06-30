'use client'

import { CheckCircle2, ArrowRight } from 'lucide-react'
import type { IncidentStatus } from '@/types'
import { useI18n } from '@/lib/i18n'
import { STATUS_ZH, STATUS_ZH_COLOR } from '@/lib/incident-display'
import { isTerminalStatus, nextStatusOf, nextHintKey } from '@/lib/incident-next-step'

// Small colored status pill, matching the chips used across the board / header.
function StatusPill({ status }: { status: IncidentStatus }) {
  const { t } = useI18n()
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_ZH_COLOR[status]}`}>
      {t(`boardStatus.${status}`, STATUS_ZH[status])}
    </span>
  )
}

/**
 * "Now → Next" guidance for a case's current status.
 *
 * - `banner` (default): a two-row card (現在 / 接下來) for the detail page.
 * - `inline`: a compact "current → next" line for dense board cards.
 *
 * Closed cases show a green "done" variant suggesting the follow-up
 * (knowledge base entry) instead of a forward step.
 */
export default function NextStepHint({
  status,
  variant = 'banner',
}: {
  status: IncidentStatus
  variant?: 'banner' | 'inline'
}) {
  const { t } = useI18n()
  const done = isTerminalStatus(status)
  const next = nextStatusOf(status)

  // ---- Inline (board card) ----
  if (variant === 'inline') {
    if (done || !next) return null
    return (
      <p className="flex items-center gap-1 text-xs text-gray-500">
        {t(`boardStatus.${status}`, STATUS_ZH[status])}
        <ArrowRight className="w-3 h-3 shrink-0 text-blue-500" />
        <span className="font-medium text-gray-700">
          {t(`boardStatus.${next}`, STATUS_ZH[next])}
        </span>
      </p>
    )
  }

  // ---- Banner: done variant ----
  if (done || !next) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-start gap-2.5">
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
        <div>
          <p className="text-xs font-semibold text-green-700">{t('nextStep.doneLabel')}</p>
          <p className="text-sm mt-0.5 text-green-900">{t('nextStep.doneNote')}</p>
        </div>
      </div>
    )
  }

  // ---- Banner: now → next ----
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-14 shrink-0">{t('nextStep.now')}</span>
        <StatusPill status={status} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-blue-700 w-14 shrink-0">{t('nextStep.next')}</span>
        <StatusPill status={next} />
        <span className="text-xs text-gray-600">（{t(nextHintKey(status))}）</span>
      </div>
    </div>
  )
}
