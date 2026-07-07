'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, LayoutTemplate, Save, ChevronUp, ChevronDown, Plus, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import SettingsHeader from '@/components/settings/SettingsHeader'
import {
  STAGE_LABELS, label, productName, testItemName,
  type Product, type TestItem, type InspectionStage, type InspectionTemplate, type TemplateItem,
} from '@/types/qc'

export default function TemplateManager() {
  const { t, locale } = useI18n()
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [stages, setStages] = useState<InspectionStage[]>([])
  const [testItems, setTestItems] = useState<TestItem[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)

  const [productId, setProductId] = useState('')
  const [stage, setStage] = useState('')

  const [templateId, setTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [samplingNote, setSamplingNote] = useState('')
  const [selected, setSelected] = useState<string[]>([]) // ordered test_item_ids
  const [loadingTpl, setLoadingTpl] = useState(false)
  const [saving, setSaving] = useState(false)

  const itemMap = useMemo(() => new Map(testItems.map(i => [i.id, i])), [testItems])

  useEffect(() => { loadMeta() }, [])

  async function loadMeta() {
    setLoadingMeta(true)
    try {
      const [p, s, ti] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true).order('product_code'),
        supabase.from('inspection_stages').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('test_items').select('*').eq('is_active', true).order('item_code'),
      ])
      if (p.error) throw p.error
      setProducts((p.data ?? []) as Product[])
      setStages((s.data ?? []) as InspectionStage[])
      setTestItems((ti.data ?? []) as TestItem[])
    } catch {
      toast.error(t('common.connectionError'))
    } finally {
      setLoadingMeta(false)
    }
  }

  useEffect(() => {
    if (productId && stage) loadTemplate()
    else resetTemplate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, stage])

  function resetTemplate() {
    setTemplateId(null); setTemplateName(''); setSamplingNote(''); setSelected([])
  }

  async function loadTemplate() {
    setLoadingTpl(true)
    try {
      const { data: tpl, error } = await supabase
        .from('inspection_templates')
        .select('*')
        .eq('product_id', productId)
        .eq('stage', stage)
        .eq('is_active', true)
        .order('created_at')
        .limit(1)
        .maybeSingle()
      if (error) throw error

      if (tpl) {
        const template = tpl as InspectionTemplate
        setTemplateId(template.id)
        setTemplateName(template.template_name)
        setSamplingNote(template.sampling_note ?? '')
        const { data: tis } = await supabase
          .from('template_items')
          .select('*')
          .eq('template_id', template.id)
          .order('sort_order')
        setSelected(((tis ?? []) as TemplateItem[]).map(ti => ti.test_item_id))
      } else {
        const prod = products.find(p => p.id === productId)
        const st = stages.find(s => s.code === stage)
        setTemplateId(null)
        setTemplateName(`${prod ? productName(prod, locale) : ''} · ${st ? label(STAGE_LABELS[st.code] ?? { zh: st.name_id, en: st.name_id, id: st.name_id }, locale) : ''}`)
        setSamplingNote('')
        setSelected([])
      }
    } catch {
      toast.error(t('common.connectionError'))
      resetTemplate()
    } finally {
      setLoadingTpl(false)
    }
  }

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function move(id: string, dir: -1 | 1) {
    setSelected(prev => {
      const i = prev.indexOf(id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  async function save() {
    if (!productId || !stage || !templateName.trim()) {
      toast.error(t('common.required'))
      return
    }
    setSaving(true)
    try {
      let id = templateId
      if (id) {
        const { error } = await supabase.from('inspection_templates')
          .update({ template_name: templateName.trim(), sampling_note: samplingNote.trim() || null })
          .eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('inspection_templates')
          .insert({ template_name: templateName.trim(), product_id: productId, stage, sampling_note: samplingNote.trim() || null })
          .select('id')
          .single()
        if (error) throw error
        id = (data as { id: string }).id
        setTemplateId(id)
      }
      // Reconcile items: clear then re-insert in the chosen order.
      await supabase.from('template_items').delete().eq('template_id', id)
      if (selected.length > 0) {
        const rows = selected.map((tiId, idx) => ({ template_id: id, test_item_id: tiId, sort_order: idx }))
        const { error } = await supabase.from('template_items').insert(rows)
        if (error) throw error
      }
      toast.success(t('common.saved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const ready = !!productId && !!stage
  const orderedSelected = selected.map(id => itemMap.get(id)).filter(Boolean) as TestItem[]
  const unselected = testItems.filter(i => !selected.includes(i.id))

  return (
    <div className="space-y-4">
      <SettingsHeader title={t('templates.title')} />

      {loadingMeta ? (
        <div className="flex justify-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-gray-500">{t('templates.selectProduct')}</Label>
              <Select value={productId} onValueChange={(v) => setProductId(v ?? '')} items={Object.fromEntries(products.map(p => [p.id, productName(p, locale)]))}>
                <SelectTrigger className="mt-1 w-full h-10"><SelectValue placeholder={t('templates.selectProduct')} /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{productName(p, locale)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">{t('templates.selectStage')}</Label>
              <Select value={stage} onValueChange={(v) => setStage(v ?? '')} items={Object.fromEntries(stages.map(s => [s.code, label(STAGE_LABELS[s.code] ?? { zh: s.name_id, en: s.name_id, id: s.name_id }, locale)]))}>
                <SelectTrigger className="mt-1 w-full h-10"><SelectValue placeholder={t('templates.selectStage')} /></SelectTrigger>
                <SelectContent>
                  {stages.map(s => <SelectItem key={s.code} value={s.code}>{label(STAGE_LABELS[s.code] ?? { zh: s.name_id, en: s.name_id, id: s.name_id }, locale)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!ready ? (
            <Card className="p-8 text-center">
              <LayoutTemplate className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500 mt-3">{t('templates.chooseProductFirst')}</p>
            </Card>
          ) : loadingTpl ? (
            <div className="flex justify-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <>
              <div>
                <Label>{t('templates.templateName')}</Label>
                <Input value={templateName} onChange={e => setTemplateName(e.target.value)} className="mt-1 h-10" />
              </div>
              <div>
                <Label>{t('templates.samplingNote')}</Label>
                <Input value={samplingNote} onChange={e => setSamplingNote(e.target.value)} className="mt-1 h-10" placeholder="每批抽3桶 · setiap 2 jam" />
              </div>

              {/* Selected items (ordered) */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('templates.items')} ({orderedSelected.length})</h2>
                {orderedSelected.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-sm font-medium text-gray-700">{t('templates.empty')}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('templates.emptyHint')}</p>
                  </Card>
                ) : (
                  <div className="space-y-1.5">
                    {orderedSelected.map((item, idx) => (
                      <Card key={item.id} className="p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400 w-5 text-center">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate text-sm">{testItemName(item, locale)}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{item.item_code}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => move(item.id, -1)} disabled={idx === 0} className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30" aria-label="up"><ChevronUp className="w-4 h-4" /></button>
                            <button onClick={() => move(item.id, 1)} disabled={idx === orderedSelected.length - 1} className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30" aria-label="down"><ChevronDown className="w-4 h-4" /></button>
                            <button onClick={() => toggle(item.id)} className="w-8 h-8 flex items-center justify-center rounded text-emerald-600 hover:bg-emerald-50" aria-label="remove"><Check className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Available items to add */}
              {unselected.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('templates.addItem')}</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {unselected.map(i => (
                      <button
                        key={i.id}
                        onClick={() => toggle(i.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-emerald-400 hover:text-emerald-700 min-h-[36px]"
                      >
                        <Plus className="w-3.5 h-3.5" /> {testItemName(i, locale)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={save} disabled={saving} className="w-full gap-1.5 h-12 text-base">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('templates.save')}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  )
}
