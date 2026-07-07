'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, SlidersHorizontal, Save } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import SettingsHeader from '@/components/settings/SettingsHeader'
import {
  STAGE_LABELS, label, productName, testItemName,
  type Product, type TestItem, type Customer, type InspectionStage, type ProductSpec,
} from '@/types/qc'

// A locally editable spec row. `id` present = existing row; absent = new.
interface Row {
  id?: string
  test_item_id: string
  spec_min: string
  spec_max: string
  spec_target: string
  spec_text: string
  unit: string
  sample_count: string
  is_mandatory: boolean
  is_ccp: boolean
  regulation_ref: string
}

function toRow(s: ProductSpec): Row {
  return {
    id: s.id,
    test_item_id: s.test_item_id,
    spec_min: s.spec_min?.toString() ?? '',
    spec_max: s.spec_max?.toString() ?? '',
    spec_target: s.spec_target?.toString() ?? '',
    spec_text: s.spec_text ?? '',
    unit: '',
    sample_count: s.sample_count?.toString() ?? '1',
    is_mandatory: s.is_mandatory,
    is_ccp: s.is_ccp,
    regulation_ref: s.regulation_ref ?? '',
  }
}

const num = (s: string) => (s.trim() === '' ? null : Number(s))

export default function SpecEditor() {
  const { t, locale } = useI18n()
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [stages, setStages] = useState<InspectionStage[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [testItems, setTestItems] = useState<TestItem[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)

  const [productId, setProductId] = useState('')
  const [stage, setStage] = useState('')
  const [customerId, setCustomerId] = useState('') // '' = generic spec (customer_id NULL)

  const [rows, setRows] = useState<Row[]>([])
  const [loadingRows, setLoadingRows] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pickOpen, setPickOpen] = useState(false)

  const itemMap = useMemo(() => new Map(testItems.map(i => [i.id, i])), [testItems])

  useEffect(() => { loadMeta() }, [])

  async function loadMeta() {
    setLoadingMeta(true)
    try {
      const [p, s, c, ti] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true).order('product_code'),
        supabase.from('inspection_stages').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('customers').select('*').eq('is_active', true).order('name'),
        supabase.from('test_items').select('*').eq('is_active', true).order('item_code'),
      ])
      if (p.error) throw p.error
      setProducts((p.data ?? []) as Product[])
      setStages((s.data ?? []) as InspectionStage[])
      setCustomers((c.data ?? []) as Customer[])
      setTestItems((ti.data ?? []) as TestItem[])
    } catch {
      toast.error(t('common.connectionError'))
    } finally {
      setLoadingMeta(false)
    }
  }

  useEffect(() => {
    if (productId && stage) loadRows()
    else setRows([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, stage, customerId])

  async function loadRows() {
    setLoadingRows(true)
    try {
      let q = supabase
        .from('product_specs')
        .select('*')
        .eq('product_id', productId)
        .eq('stage', stage)
        .is('effective_to', null)
      q = customerId ? q.eq('customer_id', customerId) : q.is('customer_id', null)
      const { data, error } = await q
      if (error) throw error
      setRows(((data ?? []) as ProductSpec[]).map(toRow))
    } catch {
      toast.error(t('common.connectionError'))
      setRows([])
    } finally {
      setLoadingRows(false)
    }
  }

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  function removeRow(idx: number) {
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  function addItem(item: TestItem) {
    if (rows.some(r => r.test_item_id === item.id)) {
      setPickOpen(false)
      return
    }
    setRows(prev => [...prev, {
      test_item_id: item.id,
      spec_min: '', spec_max: '', spec_target: '', spec_text: '',
      unit: item.unit ?? '', sample_count: '1',
      is_mandatory: true, is_ccp: false, regulation_ref: '',
    }])
    setPickOpen(false)
  }

  // Save skeleton: writes the current rows to product_specs. Existing rows are
  // updated in place and version bumped; new rows inserted at version 1. Full
  // "close old version + open new effective_from" audit chaining lands in
  // Phase 2 (ch.4.1 versioning) — the button + payload shape are wired now.
  async function save() {
    if (!productId || !stage) return
    setSaving(true)
    try {
      for (const r of rows) {
        const payload = {
          product_id: productId,
          test_item_id: r.test_item_id,
          customer_id: customerId || null,
          stage,
          spec_min: num(r.spec_min),
          spec_max: num(r.spec_max),
          spec_target: num(r.spec_target),
          spec_text: r.spec_text.trim() || null,
          sample_count: Number(r.sample_count) || 1,
          is_mandatory: r.is_mandatory,
          is_ccp: r.is_ccp,
          regulation_ref: r.regulation_ref.trim() || null,
        }
        const { error } = r.id
          ? await supabase.from('product_specs').update(payload).eq('id', r.id)
          : await supabase.from('product_specs').insert(payload)
        if (error) throw error
      }
      toast.success(t('common.saved'))
      loadRows()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const ready = !!productId && !!stage
  const availableItems = testItems.filter(i => !rows.some(r => r.test_item_id === i.id))

  return (
    <div className="space-y-4">
      <SettingsHeader title={t('specs.title')} />

      {loadingMeta ? (
        <div className="flex justify-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <>
          {/* Selectors */}
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <Label className="text-xs text-gray-500">{t('specs.selectProduct')}</Label>
              <Select
                value={productId}
                onValueChange={(v) => setProductId(v ?? '')}
                items={Object.fromEntries(products.map(p => [p.id, productName(p, locale)]))}
              >
                <SelectTrigger className="mt-1 w-full h-10"><SelectValue placeholder={t('specs.selectProduct')} /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{productName(p, locale)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">{t('specs.selectStage')}</Label>
              <Select
                value={stage}
                onValueChange={(v) => setStage(v ?? '')}
                items={Object.fromEntries(stages.map(s => [s.code, label(STAGE_LABELS[s.code] ?? { zh: s.name_id, en: s.name_id, id: s.name_id }, locale)]))}
              >
                <SelectTrigger className="mt-1 w-full h-10"><SelectValue placeholder={t('specs.selectStage')} /></SelectTrigger>
                <SelectContent>
                  {stages.map(s => (
                    <SelectItem key={s.code} value={s.code}>
                      {label(STAGE_LABELS[s.code] ?? { zh: s.name_id, en: s.name_id, id: s.name_id }, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">{t('specs.selectCustomer')}</Label>
              <Select
                value={customerId || 'generic'}
                onValueChange={(v) => setCustomerId(v === 'generic' ? '' : (v ?? ''))}
                items={{ generic: t('specs.generic'), ...Object.fromEntries(customers.map(c => [c.id, c.name])) }}
              >
                <SelectTrigger className="mt-1 w-full h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic">{t('specs.generic')}</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!ready ? (
            <Card className="p-8 text-center">
              <SlidersHorizontal className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500 mt-3">{t('specs.chooseProductFirst')}</p>
            </Card>
          ) : loadingRows ? (
            <div className="flex justify-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" onClick={() => setPickOpen(true)} className="gap-1.5 h-10" disabled={availableItems.length === 0}>
                  <Plus className="w-4 h-4" /> {t('specs.addItem')}
                </Button>
                <Button onClick={save} disabled={saving || rows.length === 0} className="gap-1.5 h-10">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('specs.saveNewVersion')}
                </Button>
              </div>

              {rows.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-sm font-medium text-gray-700">{t('specs.empty')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('specs.emptyHint')}</p>
                </Card>
              ) : (
                <div className="overflow-x-auto -mx-1 px-1">
                  <table className="w-full min-w-[720px] text-sm border-separate border-spacing-y-1">
                    <thead>
                      <tr className="text-xs text-gray-500 text-left">
                        <th className="px-2 py-1 font-medium">{t('testItems.name')}</th>
                        <th className="px-1 py-1 font-medium w-16">{t('specs.min')}</th>
                        <th className="px-1 py-1 font-medium w-16">{t('specs.max')}</th>
                        <th className="px-1 py-1 font-medium w-16">{t('specs.target')}</th>
                        <th className="px-1 py-1 font-medium w-20">{t('specs.sampleCount')}</th>
                        <th className="px-1 py-1 font-medium w-12">{t('specs.mandatory')}</th>
                        <th className="px-1 py-1 font-medium w-12">{t('specs.ccp')}</th>
                        <th className="px-1 py-1 font-medium w-32">{t('specs.regulationRef')}</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => {
                        const item = itemMap.get(r.test_item_id)
                        return (
                          <tr key={r.id ?? `new-${r.test_item_id}`} className="bg-white">
                            <td className="px-2 py-1 rounded-l-lg border-y border-l border-gray-200">
                              <div className="font-medium text-gray-900">{item ? testItemName(item, locale) : r.test_item_id}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{item?.item_code}{item?.unit ? ` · ${item.unit}` : ''}</div>
                            </td>
                            <td className="px-1 py-1 border-y border-gray-200"><Input value={r.spec_min} onChange={e => updateRow(idx, { spec_min: e.target.value })} className="h-9 text-center" inputMode="decimal" /></td>
                            <td className="px-1 py-1 border-y border-gray-200"><Input value={r.spec_max} onChange={e => updateRow(idx, { spec_max: e.target.value })} className="h-9 text-center" inputMode="decimal" /></td>
                            <td className="px-1 py-1 border-y border-gray-200"><Input value={r.spec_target} onChange={e => updateRow(idx, { spec_target: e.target.value })} className="h-9 text-center" inputMode="decimal" /></td>
                            <td className="px-1 py-1 border-y border-gray-200"><Input value={r.sample_count} onChange={e => updateRow(idx, { sample_count: e.target.value })} className="h-9 text-center" inputMode="numeric" /></td>
                            <td className="px-1 py-1 border-y border-gray-200 text-center">
                              <input type="checkbox" checked={r.is_mandatory} onChange={e => updateRow(idx, { is_mandatory: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                            </td>
                            <td className="px-1 py-1 border-y border-gray-200 text-center">
                              <input type="checkbox" checked={r.is_ccp} onChange={e => updateRow(idx, { is_ccp: e.target.checked })} className="w-4 h-4 accent-red-600" />
                            </td>
                            <td className="px-1 py-1 border-y border-gray-200"><Input value={r.regulation_ref} onChange={e => updateRow(idx, { regulation_ref: e.target.value })} className="h-9" placeholder="SNI / BPOM" /></td>
                            <td className="px-1 py-1 rounded-r-lg border-y border-r border-gray-200 text-center">
                              <button onClick={() => removeRow(idx)} className="text-gray-300 hover:text-red-600" aria-label={t('common.delete')}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add-item picker */}
      <Dialog open={pickOpen} onOpenChange={setPickOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('specs.addItem')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {availableItems.map(i => (
              <button
                key={i.id}
                onClick={() => addItem(i)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between min-h-[44px]"
              >
                <span className="text-gray-900">{testItemName(i, locale)}</span>
                <span className="text-xs text-gray-400 font-mono">{i.item_code}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
