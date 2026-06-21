import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gatewayCompare } from '@/lib/ai/gateway'
import type { ResearchProduct } from '@/lib/ai/providers/openai'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { products } = await req.json() as { products: ResearchProduct[] }
  if (!Array.isArray(products) || products.length < 2)
    return NextResponse.json({ error: 'At least 2 products required' }, { status: 400 })
  if (products.length > 6)
    return NextResponse.json({ error: 'Maximum 6 products' }, { status: 400 })

  try {
    const result = await gatewayCompare(products)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
