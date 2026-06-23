import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, CalendarCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PMRecordForm from '@/components/pm/PMRecordForm'
import { PM_TYPE_LABELS, PMType } from '@/types'
import { isOverdue } from '@/lib/pm'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export const metadata = { title: 'Preventive Maintenance | FAMMS' }

interface ScheduleRel {
  id: string
  pm_type: PMType
  description: string | null
  checklist: string | null
  machine: { machine_code: string; machine_name: string } | null
}

interface RecordRow {
  id: string
  scheduled_date: string
  status: string
  schedule: ScheduleRel | null
}

function parseChecklist(raw: string | null): string[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export default async function PMPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('factory_id')
    .eq('id', user.id)
    .single()

  // Active schedules for this factory
  const { data: schedules } = await supabase
    .from('pm_schedules')
    .select('*, machine:machines(machine_code, machine_name)')
    .eq('factory_id', profile?.factory_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // All records for those schedules
  const scheduleIds = (schedules ?? []).map(s => s.id)
  let records: RecordRow[] = []
  if (scheduleIds.length) {
    const { data: recs } = await supabase
      .from('pm_records')
      .select('*, schedule:pm_schedules(id, pm_type, description, checklist, machine:machines(machine_code, machine_name))')
      .in('pm_schedule_id', scheduleIds)
      .order('scheduled_date', { ascending: true })
    records = (recs ?? []) as RecordRow[]
  }

  // Compliance: completed / (completed + overdue/pending past due + skipped)
  const completed = records.filter(r => r.status === 'completed').length
  const skipped = records.filter(r => r.status === 'skipped').length
  const overduePending = records.filter(r => r.status !== 'completed' && r.status !== 'skipped' && isOverdue(r.scheduled_date, r.status))
  const dueRecords = records.filter(r => r.status === 'pending' || r.status === 'overdue')
  const totalAccountable = completed + skipped + overduePending.length
  const compliance = totalAccountable > 0 ? Math.round((completed / totalAccountable) * 100) : 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Preventive Maintenance</h1>
        <Link href="/pm/schedules/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Jadwal PM Baru
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Kepatuhan PM" value={`${compliance}%`} color="bg-green-50 text-green-700" icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatCard label="Jadwal Aktif" value={String(schedules?.length ?? 0)} color="bg-blue-50 text-blue-700" icon={<CalendarCheck className="w-5 h-5" />} />
        <StatCard label="Jatuh Tempo" value={String(dueRecords.length)} color="bg-yellow-50 text-yellow-700" icon={<CalendarCheck className="w-5 h-5" />} />
        <StatCard label="Terlambat" value={String(overduePending.length)} color="bg-red-50 text-red-700" icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      {/* Due records */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Tugas PM Jatuh Tempo</h2>
        {dueRecords.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
            Tidak ada tugas PM yang jatuh tempo.
          </div>
        ) : (
          <div className="space-y-2">
            {dueRecords.map(r => {
              const overdue = isOverdue(r.scheduled_date, r.status)
              const checklist = parseChecklist(r.schedule?.checklist ?? null)
              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-lg border p-4 flex items-center justify-between ${
                    overdue ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {r.schedule?.machine?.machine_code} — {r.schedule?.machine?.machine_name}
                      </h3>
                      {overdue && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                          Terlambat
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>{r.schedule ? PM_TYPE_LABELS[r.schedule.pm_type] : ''}</span>
                      <span>
                        Jadwal: {format(new Date(r.scheduled_date), 'dd MMM yyyy', { locale: id })}
                      </span>
                    </div>
                    {r.schedule?.description && (
                      <p className="text-sm text-gray-600 mt-1">{r.schedule.description}</p>
                    )}
                  </div>
                  <PMRecordForm recordId={r.id} checklist={checklist} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Schedules list */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Jadwal PM Aktif</h2>
        {!schedules || schedules.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Belum ada jadwal PM</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {schedules.map(s => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {s.machine?.machine_code} — {s.machine?.machine_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {PM_TYPE_LABELS[s.pm_type as PMType]}
                    {s.description ? ` · ${s.description}` : ''}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {PM_TYPE_LABELS[s.pm_type as PMType]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className={`${color} rounded-lg p-5 border border-current border-opacity-20`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  )
}
