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
import { Loader2, Plus, Pencil, Users } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { COA_LANGUAGE_LABELS, label, type Customer, type CoaLanguage } from '@/types/qc'

const COA_LANGS: CoaLanguage[] = ['en', 'id']

const EMPTY = { code: '', name: '', country: '', contact: '', coa_language: 'en' as CoaLanguage, notes: '' }

export default function CustomerManager() {
  const { t, locale } = useI18n()
  const supabase = createClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('customers').select('*').order('name')
      if (error) throw error
      setCustomers((data ?? []) as Customer[])
    } catch {
      toast.error(t('common.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function startAdd() { setEditingId(null); setForm(EMPTY); setOpen(true) }
  function startEdit(c: Customer) {
    setEditingId(c.id)
    setForm({
      code: c.code ?? '', name: c.name, country: c.country ?? '',
      contact: c.contact ?? '', coa_language: c.coa_language, notes: c.notes ?? '',
    })
    setOpen(true)
  }

  async function submit() {
    if (!form.name.trim()) { toast.error(t('common.required')); return }
    setSubmitting(true)
    try {
      const payload = {
        code: form.code.trim() || null,
        name: form.name.trim(),
        country: form.country.trim() || null,
        contact: form.contact.trim() || null,
        coa_language: form.coa_language,
        notes: form.notes.trim() || null,
      }
      const { error } = editingId
        ? await supabase.from('customers').update(payload).eq('id', editingId)
        : await supabase.from('customers').insert(payload)
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
        title={t('customers.title')}
        action={<Button onClick={startAdd} className="gap-1.5 h-10"><Plus className="w-4 h-4" /> {t('common.add')}</Button>}
      />

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : customers.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-medium text-gray-700 mt-3">{t('customers.empty')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('customers.emptyHint')}</p>
          <Button onClick={startAdd} className="gap-1.5 mt-4 h-11"><Plus className="w-4 h-4" /> {t('customers.add')}</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {customers.map(c => (
            <Card key={c.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{c.name}</div>
                  <div className="text-xs text-gray-500">
                    {c.country ? `${c.country} · ` : ''}
                    CoA: {label(COA_LANGUAGE_LABELS[c.coa_language], locale)}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => startEdit(c)} className="shrink-0"><Pencil className="w-4 h-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? t('customers.edit') : t('customers.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('customers.name')}</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t('customers.code')}</Label>
                <Input value={form.code} onChange={e => set('code', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>{t('customers.country')}</Label>
                <Input value={form.country} onChange={e => set('country', e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>{t('customers.contact')}</Label>
              <Input value={form.contact} onChange={e => set('contact', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{t('customers.coaLanguage')}</Label>
              <Select
                value={form.coa_language}
                onValueChange={(v) => set('coa_language', (v ?? 'en') as CoaLanguage)}
                items={Object.fromEntries(COA_LANGS.map(l => [l, label(COA_LANGUAGE_LABELS[l], locale)]))}
              >
                <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COA_LANGS.map(l => <SelectItem key={l} value={l}>{label(COA_LANGUAGE_LABELS[l], locale)}</SelectItem>)}
                </SelectContent>
              </Select>
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
