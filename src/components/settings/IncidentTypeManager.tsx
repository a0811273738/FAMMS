'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Trash2, Plus, Pencil } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useIncidentTypes, invalidateIncidentTypes, type IncidentType } from '@/lib/useIncidentTypes'

// Seeded types whose display label comes from i18n (issueTypes.<code>), not the
// DB. We only let users rename the DB label for these; their `code` stays fixed
// so the multi-language board labels keep working.
const BUILT_IN_CODES = new Set([
  'machine', 'pipe', 'electrical', 'facility', 'safety', 'cleanliness', 'other',
])

export default function IncidentTypeManager() {
  const { t: tr } = useI18n()
  const supabase = createClient()
  // Shared cache drives the list; mutations call invalidateIncidentTypes() so
  // the report/edit/search forms pick up changes without a reload.
  const { types, loading } = useIncidentTypes()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function startAdd() {
    setEditingId(null)
    setLabel('')
    setShowForm(true)
  }

  function startEdit(t: IncidentType) {
    if (t.code === 'other') {
      toast.error(tr('settings.cannotEditOther'))
      return
    }
    setEditingId(t.id)
    setLabel(t.label)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setLabel('')
  }

  async function add() {
    const name = label.trim()
    if (!name) {
      toast.error(tr('settings.incidentTypeNameRequired'))
      return
    }
    setSubmitting(true)
    try {
      const maxOrder = types.reduce((m, t) => Math.max(m, t.sort_order), 0)
      // code = label for user-added types, so the board shows the label directly.
      const { error } = await supabase.from('incident_types').insert([{
        code: name,
        label: name,
        sort_order: maxOrder + 1,
        is_active: true,
      }])
      if (error) throw error
      toast.success(tr('settings.incidentTypeAdded'))
      closeForm()
      await invalidateIncidentTypes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr('settings.addFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function update() {
    const orig = types.find(t => t.id === editingId)
    if (!orig) return
    const name = label.trim()
    if (!name) {
      toast.error(tr('settings.incidentTypeNameRequired'))
      return
    }
    if (name === orig.label) {
      closeForm()
      return
    }
    setSubmitting(true)
    try {
      const isBuiltIn = BUILT_IN_CODES.has(orig.code)
      if (isBuiltIn) {
        // Built-in: board label comes from i18n; only the DB label changes.
        const { error } = await supabase
          .from('incident_types')
          .update({ label: name })
          .eq('id', orig.id)
        if (error) throw error
      } else {
        // User-added: keep code === label and migrate existing incidents so the
        // board (which shows the raw code as fallback) reflects the rename.
        // A duplicate name trips the incident_types_code_key UNIQUE constraint,
        // which surfaces via the catch below.
        const newCode = name
        const { error } = await supabase
          .from('incident_types')
          .update({ code: newCode, label: name })
          .eq('id', orig.id)
        if (error) throw error
        // Re-point historical incidents from the old code to the new one.
        const { error: migErr } = await supabase
          .from('incidents')
          .update({ incident_type: newCode })
          .eq('incident_type', orig.code)
        if (migErr) throw migErr
      }
      toast.success(tr('settings.incidentTypeUpdated'))
      closeForm()
      await invalidateIncidentTypes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr('settings.operationFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(id: string, code: string) {
    if (code === 'other') {
      toast.error(tr('settings.cannotDeleteOther'))
      return
    }
    if (!confirm(tr('settings.confirmDeleteIncidentType'))) return
    try {
      // Soft-delete so historical incidents keep their label mapping.
      const { error } = await supabase
        .from('incident_types')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
      toast.success(tr('settings.deleted'))
      await invalidateIncidentTypes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr('settings.deleteFailed'))
    }
  }

  if (loading) return <div className="text-center text-gray-500 text-sm py-2">{tr('settings.loading')}</div>

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button onClick={startAdd} className="gap-2">
          <Plus className="w-4 h-4" /> {tr('settings.addIncidentType')}
        </Button>
      )}

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {editingId ? tr('settings.editIncidentType') : tr('settings.addIncidentType')}
          </p>
          <div>
            <Label>{tr('settings.incidentTypeName')}</Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={tr('settings.incidentTypeNamePlaceholder')}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={editingId ? update : add} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? tr('settings.update') : tr('settings.create')}
            </Button>
            <Button variant="outline" onClick={closeForm}>
              {tr('settings.cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {types.map(t => (
          <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
            <p className="font-medium text-sm">{t.label}</p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => startEdit(t)}
                disabled={t.code === 'other'}
              >
                <Pencil className={`w-4 h-4 ${t.code === 'other' ? 'text-gray-300' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => remove(t.id, t.code)}
                disabled={t.code === 'other'}
              >
                <Trash2 className={`w-4 h-4 ${t.code === 'other' ? 'text-gray-300' : 'text-red-600'}`} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
