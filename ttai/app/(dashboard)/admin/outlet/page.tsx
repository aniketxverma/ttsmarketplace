import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/rbac'
import { conditionInfo, unitInfo } from '@/lib/outlet'
import { lookingForLabel } from '@/lib/opportunities'
import { Package, Megaphone, ShoppingCart, Briefcase, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminOutletPage() {
  await requireRole('admin')
  const admin = createAdminClient()

  const safeCount = async (q: any) => { try { const { count } = await q; return count ?? 0 } catch { return 0 } }
  const safe = async (q: any) => { try { const { data } = await q; return data ?? [] } catch { return [] } }

  const [lots, trades, opps] = await Promise.all([
    safeCount((admin.from('products') as any).select('id', { count: 'exact', head: true }).eq('is_outlet', true).eq('is_published', true)),
    safeCount((admin.from('trade_requests') as any).select('id', { count: 'exact', head: true }).eq('status', 'open')),
    safeCount((admin.from('business_opportunities') as any).select('id', { count: 'exact', head: true }).eq('status', 'open')),
  ])

  const [recentTrades, recentOpps, recentLots] = await Promise.all([
    safe((admin.from('trade_requests') as any).select('id, kind, title, company_name, country_name, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(12)),
    safe((admin.from('business_opportunities') as any).select('id, kind, looking_for, title, company_name, country_target, poster_role, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(12)),
    safe((admin.from('products') as any).select('id, name, slug, condition, selling_unit, outlet_source, suppliers!supplier_id(trade_name), created_at').eq('is_outlet', true).eq('is_published', true).order('created_at', { ascending: false }).limit(12)),
  ])

  const kpis = [
    { label: 'Outlet lots', value: lots, Icon: Package, href: '/outlet' },
    { label: 'Open trade-board posts', value: trades, Icon: ShoppingCart, href: '/outlet/board' },
    { label: 'Open opportunities', value: opps, Icon: Briefcase, href: '/opportunities' },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Outlet &amp; Trade</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Moderate outlet lots, trade-board posts and business opportunities.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} target="_blank" className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
            <k.Icon className="w-5 h-5 text-[#0B1F4D] mb-2" />
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* Trade board */}
      <Panel title="Latest trade-board posts" href="/outlet/board">
        {recentTrades.length === 0 ? <Empty /> : recentTrades.map((t: any) => (
          <Row key={t.id} badge={t.kind === 'buy' ? 'Buying' : 'Selling'} badgeColor={t.kind === 'buy' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}
            title={t.title} sub={[t.company_name, t.country_name].filter(Boolean).join(' · ')} date={t.created_at} />
        ))}
      </Panel>

      {/* Opportunities */}
      <Panel title="Latest business opportunities" href="/opportunities">
        {recentOpps.length === 0 ? <Empty /> : recentOpps.map((o: any) => (
          <Row key={o.id} badge={o.kind === 'promotion' ? 'Promo' : (lookingForLabel(o.looking_for) ?? 'Looking')} badgeColor="bg-indigo-100 text-indigo-700"
            title={o.title} sub={[o.company_name, o.poster_role, o.country_target].filter(Boolean).join(' · ')} date={o.created_at} />
        ))}
      </Panel>

      {/* Outlet lots */}
      <Panel title="Latest outlet lots" href="/outlet">
        {recentLots.length === 0 ? <Empty /> : recentLots.map((l: any) => {
          const cond = conditionInfo(l.condition); const unit = unitInfo(l.selling_unit)
          return (
            <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{l.name}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-[11px] text-gray-400">
                  {cond && <span className={`rounded-full font-bold px-1.5 py-0.5 ${cond.color}`}>{cond.short}</span>}
                  {unit && <span className="rounded-full bg-gray-100 text-gray-600 font-bold px-1.5 py-0.5">{unit.label}</span>}
                  {(l.suppliers as any)?.trade_name && <span>{(l.suppliers as any).trade_name}</span>}
                  {l.outlet_source && <span className="text-orange-600 font-semibold">{l.outlet_source}</span>}
                </div>
              </div>
              <Link href={`/product/${l.slug ?? l.id}`} target="_blank" className="p-2 text-gray-400 hover:text-[#0B1F4D]"><ExternalLink className="w-4 h-4" /></Link>
            </div>
          )
        })}
      </Panel>
    </div>
  )
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b flex items-center justify-between">
        <span className="font-bold text-sm text-gray-800">{title}</span>
        <Link href={href} target="_blank" className="text-xs font-bold text-[#0B1F4D] hover:underline">Open →</Link>
      </div>
      <div className="divide-y">{children}</div>
    </div>
  )
}
function Row({ badge, badgeColor, title, sub, date }: { badge: string; badgeColor: string; title: string; sub: string; date: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
      <span className={`rounded-full text-[10px] font-extrabold px-2 py-0.5 flex-shrink-0 ${badgeColor}`}>{badge}</span>
      <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-gray-900 truncate">{title}</p>{sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}</div>
      <span className="text-[11px] text-gray-400 flex-shrink-0">{new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
    </div>
  )
}
function Empty() { return <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing yet.</div> }
