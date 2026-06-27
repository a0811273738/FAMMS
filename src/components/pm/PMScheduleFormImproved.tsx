'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface PMScheduleFormImprovedProps {
  machineId: string
  machineName: string
  onSuccess: () => void
  onCancel: () => void
}

const PM_TYPE_DAYS = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  half_yearly: 180,
  yearly: 365,
}

export default function PMScheduleFormImproved({
  machineId,
  machineName,
  onSuccess,
  onCancel,
}: PMScheduleFormImprovedProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    pm_type: 'monthly',
    interval_days: '30',
    description: '',
    checklist: '',
  })

  function handlePmTypeChange(type: string) {
    setForm({
      ...form,
      pm_type: type,
      interval_days: PM_TYPE_DAYS[type as keyof typeof PM_TYPE_DAYS].toString(),
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.interval_days || parseInt(form.interval_days) <= 0) {
      toast.error('保养间隔天数必须大于 0')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/pm/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machineId,
          pm_type: form.pm_type,
          interval_days: parseInt(form.interval_days),
          description: form.description.trim(),
          checklist: form.checklist
            ? form.checklist.split('\n').filter(item => item.trim())
            : [],
        }),
      })

      if (!res.ok) throw new Error('Save failed')

      toast.success('保养计划已创建')
      onSuccess()
    } catch (err) {
      toast.error(t('errors.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h3 className="font-semibold text-lg">新增保养计划 - {machineName}</h3>

      {/* 保养类型 */}
      <div>
        <Label>保养类型</Label>
        <Select value={form.pm_type} onValueChange={(v) => handlePmTypeChange(v ?? '')}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">每日</SelectItem>
            <SelectItem value="weekly">每周</SelectItem>
            <SelectItem value="monthly">每月</SelectItem>
            <SelectItem value="quarterly">每季度</SelectItem>
            <SelectItem value="half_yearly">每半年</SelectItem>
            <SelectItem value="yearly">每年</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 自定义间隔天数 */}
      <div className="bg-blue-50 rounded p-4 space-y-2 border border-blue-200">
        <Label>
          <span className="font-medium">自定义保养间隔</span>
          <span className="text-xs text-gray-500 ml-2">
            (如需灵活调整，可自由填写天数)
          </span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            value={form.interval_days}
            onChange={e => setForm({ ...form, interval_days: e.target.value })}
            placeholder="间隔天数"
            className="flex-1"
          />
          <span className="text-sm text-gray-600">天</span>
        </div>
        <p className="text-xs text-blue-600">
          💡 下次保养日期 = 上次完成日期 + {form.interval_days} 天
        </p>
      </div>

      {/* 描述 */}
      <div>
        <Label>保养描述</Label>
        <Textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="e.g. 检查机油、清洁过滤器、检查皮带..."
          className="mt-1"
          rows={2}
        />
      </div>

      {/* 检查清单 */}
      <div>
        <Label>检查清单 (每行一项)</Label>
        <Textarea
          value={form.checklist}
          onChange={e => setForm({ ...form, checklist: e.target.value })}
          placeholder={`检查机油\n清洁过滤器\n检查皮带磨损\n润滑轴承\n测试运行`}
          className="mt-1"
          rows={4}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          创建计划
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          取消
        </Button>
      </div>
    </form>
  )
}
