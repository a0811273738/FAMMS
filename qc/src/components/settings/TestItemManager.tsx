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
import { Loader2, Plus, Pencil, ListChecks, Search } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import SettingsHeader from '@/components/settings/SettingsHeader'
import {
  TEST_ITEM_CATEGORY_LABELS, RESULT_TYPE_LABELS, label, testItemName,
  type TestItem, type TestItemCategory, type ResultType,
} from '@/types/qc'

const CATEGORIES: TestItemCategory[] = ['sensory', 'physical', 'chemical', 'micro', 'packaging', 'hygiene']
const RESULT_TYPES: ResultType[] = ['numeric', 'pass_fail', 'select', 'text']

const EMPTY = {
  item_code: '', name_id: '', name_zh: '', name_en: '',
  category: 'physical' as TestItemCategory,
  result_type: 'numeric' as ResultType,
  unit: '', select_options: '', test_method: '', is_external: false,
}

export default function TestItemManager() {
  const { t, locale } = useI18n()
  const supabase = createClient()
  const [items, setItems] = useState<TestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | TestItemCategory>('all')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('test_items').select('*').order('item_code')
      if (error) throw error
      setItems((data ?? []) as TestItem[])
    } catch {
      toast.error(t('common.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(i => {
      if (filter !== 'all' && i.category !== filter) return false
      if (!q) return true
      return (
        i.item_code.toLowerCase().includes(q) ||
        (i.name_id ?? '').toLowerCase().includes(q) ||
        (i.name_en ?? '').toLowerCase().includes(q) ||
        (i.name_zh ?? '').toLowerCase().includes(q)
      )
    })
  }, [items, query, filter])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function startAdd() {
    setEditingId(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function startEdit(i: TestItem) {
    setEditingId(i.id)
    setForm({
      item_code: i.item_code,
      name_id: i.name_id,
      name_zh: i.name_zh ?? '',
      name_en: i.name_en ?? '',
      category: i.category,
      result_type: i.result_type,
      unit: i.unit ?? '',
      select_options: (i.select_options ?? []).join(', '),
      test_method: i.test_method ?? '',
      is_external: i.is_external,
    })
    setOpen(true)
  }

  async function submit() {
    if (!form.item_code.trim() || !form.name_id.trim()) {
      toast.error(t('common.required'))
      return
    }
    setSubmitting(true)
    try {
      const options = form.result_type === 'select'
        ? form.select_options.split(',').map(s => s.trim()).filter(Boolean)
        : null
      const payload = {
        item_code: form.item_code.trim(),
        name_id: form.name_id.trim(),
        name_zh: form.name_zh.trim() || null,
        name_en: form.name_en.trim() || null,
        category: form.category,
        result_type: form.result_type,
        unit: form.unit.trim() || null,
        select_options: options,
        test_method: form.test_method.trim() || null,
        is_external: form.is_external,
      }
      const { error } = editingId
        ? await supabase.from('test_items').update(payload).eq('id', editingId)
        : await supabase.from('test_items').insert(payload)
      if (error) throw error
      toast.success(t('common.saved'))
      setOpen(false)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <SettingsHeader
        title={t('testItems.title')}
        action={
          <Button onClick={startAdd} className="gap-1.5 h-10">
            <Plus className="w-4 h-4" /> {t('common.add')}
          </Button>
        }
      />

      {/* Search + category filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('testItems.searchPlaceholder')}
            className="pl-8 h-10"
          />
        </div>
        <Select
          value={filter}
          onValueChange={(v) => setFilter((v ?? 'all') as 'all' | TestItemCategory)}
          items={{ all: t('testItems.filterAll'), ...Object.fromEntries(CATEGORIES.map(c => [c, label(TEST_ITEM_CATEGORY_LABELS[c], locale)])) }}
        >
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('testItems.filterAll')}</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{label(TEST_ITEM_CATEGORY_LABELS[c], locale)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <ListChecks className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-medium text-gray-700 mt-3">{t('testItems.empty')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('testItems.emptyHint')}</p>
          <Button onClick={startAdd} className="gap-1.5 mt-4 h-11">
            <Plus className="w-4 h-4" /> {t('testItems.add')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(i => (
            <Card key={i.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-500">{i.item_code}</span>
                    <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                      {label(TEST_ITEM_CATEGORY_LABELS[i.category], locale)}
                    </span>
                    {i.is_external && (
                      <span className="text-[10px] font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                        {t('testItems.externalBadge')}
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-gray-900 truncate">{testItemName(i, locale)}</div>
                  <div className="text-xs text-gray-500">
                    {label(RESULT_TYPE_LABELS[i.result_type], locale)}
                    {i.unit ? ` · ${i.unit}` : ''}
                    {i.test_method ? ` · ${i.test_method}` : ''}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => startEdit(i)} className="shrink-0">
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? t('testItems.edit') : t('testItems.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('testItems.code')}</Label>
              <Input value={form.item_code} onChange={e => set('item_code', e.target.value.toUpperCase())} className="mt-1 font-mono" placeholder="PH_001" />
            </div>
            <div>
              <Label>{t('testItems.nameId')}</Label>
              <Input value={form.name_id} onChange={e => set('name_id', e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t('testItems.nameZh')}</Label>
                <Input value={form.name_zh} onChange={e => set('name_zh', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>{t('testItems.nameEn')}</Label>
                <Input value={form.name_en} onChange={e => set('name_en', e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t('testItems.category')}</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => set('category', (v ?? 'physical') as TestItemCategory)}
                  items={Object.fromEntries(CATEGORIES.map(c => [c, label(TEST_ITEM_CATEGORY_LABELS[c], locale)]))}
                >
                  <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{label(TEST_ITEM_CATEGORY_LABELS[c], locale)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('testItems.resultType')}</Label>
                <Select
                  value={form.result_type}
                  onValueChange={(v) => set('result_type', (v ?? 'numeric') as ResultType)}
                  items={Object.fromEntries(RESULT_TYPES.map(r => [r, label(RESULT_TYPE_LABELS[r], locale)]))}
                >
                  <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESULT_TYPES.map(r => <SelectItem key={r} value={r}>{label(RESULT_TYPE_LABELS[r], locale)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t('testItems.unit')}</Label>
              <Input value={form.unit} onChange={e => set('unit', e.target.value)} className="mt-1" placeholder="%, mm, °Brix, CFU/g" />
            </div>
            {form.result_type === 'select' && (
              <div>
                <Label>{t('testItems.selectOptions')}</Label>
                <Input value={form.select_options} onChange={e => set('select_options', e.target.value)} className="mt-1" placeholder="正常, 偏黃, 異常" />
                <p className="text-xs text-gray-400 mt-1">{t('testItems.selectOptionsHint')}</p>
              </div>
            )}
            <div>
              <Label>{t('testItems.testMethod')}</Label>
              <Input value={form.test_method} onChange={e => set('test_method', e.target.value)} className="mt-1" placeholder="SNI 01-4317 / AOAC / SOP-xx" />
            </div>
            <label className="flex items-center gap-2 py-1 cursor-pointer">
              <input type="checkbox" checked={form.is_external} onChange={e => set('is_external', e.target.checked)} className="w-4 h-4 accent-emerald-600" />
              <span className="text-sm text-gray-700">{t('testItems.isExternal')}</span>
            </label>
            <div className="flex gap-2 pt-2">
              <Button onClick={submit} disabled={submitting} className="flex-1 h-11">
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('common.save')}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="h-11">{t('common.cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
