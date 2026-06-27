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
  const { action, findings, delay_reason, cost } = body

  if (!action || !['complete', 'skip'].includes(action)) {
    return Response.json({ error: 'action must be complete or skip' }, { status: 400 })
  }

  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('pm_records')
      .update({
        status: action === 'complete' ? 'completed' : 'skipped',
        completed_at: action === 'complete' ? now : null,
        completed_by_id: action === 'complete' ? user.id : null,
        findings: findings || null,
        delay_reason: delay_reason || null,
        cost: cost || null,
        updated_at: now,
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
