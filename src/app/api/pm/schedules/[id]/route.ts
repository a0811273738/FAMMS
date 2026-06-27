import { createClient } from '@/lib/supabase/server'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const body = await req.json()
  const { pm_type, description, checklist, interval_days, is_active } = body

  try {
    const { data, error } = await supabase
      .from('pm_schedules')
      .update({
        pm_type,
        description,
        checklist,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return Response.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const { error } = await supabase
      .from('pm_schedules')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
    return Response.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
