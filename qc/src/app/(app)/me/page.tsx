import { getCurrentUser } from '@/lib/auth'
import MeContent from './MeContent'

export const dynamic = 'force-dynamic'

export default async function MePage() {
  const user = await getCurrentUser()
  return (
    <MeContent
      name={user?.full_name ?? ''}
      role={user?.role ?? 'inspector'}
    />
  )
}
