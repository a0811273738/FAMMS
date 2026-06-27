'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import SparePartsList from '@/components/spare-parts/SparePartsList'

interface Factory {
  id: string
  name: string
}

export default function SparePartsPage() {
  const { t } = useTranslation()
  const supabase = createClient()
  const [factories, setFactories] = useState<Factory[]>([])
  const [selectedFactory, setSelectedFactory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFactories()
  }, [])

  async function loadFactories() {
    try {
      const { data } = await supabase.from('factories').select('*').order('name')
      setFactories(data ?? [])
      if (data && data.length > 0) {
        setSelectedFactory(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load factories')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('spareParts.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">管理备品备件库存和供应商信息</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Label className="text-sm">{t('machines.factory')}</Label>
        <Select value={selectedFactory} onValueChange={(v) => setSelectedFactory(v ?? '')}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder={t('machines.selectFactory')} />
          </SelectTrigger>
          <SelectContent>
            {factories.map(f => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedFactory && <SparePartsList factoryId={selectedFactory} />}
    </div>
  )
}
