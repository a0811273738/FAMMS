import { IncidentStatus, INCIDENT_STATUS_LABELS, INCIDENT_STATUS_COLORS } from '@/types'
import { cn } from '@/lib/utils'

export default function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold',
        INCIDENT_STATUS_COLORS[status]
      )}
    >
      {INCIDENT_STATUS_LABELS[status]}
    </span>
  )
}
