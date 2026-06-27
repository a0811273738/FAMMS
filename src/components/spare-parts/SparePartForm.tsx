'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface SparePartFormProps {
  factoryId: string
  editingId?: string | null
  onSuccess: () => void
  onCancel: () => void
}

interface SparePart {
  id: string
  part_code: string
  part_name: string
  category: string | null
  unit_price: number | null
  stock_qty: number
  reorder_level: number
  supplier: string | null
  lead_time_days: number | null
}

export default function SparePartForm({ factoryId, editingId, onSuccess, onCancel }: SparePartFormProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    part_code: '',
    part_name: '',
    category: '',
    unit_price: '',
    stock_qty: '0',
    reorder_level: '5',
    supplier: '',
    lead_time_days: '',
  })

  useEffect(() => {
    if (editingId) {
      loadSparePart()
    }
  }, [editingId])

  async function loadSparePart() {
    try {
      const res = await fetch(`/api/spare-parts/${editingId}`)
      const data: SparePart = await res.json()
      setForm({
        part_code: data.part_code,
        part_name: data.part_name,
        category: data.category || '',
        unit_price: data.unit_price ? data.unit_price.toString() : '',
        stock_qty: data.stock_qty.toString(),
        reorder_level: data.reorder_level.toString(),
        supplier: data.supplier || '',
        lead_time_days: data.lead_time_days ? data.lead_time_days.toString() : '',
      })
    } catch (err) {
      toast.error(t('errors.loadingFailed'))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.part_code.trim() || !form.part_name.trim()) {
      toast.error(t('errors.requiredField'))
      return
    }

    setLoading(true)
    try {
      const url = editingId ? `/api/spare-parts/${editingId}` : '/api/spare-parts'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factory_id: factoryId,
          part_code: form.part_code.trim(),
          part_name: form.part_name.trim(),
          category: form.category.trim() || null,
          unit_price: form.unit_price ? parseFloat(form.unit_price) : null,
          stock_qty: parseInt(form.stock_qty) || 0,
          reorder_level: parseInt(form.reorder_level) || 5,
          supplier: form.supplier.trim() || null,
          lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days) : null,
        }),
      })

      if (!res.ok) throw new Error('Save failed')

      toast.success(editingId ? t('spareParts.updated') : t('spareParts.created'))
      onSuccess()
    } catch (err) {
      toast.error(t('errors.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t('spareParts.partCode')} *</Label>
          <Input
            value={form.part_code}
            onChange={e => setForm({ ...form, part_code: e.target.value })}
            placeholder="e.g., BEARING-001"
            className="mt-1"
            disabled={loading}
          />
        </div>
        <div>
          <Label>{t('spareParts.partName')} *</Label>
          <Input
            value={form.part_name}
            onChange={e => setForm({ ...form, part_name: e.target.value })}
            placeholder="e.g., Ball Bearing 6205"
            className="mt-1"
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t('spareParts.category')}</Label>
          <Input
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            placeholder="e.g., Mechanical"
            className="mt-1"
            disabled={loading}
          />
        </div>
        <div>
          <Label>{t('spareParts.unitPrice')}</Label>
          <Input
            type="number"
            step="0.01"
            value={form.unit_price}
            onChange={e => setForm({ ...form, unit_price: e.target.value })}
            placeholder="0.00"
            className="mt-1"
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>{t('spareParts.stockQty')}</Label>
          <Input
            type="number"
            value={form.stock_qty}
            onChange={e => setForm({ ...form, stock_qty: e.target.value })}
            placeholder="0"
            className="mt-1"
            disabled={loading}
          />
        </div>
        <div>
          <Label>{t('spareParts.reorderLevel')}</Label>
          <Input
            type="number"
            value={form.reorder_level}
            onChange={e => setForm({ ...form, reorder_level: e.target.value })}
            placeholder="5"
            className="mt-1"
            disabled={loading}
          />
        </div>
        <div>
          <Label>{t('spareParts.leadTimeDays')}</Label>
          <Input
            type="number"
            value={form.lead_time_days}
            onChange={e => setForm({ ...form, lead_time_days: e.target.value })}
            placeholder="0"
            className="mt-1"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <Label>{t('spareParts.supplier')}</Label>
        <Input
          value={form.supplier}
          onChange={e => setForm({ ...form, supplier: e.target.value })}
          placeholder="e.g., Company Name"
          className="mt-1"
          disabled={loading}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t('common.save')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
