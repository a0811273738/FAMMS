import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/pm/calendar?machine_id=xxx&month=2024-01
 *
 * 返回单个机器的保养日历数据：
 * - scheduled: 计划保养日期
 * - completed: 已完成的保养
 * - variance: 误差天数（正数=提前，负数=逾期）
 * - next_due: 下次预计保养日期
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const machineId = url.searchParams.get('machine_id')
  const month = url.searchParams.get('month') // YYYY-MM

  if (!machineId || !month) {
    return Response.json({ error: 'Missing machine_id or month' }, { status: 400 })
  }

  try {
    // 获取 PM 计划和记录
    const { data: schedules, error: scheduleError } = await supabase
      .from('pm_schedules')
      .select('id, pm_type, description')
      .eq('machine_id', machineId)
      .eq('is_active', true)

    if (scheduleError) throw scheduleError

    // 获取该月的 PM 记录
    const monthStart = `${month}-01`
    const monthEnd = new Date(month + '-01')
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    const monthEndStr = monthEnd.toISOString().split('T')[0]

    const { data: records, error: recordError } = await supabase
      .from('pm_records')
      .select(`
        id,
        pm_schedule_id,
        scheduled_date,
        completed_at,
        status,
        findings,
        cost,
        pm_schedules(pm_type)
      `)
      .in('pm_schedule_id', schedules?.map(s => s.id) || [])
      .gte('scheduled_date', monthStart)
      .lt('scheduled_date', monthEndStr)

    if (recordError) throw recordError

    // 计算间距和误差
    const calendar = {
      month,
      machine_id: machineId,
      schedules: schedules || [],
      records: (records || []).map(r => {
        const scheduled = new Date(r.scheduled_date)
        const completed = r.completed_at ? new Date(r.completed_at) : null
        const variance = completed
          ? Math.floor((completed.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24))
          : null

        return {
          ...r,
          variance, // 正数=提前，负数=逾期
          variance_label: variance === null
            ? null
            : variance > 0
            ? `提前 ${variance} 天`
            : variance < 0
            ? `逾期 ${Math.abs(variance)} 天`
            : '按时'
        }
      })
    }

    return Response.json(calendar)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
