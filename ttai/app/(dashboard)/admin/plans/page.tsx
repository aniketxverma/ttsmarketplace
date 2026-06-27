import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { PLANS } from '@/lib/pricing'
import { directoryAccess, unitsForRole } from '@/lib/business-chain'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { UNIT_LABEL, unitsForShop, type PurchaseUnit } from '@/lib/packaging'

const TIER_ACCENT: Record<string, string> = { free: '#64748b', standard: '#2563eb', pro: '#7c3aed', full: '#d97706' }

function Units({ units }: { units: PurchaseUnit[] | undefined }) {
  const list = units ?? (['piece', 'box', 'pallet', 'truck'] as PurchaseUnit[])
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((u) => (
        <span key={u} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#0B1F4D]/6 text-[#0B1F4D]">{UNIT_LABEL[u]}</span>
      ))}
    </div>
  )
}

export default async function AdminPlansPage() {
  await requireRole('admin')

  const tt = await localizeUI(["Users", "Membership plans (matchmaking access)", "Units sold per shop"], getLocale())
  const supabase = createClient()

  // Count members per tier.
  const { data: rows } = await (supabase.from('profiles') as any).select('tier')
  const counts: Record<string, number> = { free: 0, standard: 0, pro: 0, full: 0 }
  for (const r of (rows ?? []) as any[]) counts[r.tier ?? 'free'] = (counts[r.tier ?? 'free'] ?? 0) + 1

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Plans &amp; Access</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          The membership tiers, role permissions and shop rules that govern the marketplace.
          Assign a member&apos;s plan or role in <Link href="/admin/users" className="text-[#0B1F4D] font-semibold hover:underline">{tt("Users")}</Link>.
        </p>
      </div>

      {/* ── Membership plans ── */}
      <section>
        <h2 className="text-sm font-extrabold text-[#0B1F4D] uppercase tracking-widest mb-3">{tt("Membership plans (matchmaking access)")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => {
            const acc = directoryAccess('retail', p.tier) // what a shop unlocks at this tier
            return (
              <div key={p.tier} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: TIER_ACCENT[p.tier] }} />
                    <h3 className="font-extrabold text-[#0B1F4D]">{p.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{counts[p.tier] ?? 0} users</span>
                </div>
                <p className="text-2xl font-black text-[#0B1F4D] mb-3">{p.price}<span className="text-xs font-semibold text-gray-400">{p.period}</span></p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-1.5">{acc.suppliers ? '✅' : '⬜'} Suppliers directory</li>
                  <li className="flex items-center gap-1.5">{acc.distributors ? '✅' : '⬜'} Distributors directory</li>
                  <li className="flex items-center gap-1.5">{acc.factories ? '✅' : '⬜'} Factories directory</li>
                </ul>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">Suppliers &amp; distributors / factories are presented their counterpart on any paid tier (see business-chain). Tiers are admin-granted in Users.</p>
      </section>

      {/* ── Role-based purchase rights ── */}
      <section>
        <h2 className="text-sm font-extrabold text-[#0B1F4D] uppercase tracking-widest mb-3">Purchase rights by role (Factory → Supplier → Distributor → Retail → End user)</h2>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {[
            { role: 'End user (consumer)', level: 'consumer' as const, note: 'Retail (PVP) prices only — never sees wholesale' },
            { role: 'Retail shop', level: 'retail' as const, note: 'Retail + B2B pricing' },
            { role: 'Distributor / Wholesaler / Broker', level: 'distributor' as const, note: 'Wholesale / bulk pricing' },
            { role: 'Supplier / Factory / Manufacturer', level: 'factory' as const, note: 'Full access — all units' },
          ].map((r) => (
            <div key={r.level} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div>
                <p className="font-bold text-[#0B1F4D] text-sm">{r.role}</p>
                <p className="text-xs text-gray-400">{r.note}</p>
              </div>
              <Units units={unitsForRole(r.level)} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Per-shop units ── */}
      <section>
        <h2 className="text-sm font-extrabold text-[#0B1F4D] uppercase tracking-widest mb-3">{tt("Units sold per shop")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: 'Online Store (TTAI Retail)', shop: 'online', who: 'End users / families' },
            { name: 'Marketplace (Business Shop)', shop: 'market', who: 'Shops & small distributors' },
            { name: 'B2B Wholesale Hub', shop: 'b2b', who: 'Wholesalers / importers' },
          ].map((s) => (
            <div key={s.shop} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
              <p className="font-bold text-[#0B1F4D] text-sm">{s.name}</p>
              <p className="text-xs text-gray-400 mb-2.5">{s.who}</p>
              <Units units={unitsForShop(s.shop)} />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">A buyer&apos;s visible units = shop units ∩ role units. Each supplier still chooses which units a product sells (Sell-by toggles).</p>
      </section>
    </div>
  )
}
