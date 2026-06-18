import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/rbac'
import { OutletRoleChooser } from '@/components/supplier/OutletRoleChooser'
import { SellModeChooser } from '@/components/supplier/SellModeChooser'
import { conditionInfo, unitInfo } from '@/lib/outlet'
import { Package, Plus, Pencil, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'
const money = (c?: number | null, cur = 'EUR') => c == null ? '—' : new Intl.NumberFormat('en-EU', { style: 'currency', currency: cur }).format(c / 100)

export default async function SupplierOutletPage() {
  const user = await requireAuth()
  const supabase = createClient()
  const { data: supplier } = await (supabase.from('suppliers') as any)
    .select('id, trade_name, legal_name').eq('owner_id', user.id).maybeSingle()
  if (!supplier) redirect('/supplier/onboarding')

  const admin = createAdminClient()
  let role: string | null = null
  let sellMode: string | null = null
  let lots: any[] = []
  try {
    const { data: s } = await (admin.from('suppliers') as any).select('outlet_role, outlet_sell_mode').eq('id', supplier.id).single()
    role = s?.outlet_role ?? null
    sellMode = s?.outlet_sell_mode ?? null
    const { data } = await (admin.from('products') as any)
      .select('id, name, slug, price_cents, currency_code, condition, selling_unit, outlet_source, lot_type, is_published, product_images(url, sort_order)')
      .eq('supplier_id', supplier.id).eq('is_outlet', true).order('created_at', { ascending: false }).limit(200)
    lots = data ?? []
  } catch { /* migration pending */ }

  const published = lots.filter((l) => l.is_published).length

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Outlet Offers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Clearance, returns & liquidation lots you list in the <Link href="/outlet" className="text-[#0B1F4D] font-semibold underline">Outlet Zone</Link>.</p>
        </div>
        <Link href="/supplier/products/new" className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-4 py-2.5 text-sm font-bold hover:bg-[#162d6e] transition-colors">
          <Plus className="w-4 h-4" /> List a lot
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ v: lots.length, l: 'Total lots' }, { v: published, l: 'Published' }, { v: lots.length - published, l: 'Drafts' }].map((k) => (
          <div key={k.l} className="rounded-xl border bg-card p-5"><p className="text-2xl font-bold text-[#0B1F4D]">{k.v}</p><p className="text-sm text-muted-foreground mt-0.5">{k.l}</p></div>
        ))}
      </div>

      {/* Account setup: outlet role + sell mode */}
      <OutletRoleChooser initial={role} />
      <SellModeChooser initial={sellMode} />

      {/* Lots */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b font-bold text-sm text-gray-800">Your outlet lots</div>
        {lots.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600 font-semibold">No outlet lots yet</p>
            <p className="text-gray-400 text-sm mt-1">Add a product and tick <strong>“List in the Outlet Zone”</strong> to set condition, selling unit and source.</p>
            <Link href="/supplier/products/new" className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-bold mt-4 hover:bg-[#162d6e]"><Plus className="w-4 h-4" /> List a lot</Link>
          </div>
        ) : (
          <div className="divide-y">
            {lots.map((l) => {
              const img = ((l.product_images ?? []) as any[]).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url
              const cond = conditionInfo(l.condition)
              const unit = unitInfo(l.selling_unit)
              return (
                <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {img ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={img} alt="" className="w-full h-full object-contain p-1" />) : <Package className="w-5 h-5 text-gray-200" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{l.name}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                      {cond && <span className={`rounded-full text-[10px] font-bold px-1.5 py-0.5 ${cond.color}`}>{cond.short}</span>}
                      {unit && <span className="rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5">{unit.label}</span>}
                      {l.outlet_source && <span className="text-[11px] text-orange-600 font-semibold">{l.outlet_source}</span>}
                      {!l.is_published && <span className="text-[10px] font-bold text-amber-600">Draft</span>}
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-[#0B1F4D]">{l.price_cents > 0 ? money(l.price_cents, l.currency_code) : 'Ask'}</span>
                  <Link href={`/supplier/products/${l.id}/edit`} className="p-2 text-gray-400 hover:text-[#0B1F4D]" title="Edit"><Pencil className="w-4 h-4" /></Link>
                  <Link href={`/product/${l.slug ?? l.id}`} target="_blank" className="p-2 text-gray-400 hover:text-[#0B1F4D]" title="View"><ExternalLink className="w-4 h-4" /></Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
