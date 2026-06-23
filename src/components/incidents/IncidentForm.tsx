'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Machine, FailureCategory, FailureCode, DowntimeImpact, DOWNTIME_IMPACT_LABELS,
} from '@/types'
import { SLA_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'

const IMPACTS: DowntimeImpact[] = ['A', 'B', 'C', 'D']

export default function IncidentForm() {
  const router = useRouter()
  const supabase = createClient()

  const [machines, setMachines] = useState<Machine[]>([])
  const [categories, setCategories] = useState<FailureCategory[]>([])
  const [codes, setCodes] = useState<FailureCode[]>([])

  const [machineId, setMachineId] = useState('')
  const [mainCatId, setMainCatId] = useState('')
  const [subCatId, setSubCatId] = useState('')
  const [failureCodeId, setFailureCodeId] = useState('')
  const [impact, setImpact] = useState<DowntimeImpact>('D')
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: m }, { data: cats }, { data: fc }] = await Promise.all([
        supabase.from('machines').select('*').neq('status', 'scrapped').order('machine_code'),
        supabase.from('failure_categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('failure_codes').select('*').eq('is_active', true).order('display_order'),
      ])
      setMachines(m ?? [])
      setCategories(cats ?? [])
      setCodes(fc ?? [])
    }
    load()
  }, [])

  // Cascade derivations
  const mainCats = useMemo(() => categories.filter(c => c.level === 1), [categories])
  const subCats = useMemo(
    () => categories.filter(c => c.level === 2 && c.parent_id === mainCatId),
    [categories, mainCatId]
  )
  const leafCodes = useMemo(
    () => codes.filter(c => c.category_id === subCatId),
    [codes, subCatId]
  )

  async function submit() {
    if (!machineId || !failureCodeId) {
      toast.error('Pilih mesin dan failure code')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machineId,
          failure_code_id: failureCodeId,
          downtime_impact: impact,
          remarks,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal membuat incident')

      if (json.potential_repeats?.length > 0) {
        const nos = json.potential_repeats.map((p: { incident_no: string }) => p.incident_no).join(', ')
        toast.warning(`⚠️ Suspek Repeat Failure: ${nos}. Supervisor harus konfirmasi.`, { duration: 6000 })
      } else {
        toast.success(`Incident ${json.incident.incident_no} dibuat`)
      }
      router.push(`/incidents/${json.incident.id}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat incident')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {/* Machine */}
      <div>
        <Label>Mesin <span className="text-red-500">*</span></Label>
        <Select value={machineId} onValueChange={(v) => setMachineId(v ?? '')}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih mesin" /></SelectTrigger>
          <SelectContent>
            {machines.map(m => (
              <SelectItem key={m.id} value={m.id}>
                {m.machine_code} — {m.machine_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {machines.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">Belum ada mesin terdaftar. Tambah mesin dulu.</p>
        )}
      </div>

      {/* Fault tree cascade */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label>Kategori <span className="text-red-500">*</span></Label>
          <Select
            value={mainCatId}
            onValueChange={(v) => { setMainCatId(v ?? ''); setSubCatId(''); setFailureCodeId('') }}
          >
            <SelectTrigger className="mt-1"><SelectValue placeholder="Main" /></SelectTrigger>
            <SelectContent>
              {mainCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Sub-Kategori <span className="text-red-500">*</span></Label>
          <Select
            value={subCatId}
            onValueChange={(v) => { setSubCatId(v ?? ''); setFailureCodeId('') }}
            disabled={!mainCatId}
          >
            <SelectTrigger className="mt-1"><SelectValue placeholder="Sub" /></SelectTrigger>
            <SelectContent>
              {subCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Failure Code <span className="text-red-500">*</span></Label>
          <Select value={failureCodeId} onValueChange={(v) => setFailureCodeId(v ?? '')} disabled={!subCatId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Code" /></SelectTrigger>
            <SelectContent>
              {leafCodes.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="font-mono text-xs text-gray-400 mr-1">{c.code}</span>{c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Downtime impact */}
      <div>
        <Label>Dampak Downtime <span className="text-red-500">*</span></Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
          {IMPACTS.map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setImpact(i)}
              className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                impact === i ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="font-bold">{i}</span>
              <span className="block text-xs text-gray-500">{DOWNTIME_IMPACT_LABELS[i]}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> SLA respons: {SLA_LABELS[impact]}
        </p>
      </div>

      {/* Remarks */}
      <div>
        <Label htmlFor="remarks">Deskripsi / Catatan</Label>
        <Textarea
          id="remarks"
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          placeholder="Jelaskan gejala kerusakan, kondisi saat terjadi, dll."
          className="mt-1"
          rows={3}
        />
      </div>

      <Button onClick={submit} disabled={submitting} className="w-full">
        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Buat Incident
      </Button>
    </div>
  )
}
