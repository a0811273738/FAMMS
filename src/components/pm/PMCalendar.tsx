'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PMRecord {
  id: string
  pm_schedule_id: string
  scheduled_date: string
  completed_at: string | null
  status: 'pending' | 'completed' | 'overdue' | 'skipped'
  variance: number | null
  variance_label: string | null
  cost?: number | null
}

interface PMCalendarProps {
  machineId: string
  machineName: string
}

export default function PMCalendar({ machineId, machineName }: PMCalendarProps) {
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [records, setRecords] = useState<PMRecord[]>([])
  const [loading, setLoading] = useState(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  useEffect(() => {
    loadCalendarData()
  }, [monthStr, machineId])

  async function loadCalendarData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/pm/calendar?machine_id=${machineId}&month=${monthStr}`)
      const data = await res.json()
      setRecords(data.records || [])
    } catch (err) {
      toast.error(t('errors.loadingFailed'))
    } finally {
      setLoading(false)
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const weeks: number[][] = []

  let currentWeek: number[] = Array(firstDayOfMonth).fill(0)
  for (const day of days) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  }
  if (currentWeek.length > 0) {
    currentWeek.push(...Array(7 - currentWeek.length).fill(0))
    weeks.push(currentWeek)
  }

  function getRecordsForDay(day: number) {
    if (day === 0) return []
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return records.filter(r => r.scheduled_date === dateStr)
  }

  function getStatusColor(status: string) {
    return {
      completed: 'bg-green-100 text-green-700 border-green-300',
      pending: 'bg-blue-100 text-blue-700 border-blue-300',
      overdue: 'bg-red-100 text-red-700 border-red-300',
      skipped: 'bg-gray-100 text-gray-700 border-gray-300',
    }[status] || 'bg-gray-50'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{machineName} - 保养日历</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date(year, month - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium w-28 text-center">
            {year}年 {month + 1}月
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date(year, month + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* 日历头部 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, wIdx) =>
            week.map((day, dIdx) => {
              const dayRecords = getRecordsForDay(day)
              return (
                <div
                  key={`${wIdx}-${dIdx}`}
                  className={`min-h-24 p-1 rounded border ${
                    day === 0
                      ? 'bg-gray-50 border-gray-100'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  {day > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayRecords.map(record => (
                          <div
                            key={record.id}
                            className={`text-xs px-2 py-1 rounded border ${getStatusColor(
                              record.status
                            )}`}
                          >
                            <div className="font-medium">
                              {record.status === 'completed' ? '✓ 已完成' : '📋 计划'}
                            </div>
                            {record.variance_label && (
                              <div className="text-xs opacity-75">
                                {record.variance_label}
                              </div>
                            )}
                            {record.cost && (
                              <div className="text-xs opacity-75">${record.cost}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 图例 */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
            <span>计划中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
            <span>逾期</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div>
            <span>跳过</span>
          </div>
        </div>
      </div>

      {/* 保养记录摘要 */}
      {records.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-2">
          <h3 className="font-semibold text-blue-900">本月保养摘要</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-blue-600">已完成</div>
              <div className="font-bold text-blue-900">
                {records.filter(r => r.status === 'completed').length}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-600">计划中</div>
              <div className="font-bold text-blue-900">
                {records.filter(r => r.status === 'pending').length}
              </div>
            </div>
            <div>
              <div className="text-xs text-red-600">逾期</div>
              <div className="font-bold text-red-900">
                {records.filter(r => r.status === 'overdue').length}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-600">平均误差</div>
              <div className="font-bold text-blue-900">
                {records.filter(r => r.variance !== null).length > 0
                  ? (
                      records
                        .filter(r => r.variance !== null)
                        .reduce((sum, r) => sum + (r.variance || 0), 0) /
                      records.filter(r => r.variance !== null).length
                    ).toFixed(1)
                  : '-'}
                天
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
