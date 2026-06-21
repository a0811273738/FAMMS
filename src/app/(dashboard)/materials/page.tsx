import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MaterialsClient from './MaterialsClient'

export default async function MaterialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const canSeed = profile && ['purchasing', 'director'].includes(profile.role)

  const sheetsConfigured = !!(
    process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_SHEETS_ID
  )

  // Only check Supabase count if Sheets not configured
  let recordCount = 0
  if (!sheetsConfigured) {
    const { count } = await supabase
      .from('material_price_history')
      .select('*', { count: 'exact', head: true })
    recordCount = count ?? 0
  }

  return (
    <MaterialsClient
      hasData={sheetsConfigured || recordCount > 0}
      canSeed={!!canSeed}
      recordCount={recordCount}
      sheetsConfigured={sheetsConfigured}
    />
  )
}
