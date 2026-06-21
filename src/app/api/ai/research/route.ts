import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gatewayAnalyzeIntent, gatewayResearch } from '@/lib/ai/gateway'
import type { SearchIntent } from '@/lib/ai/gateway'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { query, intent } = await req.json()
  if (!query?.trim()) return NextResponse.json({ error: 'query required' }, { status: 400 })

  try {
    // If intent already provided (user selected category), skip analysis step
    const resolvedIntent: SearchIntent = intent ?? await gatewayAnalyzeIntent(query.trim())

    // If still ambiguous, return early so UI can show category picker
    if (resolvedIntent.isAmbiguous) {
      return NextResponse.json({ ambiguous: true, intent: resolvedIntent })
    }

    const result = await gatewayResearch(query.trim(), resolvedIntent)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
