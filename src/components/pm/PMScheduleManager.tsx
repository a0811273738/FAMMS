'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react'

interface Factory { id: string; name: string }
interface Area { id: string; factory_id: string; name: string }
interface Machine {
  id: string
  machine_name: string
  machine_code: string | null
  maintenance_cycle: number
}
interface PMSchedule {
  id: string
  machine_id: string
  pm_type: string
  description: string | null
  is_active: boolean
  machine_name?: string
  machine_code?: string | null
}

const PM_TYPE_KEYS = [
  { value: 'daily', key: 'pm.daily' },
  { value: 'weekly', key: 'pm.weekly' },
  { value: 'monthly', key: 'pm.monthly' },
  { value: 'quarterly', key: 'pm.quarterly' },
  { value: 'half_yearly', key: 'pm.halfYearly' },
  { value: 'yearly', key: 'pm.yearly' },
]

export default function PMScheduleManager() {
  const { t } = useTranslation()
  const supabase = createClient()

  const [factories, setFactories] = useState<Factory[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [schedules, setSchedules] = useState<PMSchedule[]>([])
  const [loading, setLoading] = useState(true)

  const [factoryId, setFactoryId] = useState('')
  const [areaId, setAreaId] = useState('')
  const [machineId, setMachineId] = useState('')
  const [pmType, setPmType] = useState('monthly')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('factories').select('*').order('name').then(({ data }) => {
      setFactories(data ?? [])
      if (data && data.length > 0) setFactoryId(data[0].id)
      setLoading(false)
    })
    loadSchedules()
  }, [])

  useEffect(() => {
    if (!factoryId) { setAreas([]); setAreaId(''); return }
    supabase.from('areas').select('*').eq('factory_id', factoryId).order('name')
      .then(({ data }) => setAreas(data ?? []))
    setAreaId('')
  }, [factoryId])

  useEffect(() => {
    if (!areaId) { setMachines([]); setMachineId(''); return }
    supabase.from('machines').select('id, machine_name, machine_code, maintenance_cycle')
      .eq('area_id', areaId).neq('status', 'scrapped').order('machine_name')
      .then(({ data }) => setMachines(data ?? []))
    setMachineId('')
  }, [areaId])

  async function loadSchedules() {
    const { data } = await supabase
      .from('pm_schedules')
      .select(`id, machine_id, pm_type, description, is_active, machines:machines(machine_name, machine_code)`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (data) {
      setSchedules((data as any[]).map(s => ({
        id: s.id,
        machine_id: s.machine_id,
        pm_type: s.pm_type,
        description: s.description,
        is_active: s.is_active,
        machine_name: s.machines?.machine_name || '',
        machine_code: s.machines?.machine_code || null,
      })))
    }
  }

  async function submit() {
    if (!machineId) { toast.error(t('pm.selectMachineRequired')); return }

    setSubmitting(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('pm_schedules')
          .update({ pm_type: pmType, description: description || null })
          .eq('id', editingId)
        if (error) throw error
        toast.success(t('pm.scheduleUpdated'))
      } else {
        const { error } = await supabase
          .from('pm_schedules')
          .insert({ machine_id: machineId, pm_type: pmType, description: description || null, is_active: true })
        if (error) throw error
        toast.success(t('pm.scheduleCreated'))
      }
      setMachineId(''); setPmType('monthly'); setDescription('')
      setShowForm(false); setEditingId(null)
      loadSchedules()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function removeSchedule(id: string) {
    if (!confirm(t('pm.confirmDeactivate'))) return
    try {
      const { error } = await supabase.from('pm_schedules').update({ is_active: false }).eq('id', id)
      if (error) throw error
      toast.success(t('pm.deactivated'))
      loadSchedules()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.deleteFailed'))
    }
  }

  if (loading) return <div className="text-center text-gray-500 text-sm py-4">{t('common.loading')}</div>

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="gap-2 w-full">
          <Plus className="w-4 h-4" /> {t('pm.addSchedule')}
        </Button>
      )}

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-blue-900">
            {editingId ? t('pm.editSchedule') : t('pm.addSchedule')}
          </p>

          <Select value={factoryId} onValueChange={(v) => setFactoryId(v ?? '')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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

          {machines.length > 0 && (
            <Select value={machineId} onValueChange={(v) => setMachineId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder={t('machines.selectMachine') + ' *'} /></SelectTrigger>
              <SelectContent>
                {machines.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.machine_code ? `[${m.machine_code}] ` : ''}{m.machine_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div>
            <Label>{t('pm.frequency')}</Label>
            <Select value={pmType} onValueChange={(v) => setPmType(v ?? 'monthly')}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PM_TYPE_KEYS.map(pt => <SelectItem key={pt.value} value={pt.value}>{t(pt.key)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('pm.notesOptional')}</Label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('pm.notes') + '...'}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting || !machineId}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? t('common.update') : t('common.create')}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null) }}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {schedules.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{t('pm.noSchedules')}</p>
        ) : (
          schedules.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {s.machine_code ? `[${s.machine_code}] ` : ''}{s.machine_name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t(PM_TYPE_KEYS.find(pt => pt.value === s.pm_type)?.key || 'pm.monthly')}
                  {s.description && ` · ${s.description}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm" variant="outline"
                  onClick={() => {
                    setEditingId(s.id); setMachineId(s.machine_id)
                    setPmType(s.pm_type); setDescription(s.description || '')
                    setShowForm(true)
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => removeSchedule(s.id)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
