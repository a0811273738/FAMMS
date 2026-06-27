import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const factoryId = url.searchParams.get('factory_id')

  let query = supabase
    .from('spare_parts')
    .select('*')
    .eq('is_active', true)
    .order('part_name')

  if (factoryId) {
    query = query.eq('factory_id', factoryId)
  }

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { factory_id, part_code, part_name, category, unit_price, stock_qty, reorder_level, supplier, lead_time_days } = body

  if (!factory_id || !part_code || !part_name) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('spare_parts')
    .insert({
      factory_id,
      part_code,
      part_name,
      category: category || null,
      unit_price: unit_price || null,
      stock_qty: stock_qty || 0,
      reorder_level: reorder_level || 5,
      supplier: supplier || null,
      lead_time_days: lead_time_days || null,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data, { status: 201 })
}
