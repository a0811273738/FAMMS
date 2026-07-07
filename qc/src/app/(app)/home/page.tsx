import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import HomeContent, { type HomeData } from './HomeContent'
import type { Inspection } from '@/types/qc'

// Force dynamic: this page reads the session and live counts on every visit.
export const dynamic = 'force-dynamic'

// Fetch today's overview. Every query is defensive — a missing Supabase
// connection (or an empty database) must never crash the page, it should fall
// back to zeros so the empty-state guidance renders instead (ch.5.2 rule #7).
async function loadOverview(userId: string): Promise<HomeData> {
  const empty: HomeData = {
    todayInspections: 0,
    pendingReview: 0,
    openNcr: 0,
    holdBatches: 0,
    recent: [],
    hasError: false,
  }

  try {
    const supabase = await createClient()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const iso = startOfToday.toISOString()

    const [today, review, ncr, hold, recent] = await Promise.all([
      supabase.from('inspections').select('id', { count: 'exact', head: true }).gte('opened_at', iso),
      supabase.from('inspections').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('ncr_records').select('id', { count: 'exact', head: true }).neq('status', 'closed'),
      supabase.from('batches').select('id', { count: 'exact', head: true }).eq('status', 'hold'),
      supabase
        .from('inspections')
        .select('id, inspection_no, status, overall_result, stage, opened_at')
        .eq('opened_by', userId)
        .order('opened_at', { ascending: false })
        .limit(3),
    ])

    // A PostgREST-level error (e.g. table missing) surfaces on `.error`.
    if (today.error || recent.error) return { ...empty, hasError: true }

    return {
      todayInspections: today.count ?? 0,
      pendingReview: review.count ?? 0,
      openNcr: ncr.count ?? 0,
      holdBatches: hold.count ?? 0,
      recent: (recent.data ?? []) as Pick<
        Inspection,
        'id' | 'inspection_no' | 'status' | 'overall_result' | 'stage' | 'opened_at'
      >[],
      hasError: false,
    }
  } catch {
    // No env / network / auth failure → show zeros + a gentle notice.
    return { ...empty, hasError: true }
  }
}

export default async function HomePage() {
  const user = await getCurrentUser()
  const data = await loadOverview(user?.id ?? '')
  return <HomeContent data={data} userName={user?.full_name ?? ''} />
}
