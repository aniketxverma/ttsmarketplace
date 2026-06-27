import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { Network, Check, Store, Package, ShieldCheck, LogIn, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AcceptClient } from './AcceptClient'

export const dynamic = 'force-dynamic'

const LEVEL_LABEL: Record<string, string> = {
  customer: 'Customer', sales_point: 'Sales Point', distributor: 'Distributor', master_distributor: 'Master Distributor',
}

export default async function JoinNetworkPage({ params }: { params: { token: string } }) {
  
  const tt = await localizeUI(["Invitation not found", "This invite link is invalid or has been withdrawn.", "Go to TTAIEMA →", "This invitation has already been accepted.", "Go to your dashboard", "Sales network invitation", "has invited", "to join its official sales network", "Role:", "Create my free store", "I already have an account"], getLocale())
  const admin = createAdminClient()

  let invite: any = null
  let inviterName = 'A supplier'
  try {
    const { data } = await (admin.from('sales_network') as any)
      .select('id, company_name, level, status, inviter_supplier_id, member_supplier_id')
      .eq('token', params.token).maybeSingle()
    invite = data
    if (invite) {
      const { data: sup } = await (admin.from('suppliers') as any)
        .select('trade_name, legal_name').eq('id', invite.inviter_supplier_id).maybeSingle()
      inviterName = sup?.trade_name ?? sup?.legal_name ?? inviterName
    }
  } catch { /* not migrated */ }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F4D] to-[#1e3a8a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7">{children}</div>
    </div>
  )

  if (!invite || invite.status === 'revoked') {
    return shell(
      <div className="text-center">
        <h1 className="text-xl font-extrabold text-[#0B1F4D]">{tt("Invitation not found")}</h1>
        <p className="text-sm text-gray-500 mt-2">{tt("This invite link is invalid or has been withdrawn.")}</p>
        <Link href="/" className="mt-5 inline-block text-sm font-bold text-[#0B1F4D] hover:underline">{tt("Go to TTAIEMA →")}</Link>
      </div>,
    )
  }

  if (invite.status === 'accepted') {
    return shell(
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7 text-green-600" /></div>
        <h1 className="text-xl font-extrabold text-[#0B1F4D]">You&apos;re already in the network</h1>
        <p className="text-sm text-gray-500 mt-2">{tt("This invitation has already been accepted.")}</p>
        <Link href="/supplier" className="mt-5 inline-block rounded-xl bg-[#0B1F4D] text-white px-6 py-2.5 text-sm font-bold">{tt("Go to your dashboard")}</Link>
      </div>,
    )
  }

  const benefits = [
    { Icon: Store,   text: 'Your own free online store' },
    { Icon: Package, text: `Import ${inviterName}'s catalogue in one click` },
    { Icon: ShieldCheck, text: 'Verified network membership' },
  ]

  return shell(
    <>
      <div className="text-center mb-5">
        <div className="w-16 h-16 rounded-2xl bg-[#0B1F4D] flex items-center justify-center mx-auto mb-3"><Network className="w-8 h-8 text-white" /></div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#F5A623]">{tt("Sales network invitation")}</p>
        <h1 className="text-xl font-extrabold text-[#0B1F4D] mt-1 leading-tight">
          {inviterName} {tt("has invited")} <span className="text-[#2563eb]">{invite.company_name}</span> {tt("to join its official sales network")}
        </h1>
        <span className="inline-block mt-2 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{tt("Role:")} {LEVEL_LABEL[invite.level] ?? 'Sales Point'}</span>
      </div>

      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-2 mb-5">
        {benefits.map((b) => (
          <div key={b.text} className="flex items-center gap-2.5 text-sm text-gray-700"><b.Icon className="w-4 h-4 text-green-500 flex-shrink-0" />{b.text}</div>
        ))}
      </div>

      {user ? (
        <AcceptClient token={params.token} inviterName={inviterName} />
      ) : (
        <div className="space-y-2.5">
          <Link href={`/register?next=${encodeURIComponent('/join/' + params.token)}`}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] py-3 text-sm font-extrabold hover:bg-[#fbb93a]">
            <UserPlus className="w-4 h-4" /> {tt("Create my free store")}
          </Link>
          <Link href={`/login?next=${encodeURIComponent('/join/' + params.token)}`}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] py-2.5 text-sm font-extrabold hover:bg-[#0B1F4D] hover:text-white transition-colors">
            <LogIn className="w-4 h-4" /> {tt("I already have an account")}
          </Link>
          <p className="text-[11px] text-gray-400 text-center pt-1">Free to join · upgrade later for B2B wholesale &amp; more</p>
        </div>
      )}
    </>,
  )
}
