'use client'

import { useTranslation } from 'react-i18next'
import type { IncidentStatus } from '@/types'
import { STATUS_ZH_COLOR } from '@/lib/incident-display'

export function useIncidentLabels() {
  const { t } = useTranslation()

  const issueTypeLabels: Record<string, string> = {
    machine: t('issueTypes.machine'),
    pipe: t('issueTypes.pipe'),
    electrical: t('issueTypes.electrical'),
    facility: t('issueTypes.facility'),
    safety: t('issueTypes.safety'),
    cleanliness: t('issueTypes.cleanliness'),
    other: t('issueTypes.other'),
  }

  const urgencyFromImpact: Record<string, { label: string; color: string }> = {
    A: { label: t('urgency.A'), color: 'bg-red-100 text-red-700' },
    B: { label: t('urgency.B'), color: 'bg-orange-100 text-orange-700' },
    C: { label: t('urgency.C'), color: 'bg-yellow-100 text-yellow-700' },
    D: { label: t('urgency.D'), color: 'bg-green-100 text-green-700' },
  }

  const statusLabels: Record<IncidentStatus, string> = {
    reported: t('status.reported'),
    accepted: t('status.accepted'),
    analyzing: t('status.analyzing'),
    waiting_parts: t('status.waitingParts'),
    waiting_approval: t('status.waitingApproval'),
    waiting_vendor: t('status.waitingVendor'),
    waiting_shutdown: t('status.waitingShutdown'),
    repairing: t('status.repairing'),
    testing: t('status.testing'),
    observation: t('status.observation'),
    closed: t('status.closed'),
  }

  const boardFilters = [
    { key: 'all', label: t('boardFilters.all'), statuses: null },
    { key: 'reported', label: t('boardFilters.reported'), statuses: ['reported'] as IncidentStatus[] },
    { key: 'accepted', label: t('boardFilters.accepted'), statuses: ['accepted'] as IncidentStatus[] },
    { key: 'progress', label: t('boardFilters.progress'), statuses: ['analyzing', 'repairing'] as IncidentStatus[] },
    { key: 'waiting', label: t('boardFilters.waiting'), statuses: ['waiting_parts', 'waiting_approval', 'waiting_vendor', 'waiting_shutdown'] as IncidentStatus[] },
    { key: 'confirm', label: t('boardFilters.confirm'), statuses: ['testing', 'observation'] as IncidentStatus[] },
    { key: 'closed', label: t('boardFilters.closed'), statuses: ['closed'] as IncidentStatus[] },
  ]

  return { issueTypeLabels, urgencyFromImpact, statusLabels, statusColors: STATUS_ZH_COLOR, boardFilters }
}
