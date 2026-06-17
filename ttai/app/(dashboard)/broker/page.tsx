import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/rbac'
import { levelForPoints, companiesToNext, BROKER_LEVELS } from '@/lib/broker'
import { BrokerIdCard } from '@/components/broker/BrokerIdCard'
import { Users, Building2, Sparkles, Handshake, FileText, TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react'

export default async function BrokerDashboardPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: broker } = await supabase
    .from('brokers')
    .select('id, legal_name, status, stripe_onboarding_complete, commission_pct, broker_share_pct')
    .eq('user_id', user.id)
    .single()
  if (!broker) redirect('/broker/register')

  const admin = createAdminClient()

  // Broker identity + score (defensive — columns/tables from migration 0071).
  let brokerCode: string | null = null
  let points = 0
  let supRefs = 0, buyRefs = 0, openDeals = 0, totalDeals = 0
  try {
    const { data: bx } = await (admin.from('brokers') as any).select('broker_code, connection_points').eq('id', broker.id).single()
    brokerCode = bx?.broker_code ?? null
    points = bx?.connection_points ?? 0
    // Generate a Broker ID once.
    if (!brokerCode) {
      brokerCode = 'BRK-' + String(broker.id).replace(/-/g, '').slice(0, 6).toUpperCase()
      await (admin.from('brokers') as any).update({ broker_code: brokerCode }).eq('id', broker.id)
    }
    const [s, b, od, td] = await Promise.all([
      (admin.from('broker_referrals') as any).select('id', { count: 'exact', head: true }).eq('broker_id', broker.id).eq('company_type', 'supplier'),
      (admin.from('broker_referrals') as any).select('id', { count: 'exact', head: true }).eq('broker_id', broker.id).eq('company_type', 'buyer'),
      (admin.from('broker_deals') as any).select('id', { count: 'exact', head: true }).eq('broker_id', broker.id).eq('status', 'open'),
      (admin.from('broker_deals') as any).select('id', { count: 'exact', head: true }).eq('broker_id', broker.id),
    ])
    supRefs = s.count ?? 0; buyRefs = b.count ?? 0; openDeals = od.count ?? 0; totalDeals = td.count ?? 0
  } catch { /* migration 0071 not applied yet */ }

  const { count: assignedSuppliers } = await supabase
    .from('broker_supplier_assignments').select('broker_id', { count: 'exact', head: true }).eq('broker_id', broker.id)

  const lvl = levelForPoints(points)
  const network = supRefs + buyRefs
  const needsRefs = supRefs === 0 || buyRefs === 0

  const kpis = [
    { label: 'Connection Points', value: points,           href: '/broker/network', Icon: Sparkles,  color: 'text-[#F5A623]' },
    { label: 'Registered Suppliers', value: supRefs,       href: '/broker/network', Icon: Building2,  color: 'text-blue-600' },
    { label: 'Registered Buyers', value: buyRefs,          href: '/broker/network', Icon: Users,      color: 'text-green-600' },
    { label: 'Total Network',    value: network,           href: '/broker/network', Icon: Handshake,  color: 'text-[#0B1F4D]' },
    { label: 'Active Deals',     value: openDeals,         href: '/broker/deals',   Icon: TrendingUp, color: 'text-violet-600' },
    { label: 'Total Deals',      value: totalDeals,        href: '/broker/deals',   Icon: FileText,   color: 'text-rose-600' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{broker.legal_name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Broker Network Dashboard</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold ${lvl.current.color}`}>
          {lvl.current.emoji} {lvl.current.label}
        </span>
      </div>

      {/* Broker ID + level progress */}
      <div className="grid sm:grid-cols-[1fr_1.2fr] gap-4">
        <BrokerIdCard code={brokerCode ?? '—'} />
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-gray-800">{lvl.current.emoji} {lvl.current.label}</span>
            {lvl.next && <span className="text-gray-400">Next: {lvl.next.emoji} {lvl.next.label}</span>}
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#F5A623] to-[#0B1F4D] transition-all" style={{ width: `${lvl.progress}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {lvl.next
              ? <>{points} points · <strong>{companiesToNext(points)} more compan{companiesToNext(points) === 1 ? 'y' : 'ies'}</strong> to reach {lvl.next.label}.</>
              : <>Top level reached — {points} connection points. 💎</>}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{lvl.current.perks}</p>
        </div>
      </div>

      {/* Mandatory rule */}
      {needsRefs && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-bold">Register your first references to unlock deals.</p>
            <p className="mt-0.5">Before managing business opportunities you must register at least <strong>one Supplier reference</strong> and <strong>one Buyer reference</strong>. {supRefs === 0 && 'Supplier reference missing. '}{buyRefs === 0 && 'Buyer reference missing.'}</p>
            <Link href="/broker/network" className="inline-flex items-center gap-1 font-bold underline mt-1.5">Register a reference <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
      )}

      {!broker.stripe_onboarding_complete && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-yellow-800 font-medium">Complete your Stripe onboarding to receive commission payouts.</p>
          <Link href="/broker/onboarding" className="rounded-md bg-yellow-700 text-white px-4 py-2 text-xs font-medium hover:bg-yellow-800 whitespace-nowrap">Complete</Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
            <k.Icon className={`w-5 h-5 ${k.color} mb-2`} />
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/broker/network" className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow">
          <Handshake className="w-6 h-6 text-[#0B1F4D] mb-2" />
          <p className="font-extrabold text-gray-900">Register a Reference</p>
          <p className="text-sm text-gray-500 mt-0.5">Add a supplier or buyer to your protected network and earn points.</p>
        </Link>
        <Link href="/broker/deals" className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow">
          <FileText className="w-6 h-6 text-[#0B1F4D] mb-2" />
          <p className="font-extrabold text-gray-900">Deals &amp; Invoicing</p>
          <p className="text-sm text-gray-500 mt-0.5">Submit a deal — optionally let TTAIEMA handle the invoicing.</p>
        </Link>
      </div>

      {/* Levels ladder */}
      <div className="rounded-2xl border bg-card p-5">
        <p className="font-bold text-sm text-gray-800 mb-3">Broker Levels</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {BROKER_LEVELS.map((l) => (
            <div key={l.key} className={`rounded-xl border p-3 ${l.key === lvl.current.key ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.03]' : 'border-gray-100'}`}>
              <p className="text-lg">{l.emoji}</p>
              <p className="text-xs font-extrabold text-gray-800">{l.label.replace(' Broker', '')}</p>
              <p className="text-[10px] text-gray-400">{l.minPoints}+ pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
