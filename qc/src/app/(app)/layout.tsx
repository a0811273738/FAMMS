import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import TopBar from '@/components/shared/TopBar'
import BottomNav from '@/components/shared/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Local JWT check + profile lookup (verified server-side by PostgREST).
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar role={user.role} />
      <main className="flex-1 w-full mx-auto px-4 py-4 pb-24 max-w-lg lg:max-w-5xl">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
