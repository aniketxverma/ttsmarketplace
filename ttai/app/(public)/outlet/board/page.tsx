import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PostRequestForm } from '@/components/outlet/PostRequestForm'
import { conditionInfo, unitInfo } from '@/lib/outlet'
import { ShoppingCart, Megaphone, ArrowLeft, Mail, MessageCircle, MapPin, Tag, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Outlet Trade Board · Buying Requests & Selling Opportunities · TTAI EMA',
  description: 'Brokers, suppliers and outlet buyers post buying requests and selling opportunities for clearance, returns and liquidation stock.',
}

export default async function TradeBoardPage({ searchParams }: { searchParams: { kind?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const kind = searchParams.kind === 'sell' ? 'sell' : searchParams.kind === 'buy' ? 'buy' : null

  // Read via service role (public board, read-only) so it shows regardless of RLS.
  let rows: any[] = []
  try {
    let q = (createAdminClient().from('trade_requests') as any)
      .select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(200)
    if (kind) q = q.eq('kind', kind)
    const { data } = await q
    rows = data ?? []
  } catch { rows = [] }

  const tab = (k: string | null, label: string) => (
    <Link href={k ? `/outlet/board?kind=${k}` : '/outlet/board'}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${kind === k ? 'bg-white text-[#0B1F4D] shadow-sm' : 'text-gray-500 hover:text-[#0B1F4D]'}`}>{label}</Link>
  )

  return (
    <div className="min-h-screen bg-[#F4F6FB] overflow-x-hidden">
      <div className="bg-gradient-to-br from-[#1a1207] via-[#2a1c0c] to-[#0a0e1a] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
          <Link href="/outlet" className="inline-flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white mb-3"><ArrowLeft className="w-3.5 h-3.5" /> Outlet Zone</Link>
          <h1 className="text-3xl sm:text-4xl font-black">Trade Board</h1>
          <p className="text-orange-100/80 mt-2 max-w-2xl text-sm sm:text-base">Buying requests &amp; selling opportunities for clearance, returns and liquidation stock — brokers, suppliers and outlet buyers welcome.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        {/* Board */}
        <div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max mb-5">
            {tab(null, 'All')}{tab('buy', 'Buying')}{tab('sell', 'Selling')}
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-bold text-lg">No posts yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first — post a buying request or selling opportunity on the right.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const isBuy = r.kind === 'buy'
                const cond = conditionInfo(r.condition)
                const unit = unitInfo(r.selling_unit)
                const wa = r.contact_whatsapp ? `https://wa.me/${String(r.contact_whatsapp).replace(/\D/g, '')}` : null
                return (
                  <div key={r.id} className="rounded-2xl bg-white border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className={`inline-flex items-center gap-1 rounded-full text-[10px] font-extrabold px-2 py-0.5 ${isBuy ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isBuy ? <ShoppingCart className="w-3 h-3" /> : <Megaphone className="w-3 h-3" />}{isBuy ? 'Buying' : 'Selling'}
                        </span>
                        <h3 className="font-bold text-gray-900 mt-1.5 leading-snug">{r.title}</h3>
                        {r.company_name && <p className="text-xs text-gray-400 mt-0.5">{r.company_name}</p>}
                      </div>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>

                    {r.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-3">{r.description}</p>}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11px] text-gray-500">
                      {cond && <span className={`rounded-full px-2 py-0.5 font-bold ${cond.color}`}>{cond.short}</span>}
                      {unit && <span className="rounded-full bg-gray-100 px-2 py-0.5 font-bold">{unit.label}</span>}
                      {r.category && <span className="inline-flex items-center gap-0.5"><Package className="w-3 h-3" />{r.category}</span>}
                      {r.brand && <span className="inline-flex items-center gap-0.5"><Tag className="w-3 h-3" />{r.brand}</span>}
                      {r.quantity && <span>Qty: {r.quantity}</span>}
                      {r.budget && <span className="font-bold text-[#0B1F4D]">{r.budget}</span>}
                      {r.country_name && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{r.country_name}</span>}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {r.contact_email && <a href={`mailto:${r.contact_email}`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F4D] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#162d6e]"><Mail className="w-3.5 h-3.5" /> Contact</a>}
                      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 text-green-600 px-3.5 py-1.5 text-xs font-bold hover:bg-green-50"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Post form */}
        <div className="lg:sticky lg:top-20">
          <PostRequestForm loggedIn={!!user} />
        </div>
      </div>
    </div>
  )
}
