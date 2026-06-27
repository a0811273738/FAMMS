import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { machine_id, pm_type, interval_days, description, checklist } = body

  if (!machine_id || !pm_type) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // 获取 machine 信息以确认 factory_id
    const { data: machine } = await supabase
      .from('machines')
      .select('factory_id')
      .eq('id', machine_id)
      .single()

    if (!machine) {
      return Response.json({ error: 'Machine not found' }, { status: 404 })
    }

    // 创建 PM 计划
    const { data, error } = await supabase
      .from('pm_schedules')
      .insert({
        factory_id: machine.factory_id,
        machine_id,
        pm_type,
        description: `${description}\n\n[间隔: ${interval_days}天]`,
        checklist: JSON.stringify(checklist || []),
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const machineId = url.searchParams.get('machine_id')

  if (!machineId) {
    return Response.json({ error: 'Missing machine_id' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('pm_schedules')
      .select('*')
      .eq('machine_id', machineId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
