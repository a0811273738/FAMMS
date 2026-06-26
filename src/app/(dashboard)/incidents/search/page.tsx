import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IncidentSearch from '@/components/incidents/IncidentSearch'

export const metadata = { title: '案件搜索 | 維修系統' }

export default async function IncidentSearchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">案件搜索</h1>
        <p className="text-sm text-gray-500 mt-1">按日期、機器、類型搜索案件，支援匯出 Excel</p>
      </div>

      <IncidentSearch />
    </div>
  )
}
