// FAMMS Preventive Maintenance helpers

import { addDays, addWeeks, addMonths, addYears } from 'date-fns'
import type { PMType } from '@/types'

// Compute the next scheduled date for a PM occurrence based on its type.
export function nextScheduledDate(from: Date, pmType: PMType): Date {
  switch (pmType) {
    case 'daily': return addDays(from, 1)
    case 'weekly': return addWeeks(from, 1)
    case 'monthly': return addMonths(from, 1)
    case 'quarterly': return addMonths(from, 3)
    case 'half_yearly': return addMonths(from, 6)
    case 'yearly': return addYears(from, 1)
    default: return addMonths(from, 1)
  }
}

// Format a Date as YYYY-MM-DD (DATE column friendly).
export function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

// A PM record is overdue when its scheduled date is in the past and it is not yet done.
export function isOverdue(scheduledDate: string, status: string): boolean {
  if (status === 'completed' || status === 'skipped') return false
  return new Date(scheduledDate) < new Date(new Date().toISOString().split('T')[0])
}
