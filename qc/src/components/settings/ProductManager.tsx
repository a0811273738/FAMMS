'use client'

import { useEffect, useState } from 'react'
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
import { Loader2, Plus, Pencil, Package, BadgeCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import SettingsHeader from '@/components/settings/SettingsHeader'
import {
  PRODUCT_CATEGORY_LABELS, label, productName,
  type Product, type ProductCategory,
} from '@/types/qc'

const CATEGORIES: ProductCategory[] = [
  'nata_de_coco', 'tapioca_pearl', 'syrup', 'raw_material', 'packaging', 'other',
]

const EMPTY = {
  product_code: '', name_id: '', name_zh: '', name_en: '',
  category: 'nata_de_coco' as ProductCategory,
  md_number: '', halal_cert_no: '', halal_expiry: '',
}

export default function ProductManager() {
  const { t, locale } = useI18n()
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_code')
      if (error) throw error
      setProducts((data ?? []) as Product[])
    } catch {
      toast.error(t('common.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function startAdd() {
    setEditingId(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function startEdit(p: Product) {
    setEditingId(p.id)
    setForm({
      product_code: p.product_code,
      name_id: p.name_id,
      name_zh: p.name_zh ?? '',
      name_en: p.name_en ?? '',
      category: p.category,
      md_number: p.md_number ?? '',
      halal_cert_no: p.halal_cert_no ?? '',
      halal_expiry: p.halal_expiry ?? '',
    })
    setOpen(true)
  }

  async function submit() {
    if (!form.product_code.trim() || !form.name_id.trim()) {
      toast.error(t('common.required'))
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        product_code: form.product_code.trim(),
        name_id: form.name_id.trim(),
        name_zh: form.name_zh.trim() || null,
        name_en: form.name_en.trim() || null,
        category: form.category,
        md_number: form.md_number.trim() || null,
        halal_cert_no: form.halal_cert_no.trim() || null,
        halal_expiry: form.halal_expiry || null,
      }
      const { error } = editingId
        ? await supabase.from('products').update(payload).eq('id', editingId)
        : await supabase.from('products').insert(payload)
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
        title={t('products.title')}
        action={
          <Button onClick={startAdd} className="gap-1.5 h-10">
            <Plus className="w-4 h-4" /> {t('common.add')}
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-medium text-gray-700 mt-3">{t('products.empty')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('products.emptyHint')}</p>
          <Button onClick={startAdd} className="gap-1.5 mt-4 h-11">
            <Plus className="w-4 h-4" /> {t('products.add')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <Card key={p.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">{p.product_code}</span>
                    {p.halal_cert_no && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <BadgeCheck className="w-3 h-3" /> {t('products.halalBadge')}
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-gray-900 truncate">{productName(p, locale)}</div>
                  <div className="text-xs text-gray-500">
                    {label(PRODUCT_CATEGORY_LABELS[p.category], locale)}
                    {p.md_number ? ` · MD ${p.md_number}` : ''}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="shrink-0">
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
            <DialogTitle>{editingId ? t('products.edit') : t('products.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('products.code')}</Label>
              <Input value={form.product_code} onChange={e => set('product_code', e.target.value)} className="mt-1 font-mono" />
            </div>
            <div>
              <Label>{t('products.nameId')}</Label>
              <Input value={form.name_id} onChange={e => set('name_id', e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t('products.nameZh')}</Label>
                <Input value={form.name_zh} onChange={e => set('name_zh', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>{t('products.nameEn')}</Label>
                <Input value={form.name_en} onChange={e => set('name_en', e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>{t('products.category')}</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set('category', (v ?? 'other') as ProductCategory)}
                items={Object.fromEntries(CATEGORIES.map(c => [c, label(PRODUCT_CATEGORY_LABELS[c], locale)]))}
              >
                <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{label(PRODUCT_CATEGORY_LABELS[c], locale)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('products.mdNumber')}</Label>
              <Input value={form.md_number} onChange={e => set('md_number', e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t('products.halalCertNo')}</Label>
                <Input value={form.halal_cert_no} onChange={e => set('halal_cert_no', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>{t('products.halalExpiry')}</Label>
                <Input type="date" value={form.halal_expiry} onChange={e => set('halal_expiry', e.target.value)} className="mt-1" />
              </div>
            </div>
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
