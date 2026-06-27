'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus, Wrench, Clock, CheckCircle, Settings, CalendarDays } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhTW, enUS } from 'date-fns/locale'
import OverdueMaintenanceAlert from './OverdueMaintenanceAlert'
import PMScheduleManager from './PMScheduleManager'
import PMDueList from './PMDueList'
import PMCalendar from './PMCalendar'

interface Factory { id: string; name: string }
interface Area { id: string; factory_id: string; name: string }
interface Machine {
  id: string
  area_id: string
  machine_name: string
  machine_code: string | null
  maintenance_cycle: number
  last_maintained_at?: string | null
}

interface MaintenanceLog {
  id: string
  machine_id: string
  notes: string | null
  performed_by: string | null
  performed_at: string
}

export default function PMPage() {
  const { i18n, t } = useTranslation()
  const supabase = createClient()

  const [factories, setFactories] = useState<Factory[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [lastMaintained, setLastMaintained] = useState<Record<string, string>>({})

  const [factoryId, setFactoryId] = useState('')
  const [areaId, setAreaId] = useState('')
  const [selectedMachineId, setSelectedMachineId] = useState('')
  const [notes, setNotes] = useState('')
  const [performer, setPerformer] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showSchedules, setShowSchedules] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [calendarMachineId, setCalendarMachineId] = useState<string | null>(null)
  const [calendarMachineName, setCalendarMachineName] = useState('')

  useEffect(() => {
    supabase.from('factories').select('*').order('name').then(({ data }) => setFactories(data ?? []))
  }, [])

  useEffect(() => {
    if (!factoryId) { setAreas([]); setAreaId(''); return }
    supabase.from('areas').select('*').eq('factory_id', factoryId).order('name')
      .then(({ data }) => setAreas(data ?? []))
    setAreaId('')
  }, [factoryId])

  useEffect(() => {
    if (!areaId) { setMachines([]); return }
    supabase.from('machines').select('*').eq('area_id', areaId).neq('status', 'scrapped').order('machine_name')
      .then(({ data }) => setMachines(data ?? []))
  }, [areaId])

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    const { data } = await supabase
      .from('maintenance_logs')
      .select('*')
      .order('performed_at', { ascending: false })
      .limit(50)
    setLogs(data ?? [])

    // Track last maintained per machine
    const map: Record<string, string> = {}
    for (const log of (data ?? [])) {
      if (!map[log.machine_id]) map[log.machine_id] = log.performed_at
    }
    setLastMaintained(map)
  }

  async function submitLog() {
    if (!selectedMachineId) { toast.error(t('common.error')); return }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('maintenance_logs').insert({
        machine_id: selectedMachineId,
        notes: notes || null,
        performed_by: performer || null,
        performed_at: new Date().toISOString(),
      })
      if (error) throw error
      toast.success(t('common.success'))
      setNotes('')
      setPerformer('')
      setSelectedMachineId('')
      setShowForm(false)
      loadLogs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function getDaysSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    return Math.floor(diff / 86400000)
  }

  function getStatusColor(machine: Machine) {
    const last = lastMaintained[machine.id]
    if (!last) return 'text-gray-400'
    const days = getDaysSince(last)
    const cycle = machine.maintenance_cycle || 30
    if (days > cycle) return 'text-red-500'
    if (days > cycle * 0.8) return 'text-amber-500'
    return 'text-green-500'
  }

  const displayMachines = machines.length > 0 ? machines : []
  const logsForSelected = selectedMachineId
    ? logs.filter(l => l.machine_id === selectedMachineId)
    : logs

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('pm.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pm.trackFrequency')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSchedules(!showSchedules)} variant="outline" className="gap-2">
            <Settings className="w-4 h-4" /> {t('pm.schedule')}
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> {t('pm.addMaintenance')}
          </Button>
        </div>
      </div>

      {factoryId && (
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-700">📋 {t('pm.pendingTasks')}</h2>
          <PMDueList factoryId={factoryId} />
        </div>
      )}

      {/* Overdue Alert */}
      <div className="border-l-4 border-amber-500 bg-amber-50 rounded-lg p-4">
        <OverdueMaintenanceAlert />
      </div>

      {/* PM Schedule Manager */}
      {showSchedules && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <PMScheduleManager />
        </div>
      )}

      {/* Add Maintenance Form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-blue-900">{t('pm.logMaintenance')}</h3>

          <Select value={factoryId} onValueChange={(v) => setFactoryId(v ?? '')}>
            <SelectTrigger><SelectValue placeholder={t('machines.selectFactory')} /></SelectTrigger>
            <SelectContent>
              {factories.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {areas.length > 0 && (
            <Select value={areaId} onValueChange={(v) => setAreaId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder={t('machines.selectArea')} /></SelectTrigger>
              <SelectContent>
                {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {displayMachines.length > 0 && (
            <Select value={selectedMachineId} onValueChange={(v) => setSelectedMachineId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder={t('machines.selectMachine') + ' *'} /></SelectTrigger>
              <SelectContent>
                {displayMachines.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.machine_code ? `[${m.machine_code}] ` : ''}{m.machine_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div>
            <Label>{t('pm.performedBy')}</Label>
            <input
              value={performer}
              onChange={e => setPerformer(e.target.value)}
              placeholder={t('pm.performedBy')}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <Label>{t('pm.notes')}</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Parts replaced, adjustments made, issues found..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={submitLog} disabled={submitting || !selectedMachineId}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}

      {/* Machine Status Overview */}
      {areaId && displayMachines.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm">{t('pm.machineStatus')}</h3>
          {displayMachines.map(m => {
            const last = lastMaintained[m.id]
            const daysSince = last ? getDaysSince(last) : null
            const statusColor = getStatusColor(m)

            return (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {m.machine_code ? `[${m.machine_code}] ` : ''}{m.machine_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('pm.maintenanceCycle')}: {m.maintenance_cycle} days
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      {last ? (
                        <>
                          <p className={`text-sm font-semibold ${statusColor}`}>
                            {t('pm.daysAgo', { count: daysSince })}
                          </p>
                          <p className="text-xs text-gray-400">{t('pm.lastMaintained')}</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">{t('pm.noRecordYet')}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const name = (m.machine_code ? `[${m.machine_code}] ` : '') + m.machine_name
                        setCalendarMachineId(calendarMachineId === m.id ? null : m.id)
                        setCalendarMachineName(name)
                      }}
                      className={`p-1.5 rounded-lg border flex items-center ${
                        calendarMachineId === m.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {calendarMachineId === m.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <PMCalendar machineId={m.id} machineName={calendarMachineName} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Recent Logs */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-700 text-sm">{t('pm.recentRecords')}</h3>
        {logs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('pm.noRecords')}</p>
          </div>
        ) : (
          logs.slice(0, 20).map(log => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">
                    {log.performed_by || t('pm.technician')}
                  </p>
                  {log.notes && (
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{log.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(log.performed_at), { addSuffix: true, locale: i18n.language === 'id' ? zhTW : enUS })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
