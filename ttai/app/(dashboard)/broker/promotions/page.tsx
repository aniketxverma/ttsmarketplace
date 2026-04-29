import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import Link from 'next/link'

export default async function BrokerPromotionsPage() {
  await requireRole('broker')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const [promotionsRes, productsRes] = await Promise.all([
    broker
      ? supabase
          .from('broker_promotions')
          .select('id, promotion_slot, custom_pitch, is_active, starts_at, ends_at, products(id, name, price_cents, currency_code)')
          .eq('broker_id', broker.id)
          .order('promotion_slot')
      : { data: [] },
    broker
      ? supabase
          .from('broker_supplier_assignments')
          .select('suppliers(id, legal_name, products(id, name, price_cents, currency_code))')
          .eq('broker_id', broker.id)
      : { data: [] },
  ])

  const promotions = (promotionsRes.data ?? []) as unknown as Array<{
    id: string
    promotion_slot: number
    custom_pitch: string | null
    is_active: boolean
    starts_at: string
    ends_at: string
    products: { id: string; name: string; price_cents: number; currency_code: string } | null
  }>

  const now = new Date()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage promoted products in your 3 promotion slots</p>
        </div>
        <Link
          href="/broker/promotions/new"
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New Promotion
        </Link>
      </div>

      {/* Slots overview */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((slot) => {
          const promo = promotions.find((p) => p.promotion_slot === slot)
          const isLive = promo && promo.is_active && new Date(promo.ends_at) > now
          return (
            <div key={slot} className={`rounded-xl border p-4 ${isLive ? 'border-green-300 bg-green-50' : 'bg-muted/30'}`}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Slot {slot}</p>
              {promo ? (
                <>
                  <p className="font-medium text-sm line-clamp-1">{promo.products?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(promo.starts_at).toLocaleDateString()} – {new Date(promo.ends_at).toLocaleDateString()}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={isLive ? 'active' : 'inactive'} />
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Empty slot</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Promotions table */}
      {promotions.length > 0 ? (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Slot</th>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Pitch</th>
                <th className="text-left px-4 py-3 font-medium">Period</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {promotions.map((p) => {
                const live = p.is_active && new Date(p.ends_at) > now
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">#{p.promotion_slot}</td>
                    <td className="px-4 py-3 font-medium">{p.products?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{p.custom_pitch ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(p.starts_at).toLocaleDateString()} – {new Date(p.ends_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={live ? 'active' : 'inactive'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-10 text-center">
          <div className="text-4xl mb-3">📣</div>
          <p className="font-semibold">No promotions yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create a promotion to highlight products in the marketplace.</p>
          <Link
            href="/broker/promotions/new"
            className="mt-4 inline-block rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create first promotion
          </Link>
        </div>
      )}
    </div>
  )
}
