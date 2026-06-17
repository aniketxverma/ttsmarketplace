import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/rbac'
import { DealForm } from '@/components/broker/DealForm'

export const dynamic = 'force-dynamic'

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700', invoiced: 'bg-violet-100 text-violet-700',
  paid: 'bg-green-100 text-green-700', closed: 'bg-gray-200 text-gray-600', cancelled: 'bg-rose-100 text-rose-700',
}
const money = (c?: number | null, cur = 'EUR') => c == null ? '—' : new Intl.NumberFormat('en-EU', { style: 'currency', currency: cur }).format(c / 100)

export default async function BrokerDealsPage() {
  const user = await requireAuth()
  const supabase = createClient()
  const { data: broker } = await supabase.from('brokers').select('id').eq('user_id', user.id).single()
  if (!broker) redirect('/broker/register')

  const admin = createAdminClient()
  let deals: any[] = []
  let supRefs = 0, buyRefs = 0
  try {
    const [{ data }, s, b] = await Promise.all([
      (admin.from('broker_deals') as any).select('*').eq('broker_id', broker.id).order('created_at', { ascending: false }).limit(200),
      (admin.from('broker_referrals') as any).select('id', { count: 'exact', head: true }).eq('broker_id', broker.id).eq('company_type', 'supplier'),
      (admin.from('broker_referrals') as any).select('id', { count: 'exact', head: true }).eq('broker_id', broker.id).eq('company_type', 'buyer'),
    ])
    deals = data ?? []; supRefs = s.count ?? 0; buyRefs = b.count ?? 0
  } catch { /* migration pending */ }

  const canPost = supRefs > 0 && buyRefs > 0
  const totalCommission = deals.reduce((sum, d) => sum + (d.commission_cents ?? 0), 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Deals &amp; Invoicing</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Commission history and the optional TTAIEMA invoicing service.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        <div>
          <div className="rounded-xl border bg-card p-4 mb-4 flex items-center justify-between">
            <div><p className="text-2xl font-bold text-[#0B1F4D]">{deals.length}</p><p className="text-xs text-gray-400">Total deals</p></div>
            <div className="text-right"><p className="text-2xl font-bold text-green-600">{money(totalCommission)}</p><p className="text-xs text-gray-400">Commission logged</p></div>
          </div>

          {deals.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-600 font-semibold">No deals yet</p>
              <p className="text-gray-400 text-sm mt-1">Submit your first deal on the right.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deals.map((d) => (
                <div key={d.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900">{d.product}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{d.supplier_ref} → {d.buyer_ref}{d.quantity ? ` · ${d.quantity}` : ''}</p>
                    </div>
                    <span className={`rounded-full text-[10px] font-extrabold px-2 py-0.5 ${STATUS_COLOR[d.status] ?? 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    {d.price_cents != null && <span>Value: <strong className="text-gray-700">{money(d.price_cents, d.currency_code)}</strong></span>}
                    {d.commission_pct != null && <span>Commission: <strong className="text-green-600">{d.commission_pct}% · {money(d.commission_cents, d.currency_code)}</strong></span>}
                    {d.needs_invoicing && <span className="text-violet-600 font-bold">TTAIEMA invoicing</span>}
                    <span className="text-gray-300">{new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:sticky lg:top-20"><DealForm canPost={canPost} /></div>
      </div>
    </div>
  )
}
