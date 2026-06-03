import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ChatWidget } from '@/components/ai/ChatWidget'
import type { UserRole } from '@/types/domain'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, approval_status')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isPending = profile.approval_status === 'pending' && profile.role !== 'admin'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <DashboardShell role={profile.role as UserRole}>
        {isPending && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-amber-900">Your account is under review</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                You can complete your profile while our team verifies your details (usually within 24–48 hours).
                Marketplace, suppliers and ordering unlock automatically once approved.
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Pending
            </span>
          </div>
        )}
        {children}
      </DashboardShell>
      {/* Floating AI chat assistant */}
      <ChatWidget />
    </div>
  )
}
