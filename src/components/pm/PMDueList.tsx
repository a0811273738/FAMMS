'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, SkipForward, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface PMTask {
  id: string
  pm_schedule_id: string
  scheduled_date: string
  status: 'pending' | 'overdue'
  days_overdue: number
  days_until: number
  machine_id: string
  machine_name: string
  machine_code: string | null
  pm_type: string
  description: string
}

interface ActionState {
  taskId: string
  mode: 'complete' | 'skip'
  findings: string
  delay_reason: string
  cost: string
}

const PM_TYPE_KEYS: Record<string, string> = {
  daily: 'pm.daily', weekly: 'pm.weekly', monthly: 'pm.monthly',
  quarterly: 'pm.quarterly', half_yearly: 'pm.halfYearly', yearly: 'pm.yearly',
}

export default function PMDueList({ factoryId }: { factoryId: string }) {
  const { t } = useTranslation()
  const [tasks, setTasks] = useState<PMTask[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [action, setAction] = useState<ActionState | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadTasks() }, [factoryId])

  async function loadTasks() {
    setLoading(true)
    try {
      const res = await fetch(`/api/pm/due?factory_id=${factoryId}&days_ahead=7`)
      const data = await res.json()
      setTasks(data)
    } catch {
      toast.error(t('errors.loadingFailed'))
    } finally {
      setLoading(false)
    }
  }

  function startAction(task: PMTask, mode: 'complete' | 'skip') {
    setAction({ taskId: task.id, mode, findings: '', delay_reason: '', cost: '' })
    setExpandedId(task.id)
  }

  async function submitAction() {
    if (!action) return
    if (action.mode === 'skip' && !action.delay_reason.trim()) {
      toast.error(t('pm.skipReasonRequired'))
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/pm/records/${action.taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action.mode,
          findings: action.findings || null,
          delay_reason: action.delay_reason || null,
          cost: action.cost ? parseFloat(action.cost) : null,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(action.mode === 'complete' ? t('pm.confirmComplete') : t('pm.confirmSkip'))
      setAction(null)
      setExpandedId(null)
      setTasks(prev => prev.filter(task => task.id !== action.taskId))
    } catch {
      toast.error(t('errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="py-8 text-center text-gray-400">{t('common.loading')}</div>

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">{t('pm.noDueTasks')}</p>
      </div>
    )
  }

  const overdueTasks = tasks.filter(task => task.days_overdue > 0)

  return (
    <div className="space-y-3">
      {overdueTasks.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-sm text-red-700 font-medium">
            {t('pm.overdueAlert', { count: overdueTasks.length })}
          </span>
        </div>
      )}

      {tasks.map(task => {
        const isExpanded = expandedId === task.id
        const isOverdue = task.days_overdue > 0
        const currentAction = action?.taskId === task.id ? action : null

        return (
          <div key={task.id} className={`bg-white rounded-xl border shadow-sm ${isOverdue ? 'border-red-200' : 'border-gray-200'}`}>
            <div
              className="flex items-center gap-3 p-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : task.id)}
            >
              <div className={`w-2 h-10 rounded-full shrink-0 ${
                isOverdue ? 'bg-red-500' : task.days_until === 0 ? 'bg-orange-400' : 'bg-blue-400'
              }`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 truncate">
                    {task.machine_code ? `[${task.machine_code}] ` : ''}{task.machine_name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
                    {t(PM_TYPE_KEYS[task.pm_type] || 'pm.monthly')}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{t('pm.scheduledDate')} {task.scheduled_date}</span>
                  {isOverdue ? (
                    <span className="text-xs font-semibold text-red-600">
                      {t('pm.daysOverdue', { count: task.days_overdue })}
                    </span>
                  ) : task.days_until === 0 ? (
                    <span className="text-xs font-semibold text-orange-600">{t('pm.dueToday')}</span>
                  ) : (
                    <span className="text-xs text-blue-600">{t('pm.daysUntil', { count: task.days_until })}</span>
                  )}
                </div>
              </div>

              {isExpanded
                ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              }
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                {task.description && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">{task.description}</p>
                )}

                {!currentAction && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startAction(task, 'complete')}
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('pm.completeMaintenance')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => startAction(task, 'skip')}
                      className="flex-1 gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <SkipForward className="w-4 h-4" />
                      {t('pm.skipWithReason')}
                    </Button>
                  </div>
                )}

                {currentAction?.mode === 'complete' && (
                  <div className="space-y-3 bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-green-800">{t('pm.recordComplete')}</h4>
                    <div>
                      <Label className="text-xs">{t('pm.findingsNotes')}</Label>
                      <Textarea
                        value={currentAction.findings}
                        onChange={e => setAction({ ...currentAction, findings: e.target.value })}
                        placeholder="e.g. oil change, filter cleaned, belt ok..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t('pm.maintenanceCost')}</Label>
                      <Input
                        type="number"
                        value={currentAction.cost}
                        onChange={e => setAction({ ...currentAction, cost: e.target.value })}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={submitAction}
                        disabled={submitting}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {t('pm.confirmComplete')}
                      </Button>
                      <Button variant="outline" onClick={() => setAction(null)}>{t('common.cancel')}</Button>
                    </div>
                  </div>
                )}

                {currentAction?.mode === 'skip' && (
                  <div className="space-y-3 bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h4 className="font-medium text-orange-800">
                      {t('pm.skipReason')} <span className="text-red-500">*</span>
                    </h4>
                    <Textarea
                      value={currentAction.delay_reason}
                      onChange={e => setAction({ ...currentAction, delay_reason: e.target.value })}
                      placeholder="e.g. machine in production, waiting for parts, understaffed..."
                      className="mt-1"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={submitAction}
                        disabled={submitting || !currentAction.delay_reason.trim()}
                        variant="outline"
                        className="flex-1 border-orange-400 text-orange-700 hover:bg-orange-100"
                      >
                        {t('pm.confirmSkip')}
                      </Button>
                      <Button variant="outline" onClick={() => setAction(null)}>{t('common.cancel')}</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <p className="text-xs text-center text-gray-400 py-2">
        {t('pm.showingTasks', { count: tasks.length })}
      </p>
    </div>
  )
}
