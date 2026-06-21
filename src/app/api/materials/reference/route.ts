import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllMaterials } from '@/lib/google/sheets'

// Lightweight endpoint: returns item name + latest price for Research Center reference
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_ID) {
    return NextResponse.json([])
  }

  try {
    const q = req.nextUrl.searchParams.get('q')?.toLowerCase() ?? ''
    const materials = await getAllMaterials()
    const matched = materials
      .filter(m => !q || m.item.toLowerCase().includes(q) || m.tabProduct.toLowerCase().includes(q))
      .slice(0, 10)
      .map(m => ({
        item: m.item,
        tabProduct: m.tabProduct,
        tabSupplier: m.tabSupplier,
        latestPrice: m.latestPrice,
        latestPriceExPPN: m.latestPriceExPPN,
        latestDate: m.latestDate,
        packing: m.packing,
        priceHistory: m.history.slice(0, 5).map(h => ({
          date: h.date,
          priceIncPPN: h.priceIncPPN,
          supplier: h.supplier,
        })),
      }))
    return NextResponse.json(matched)
  } catch {
    return NextResponse.json([])
  }
}
