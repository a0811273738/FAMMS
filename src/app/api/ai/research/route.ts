import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gatewayResearch } from '@/lib/ai/gateway'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { query } = await req.json()
  if (!query?.trim()) return NextResponse.json({ error: 'query required' }, { status: 400 })

  try {
    const result = await gatewayResearch(query.trim())
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
