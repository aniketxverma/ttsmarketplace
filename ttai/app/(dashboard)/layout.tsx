import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ChatWidget } from '@/components/ai/ChatWidget'
import { SELL_PLAN_LABEL } from '@/lib/selling'
import type { UserRole } from '@/types/domain'

const NEXT_TIER: Record<string, string | null> = { free: 'standard', standard: 'pro', pro: 'full', full: null }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await (supabase
    .from('profiles') as any)
    .select('role, approval_status, tier')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isPending = profile.approval_status === 'pending' && profile.role !== 'admin'

  // Persistent upgrade prompt — always nudge non-admins below the top plan.
  const tier = (profile as any).tier ?? 'free'
  const nextTier = profile.role === 'admin' ? null : NEXT_TIER[tier]
  const isSeller = ['supplier', 'broker'].includes(profile.role)
  const upgrade = nextTier ? {
    label: SELL_PLAN_LABEL[nextTier],
    title: isSeller
      ? `Upgrade to ${SELL_PLAN_LABEL[nextTier]} — sell B2B by pallet & truck and reach more buyers`
      : `Become a verified supplier — list products and sell on TTAIEMA`,
  } : null

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

        {/* Persistent upgrade nudge (recurring-revenue driver) */}
        {upgrade && (
          <Link href="/pricing"
            className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#0B1F4D] to-[#1a3a8a] px-5 py-3.5 text-white shadow-sm hover:shadow-lg transition-shadow group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold leading-tight truncate">{upgrade.title}</p>
                <p className="text-xs text-blue-200 mt-0.5">Grow with TTAIEMA — unlock more plans, distribution and investment projects.</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-sm font-extrabold bg-[#F5A623] text-[#0B1F4D] px-4 py-2 rounded-xl flex-shrink-0 group-hover:gap-2.5 transition-all">
              Upgrade
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </span>
          </Link>
        )}
        {children}
      </DashboardShell>
      {/* Floating AI chat assistant */}
      <ChatWidget />
    </div>
  )
}
