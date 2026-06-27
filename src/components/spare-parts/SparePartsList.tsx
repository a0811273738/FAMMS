'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit2, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import SparePartForm from './SparePartForm'

interface SparePart {
  id: string
  factory_id: string
  part_code: string
  part_name: string
  category: string | null
  unit_price: number | null
  stock_qty: number
  reorder_level: number
  supplier: string | null
  lead_time_days: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface SparePartsListProps {
  factoryId: string
}

export default function SparePartsList({ factoryId }: SparePartsListProps) {
  const { t } = useTranslation()
  const [spareParts, setSpareParts] = useState<SparePart[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadSpareParts()
  }, [factoryId])

  async function loadSpareParts() {
    try {
      const res = await fetch(`/api/spare-parts?factory_id=${factoryId}`)
      const data = await res.json()
      setSpareParts(data)
    } catch (err) {
      toast.error(t('errors.loadingFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function deleteSparePart(id: string) {
    if (!confirm(t('spareParts.confirmDelete'))) return

    try {
      const res = await fetch(`/api/spare-parts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')

      setSpareParts(spareParts.filter(p => p.id !== id))
      toast.success(t('spareParts.deleted'))
    } catch (err) {
      toast.error(t('spareParts.deleted'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('spareParts.title')}</h2>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('spareParts.addNew')}
        </Button>
      </div>

      {showForm && (
        <SparePartForm
          factoryId={factoryId}
          editingId={editingId}
          onSuccess={() => {
            setShowForm(false)
            setEditingId(null)
            loadSpareParts()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingId(null)
          }}
        />
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">{t('common.loading')}</div>
      ) : spareParts.length === 0 ? (
        <div className="text-center py-8 text-gray-400">{t('spareParts.noData')}</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t('spareParts.partCode')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('spareParts.partName')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('spareParts.category')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('spareParts.unitPrice')}</th>
                <th className="px-4 py-3 text-center font-semibold">{t('spareParts.stockQty')}</th>
                <th className="px-4 py-3 text-center font-semibold">{t('spareParts.supplier')}</th>
                <th className="px-4 py-3 text-center font-semibold">{t('spareParts.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {spareParts.map(part => (
                <tr key={part.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{part.part_code}</td>
                  <td className="px-4 py-3 font-medium">{part.part_name}</td>
                  <td className="px-4 py-3 text-gray-600">{part.category || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {part.unit_price ? `$${part.unit_price.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        part.stock_qty <= part.reorder_level
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {part.stock_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{part.supplier || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingId(part.id)
                          setShowForm(true)
                        }}
                        className="p-1 hover:bg-blue-50 rounded text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSparePart(part.id)}
                        className="p-1 hover:bg-red-50 rounded text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
