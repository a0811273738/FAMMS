import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/pm/calendar?factory_id=xxx&month=YYYY-MM&machine_id=xxx(optional)
 *
 * Returns all PM events for a factory in a month, grouped by date.
 * Optional machine_id filter to show single machine.
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const factoryId = url.searchParams.get('factory_id')
  const machineId = url.searchParams.get('machine_id') // optional filter
  const month = url.searchParams.get('month') // YYYY-MM

  if (!factoryId || !month) {
    return Response.json({ error: 'Missing factory_id or month' }, { status: 400 })
  }

  try {
    // Get schedules for this factory (optionally filtered by machine)
    let scheduleQuery = supabase
      .from('pm_schedules')
      .select('id, machine_id, pm_type, description')
      .eq('factory_id', factoryId)
      .eq('is_active', true)

    if (machineId) scheduleQuery = scheduleQuery.eq('machine_id', machineId)

    const { data: schedules } = await scheduleQuery
    if (!schedules || schedules.length === 0) return Response.json({ month, events: [], machines: [] })

    // Get machine details
    const machineIds = [...new Set(schedules.map(s => s.machine_id))]
    const { data: machines } = await supabase
      .from('machines')
      .select('id, machine_name, machine_code')
      .in('id', machineIds)

    const machineMap = Object.fromEntries((machines || []).map(m => [m.id, m]))
    const scheduleMap = Object.fromEntries(schedules.map(s => [s.id, s]))

    // Get PM records for the month
    const monthStart = `${month}-01`
    const monthEnd = new Date(month + '-01')
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    const monthEndStr = monthEnd.toISOString().split('T')[0]

    const { data: records } = await supabase
      .from('pm_records')
      .select('id, pm_schedule_id, scheduled_date, completed_at, status, delay_reason, cost')
      .in('pm_schedule_id', schedules.map(s => s.id))
      .gte('scheduled_date', monthStart)
      .lt('scheduled_date', monthEndStr)

    // Group events by date
    const byDate: Record<string, any[]> = {}
    const today = new Date().toISOString().split('T')[0]

    for (const r of (records || [])) {
      const schedule = scheduleMap[r.pm_schedule_id]
      if (!schedule) continue
      const machine = machineMap[schedule.machine_id]
      if (!machine) continue

      const date = r.scheduled_date
      if (!byDate[date]) byDate[date] = []

      // Determine effective status
      let status = r.status
      if (status === 'pending' && date < today) status = 'overdue'

      byDate[date].push({
        record_id: r.id,
        machine_id: schedule.machine_id,
        machine_name: machine.machine_name,
        machine_code: machine.machine_code,
        pm_type: schedule.pm_type,
        description: schedule.description,
        scheduled_date: date,
        completed_at: r.completed_at,
        status,
        cost: r.cost,
        delay_reason: r.delay_reason,
      })
    }

    // Convert to sorted array
    const events = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tasks]) => ({ date, tasks }))

    // Machine list for filter
    const machineList = (machines || []).map(m => ({
      id: m.id,
      machine_name: m.machine_name,
      machine_code: m.machine_code,
    }))

    return Response.json({ month, events, machines: machineList })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
