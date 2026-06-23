import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import StatusBadge from '@/components/shared/StatusBadge'
import { IncidentStatus, DowntimeImpact, DOWNTIME_IMPACT_LABELS } from '@/types'
import { Plus, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

const IMPACT_COLORS: Record<DowntimeImpact, string> = {
  A: 'bg-red-100 text-red-700',
  B: 'bg-orange-100 text-orange-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-gray-100 text-gray-600',
}

type Row = {
  id: string
  incident_no: string
  status: IncidentStatus
  downtime_impact: DowntimeImpact
  reported_at: string
  machine: { machine_code: string; machine_name: string } | null
  failure_code: { code: string; name: string } | null
}

export default async function IncidentsPage() {
  const supabase = await createClient()
  const { data: incidents } = await supabase
    .from('incidents')
    .select(`
      id, incident_no, status, downtime_impact, reported_at,
      machine:machines(machine_code, machine_name),
      failure_code:failure_codes(code, name)
    `)
    .order('reported_at', { ascending: false })
    .limit(100)

  const rows = (incidents ?? []) as unknown as Row[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Incident</h1>
        <Link
          href="/incidents/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Lapor Incident
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" />
          <p>Belum ada incident.</p>
          <Link href="/incidents/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            Lapor incident pertama
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {rows.map((inc) => (
            <Link
              key={inc.id}
              href={`/incidents/${inc.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-gray-900">{inc.incident_no}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${IMPACT_COLORS[inc.downtime_impact]}`}>
                    {inc.downtime_impact} · {DOWNTIME_IMPACT_LABELS[inc.downtime_impact]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate mt-0.5">
                  {inc.machine ? `${inc.machine.machine_code} — ${inc.machine.machine_name}` : 'Mesin?'}
                  {inc.failure_code ? ` · ${inc.failure_code.name}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <StatusBadge status={inc.status} />
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(inc.reported_at), 'dd MMM yyyy HH:mm')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
