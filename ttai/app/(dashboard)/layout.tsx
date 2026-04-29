import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import type { UserRole } from '@/types/domain'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <DashboardShell role={profile.role as UserRole}>
        {children}
      </DashboardShell>
    </div>
  )
}
