import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'

// Settings is supervisor+ only. Inspectors that reach a settings URL directly
// are bounced home — "權限即介面" (ch.7).
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!PERMISSIONS.viewSettings(user.role)) redirect('/home')
  return <>{children}</>
}
