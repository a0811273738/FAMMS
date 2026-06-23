'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ActionType, ACTION_TYPE_LABELS,
  IncidentStatus, INCIDENT_STATUS_LABELS,
  CompletionType, COMPLETION_TYPE_LABELS,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const ACTION_TYPES = Object.keys(ACTION_TYPE_LABELS) as ActionType[]
const STATUSES = Object.keys(INCIDENT_STATUS_LABELS) as IncidentStatus[]

export default function ActionForm({ incidentId }: { incidentId: string }) {
  const router = useRouter()
  const [actionType, setActionType] = useState<ActionType | ''>('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [newStatus, setNewStatus] = useState<IncidentStatus | ''>('')
  const [completionType, setCompletionType] = useState<CompletionType | ''>('')
  const [submitting, setSubmitting] = useState(false)

  // Completion type only relevant for fix-type actions
  const showCompletion = actionType === 'temporary_fix' || actionType === 'corrective_action'

  async function submit() {
    if (!actionType) {
      toast.error('Pilih jenis action')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/incidents/${incidentId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionType,
          description,
          duration_minutes: duration ? Number(duration) : undefined,
          new_status: newStatus || undefined,
          completion_type: showCompletion && completionType ? completionType : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menambah action')
      toast.success('Action ditambahkan')
      setActionType(''); setDescription(''); setDuration(''); setNewStatus(''); setCompletionType('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah action')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Tambah Action</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Jenis Action <span className="text-red-500">*</span></Label>
          <Select value={actionType} onValueChange={(v) => setActionType(v as ActionType)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih" /></SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map(t => <SelectItem key={t} value={t}>{ACTION_TYPE_LABELS[t]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Durasi (menit)</Label>
          <Input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="0"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label>Deskripsi</Label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Apa yang dilakukan?"
          className="mt-1"
          rows={2}
        />
      </div>

      {showCompletion && (
        <div>
          <Label>Tipe Penyelesaian</Label>
          <Select value={completionType} onValueChange={(v) => setCompletionType(v as CompletionType)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Temporary / Permanent" /></SelectTrigger>
            <SelectContent>
              {(Object.keys(COMPLETION_TYPE_LABELS) as CompletionType[]).map(t => (
                <SelectItem key={t} value={t}>{COMPLETION_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>Ubah Status Incident (opsional)</Label>
        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as IncidentStatus)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Tidak diubah" /></SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{INCIDENT_STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={submit} disabled={submitting} className="w-full">
        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Simpan Action
      </Button>
    </div>
  )
}
