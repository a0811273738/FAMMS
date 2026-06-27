import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/pm/due?factory_id=xxx&days_ahead=7
 *
 * 返回技师需要处理的 PM 任务：逾期、今日、未来 N 天内到期
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const factoryId = url.searchParams.get('factory_id')
  const daysAhead = parseInt(url.searchParams.get('days_ahead') || '7')

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const futureDate = new Date(today)
  futureDate.setDate(today.getDate() + daysAhead)
  const futureDateStr = futureDate.toISOString().split('T')[0]

  try {
    let scheduleQuery = supabase
      .from('pm_schedules')
      .select('id, machine_id, pm_type, description')
      .eq('is_active', true)

    if (factoryId) scheduleQuery = scheduleQuery.eq('factory_id', factoryId)

    const { data: schedules } = await scheduleQuery
    if (!schedules || schedules.length === 0) return Response.json([])

    const scheduleIds = schedules.map(s => s.id)

    const { data: records, error } = await supabase
      .from('pm_records')
      .select('id, pm_schedule_id, scheduled_date, status, delay_reason, findings')
      .in('pm_schedule_id', scheduleIds)
      .in('status', ['pending', 'overdue'])
      .lte('scheduled_date', futureDateStr)
      .order('scheduled_date', { ascending: true })

    if (error) throw error

    const machineIds = [...new Set(schedules.map(s => s.machine_id))]
    const { data: machines } = await supabase
      .from('machines')
      .select('id, machine_name, machine_code')
      .in('id', machineIds)

    const machineMap = Object.fromEntries((machines || []).map(m => [m.id, m]))
    const scheduleMap = Object.fromEntries(schedules.map(s => [s.id, s]))

    const tasks = (records || []).map(r => {
      const schedule = scheduleMap[r.pm_schedule_id]
      const machine = machineMap[schedule?.machine_id]
      const scheduled = new Date(r.scheduled_date)
      const daysOverdue = Math.floor((today.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: r.id,
        pm_schedule_id: r.pm_schedule_id,
        scheduled_date: r.scheduled_date,
        status: daysOverdue > 0 ? 'overdue' : 'pending',
        days_overdue: daysOverdue > 0 ? daysOverdue : 0,
        days_until: daysOverdue <= 0 ? Math.abs(daysOverdue) : 0,
        machine_id: schedule?.machine_id,
        machine_name: machine?.machine_name || 'Unknown',
        machine_code: machine?.machine_code || null,
        pm_type: schedule?.pm_type || '',
        description: schedule?.description || '',
      }
    })

    tasks.sort((a, b) => {
      if (a.days_overdue > 0 && b.days_overdue === 0) return -1
      if (a.days_overdue === 0 && b.days_overdue > 0) return 1
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    })

    return Response.json(tasks)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
