import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllMaterials } from '@/lib/google/sheets'

function calcTrend(history: Array<{ priceIncPPN: number | null }>): number {
  const prices = history.map(h => h.priceIncPPN).filter((p): p is number => p !== null)
  if (prices.length < 2) return 0
  const latest = prices[prices.length - 1]
  const prev = prices[prices.length - 2]
  return ((latest - prev) / prev) * 100
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_ID) {
    return NextResponse.json({ error: 'Google Sheets not configured' }, { status: 503 })
  }

  try {
    const search = req.nextUrl.searchParams.get('q')?.toLowerCase() ?? ''
    const materials = await getAllMaterials()

    const filtered = search
      ? materials.filter(m =>
          m.item.toLowerCase().includes(search) ||
          m.tab.toLowerCase().includes(search) ||
          m.latestSupplier.toLowerCase().includes(search)
        )
      : materials

    // Normalize to match existing MaterialsClient format
    const normalized = filtered.map(m => ({
      code_bb: m.tab,
      item_name: m.item,
      supplier: m.latestSupplier,
      latest_price: m.latestPrice,
      latest_date: m.latestDate,
      trend_pct: calcTrend(m.history),
      history: m.history.map(h => ({
        date: h.date,
        price: h.priceIncPPN ?? h.priceExPPN ?? 0,
        qty: h.qty,
        company: h.supplier,
      })).filter(h => h.price > 0),
    }))

    return NextResponse.json(normalized)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
