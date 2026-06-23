import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { REPEAT_FAILURE_WINDOW_DAYS } from '@/lib/constants'

// POST /api/incidents — create a new incident
// Generates incident_no (INC-YYYYMM-NNNN), then runs repeat-failure detection.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { machine_id, failure_code_id, downtime_impact, remarks } = body

  if (!machine_id || !failure_code_id || !downtime_impact) {
    return NextResponse.json({ error: 'machine_id, failure_code_id, downtime_impact wajib diisi' }, { status: 400 })
  }

  // Resolve factory from the machine (incident belongs to the machine's factory)
  const { data: machine, error: machineErr } = await supabase
    .from('machines')
    .select('id, factory_id, machine_code')
    .eq('id', machine_id)
    .single()
  if (machineErr || !machine) {
    return NextResponse.json({ error: 'Mesin tidak ditemukan' }, { status: 404 })
  }

  // Generate incident number: INC-YYYYMM-NNNN (monthly sequence, factory-wide)
  const now = new Date()
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count } = await supabase
    .from('incidents')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', monthStart)
  const seq = String((count ?? 0) + 1).padStart(4, '0')
  const incident_no = `INC-${ym}-${seq}`

  const { data: incident, error: insertErr } = await supabase
    .from('incidents')
    .insert({
      factory_id: machine.factory_id,
      machine_id,
      incident_no,
      failure_code_id,
      downtime_impact,
      status: 'reported',
      reported_by_id: user.id,
      remarks: remarks || null,
    })
    .select('*')
    .single()

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Repeat-failure detection: same machine + same failure code within window,
  // where the previous fix was temporary OR the root cause was never resolved.
  const windowStart = new Date(now.getTime() - REPEAT_FAILURE_WINDOW_DAYS * 86400000).toISOString()
  const { data: priors } = await supabase
    .from('incidents')
    .select('id, incident_no, status, completion_type, root_cause, reported_at')
    .eq('machine_id', machine_id)
    .eq('failure_code_id', failure_code_id)
    .neq('id', incident.id)
    .gte('reported_at', windowStart)
    .order('reported_at', { ascending: false })

  const potentialRepeats = (priors ?? []).filter(
    p => p.completion_type === 'temporary_fix' || !p.root_cause
  )

  return NextResponse.json({
    incident,
    potential_repeats: potentialRepeats,
  })
}
