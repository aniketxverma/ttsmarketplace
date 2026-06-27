import { notFound } from 'next/navigation'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import Image from 'next/image'
import Link from 'next/link'
import { Tag, ShieldCheck, MessageCircle, Mail, ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency, minimumFractionDigits: 2 }).format(cents / 100)
}

export async function generateMetadata({ params }: { params: { token: string } }) {
  const admin = createAdminClient()
  const { data: o } = await (admin.from('supplier_offers') as any).select('title, message').eq('token', params.token).maybeSingle()
  return o ? { title: `${o.title} · TTAI EMA`, description: (o.message ?? '').slice(0, 160) } : {}
}

export default async function OfferPage({ params }: { params: { token: string } }) {
  
  const tt = await localizeUI(["Special offer", "This offer has no products listed.", "Interested? Contact", "Place an order or ask for a custom quote.", "WhatsApp", "Email", "Visit store"], getLocale())
  const admin = createAdminClient()
  const { data: offer } = await (admin.from('supplier_offers') as any)
    .select('id, title, message, discount_pct, product_ids, supplier_id').eq('token', params.token).maybeSingle()
  if (!offer) notFound()

  const { data: supplier } = await (admin.from('suppliers') as any)
    .select('trade_name, legal_name, brand_slug, id, logo_url, whatsapp, business_email').eq('id', offer.supplier_id).maybeSingle()
  const supplierName = supplier?.trade_name ?? supplier?.legal_name ?? 'Supplier'

  const ids: string[] = offer.product_ids ?? []
  let products: any[] = []
  if (ids.length) {
    const { data } = await (admin.from('products') as any)
      .select('id, name, slug, price_cents, currency_code, retail_price_cents, product_images(url, sort_order)')
      .in('id', ids).eq('is_published', true)
    products = data ?? []
  }
  const disc = offer.discount_pct ? Number(offer.discount_pct) : 0
  const withDisc = (c: number) => (disc > 0 ? Math.round(c * (1 - disc / 100)) : c)

  const wa = supplier?.whatsapp ? `https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${supplierName}! I'm interested in your offer: ${offer.title}`)}` : null

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1e3a8a] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-2"><Tag className="w-3.5 h-3.5" /> {tt("Special offer")}</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{offer.title}</h1>
          {offer.message && <p className="text-blue-100 text-sm mt-2 max-w-xl mx-auto">{offer.message}</p>}
          <div className="flex items-center justify-center gap-2 mt-4 text-sm">
            <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-green-300" /> {supplierName}
            </span>
            {disc > 0 && <span className="bg-red-500 rounded-full px-3 py-1 font-extrabold">−{disc}% OFF</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => {
              const img = (p.product_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url
              const base = p.retail_price_cents ?? p.price_cents
              return (
                <Link key={p.id} href={`/product/${p.slug ?? p.id}`} className="group bg-white rounded-2xl border border-gray-100 p-3 hover:shadow-md transition-shadow">
                  <div className="relative aspect-square rounded-lg bg-gray-50 overflow-hidden mb-2 flex items-center justify-center">
                    {img ? <Image src={img} alt="" fill className="object-contain p-1 group-hover:scale-105 transition-transform" sizes="160px" /> : <Tag className="w-5 h-5 text-gray-300" />}
                  </div>
                  <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">{p.name}</p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-sm font-extrabold text-[#0B1F4D]">{money(withDisc(base), p.currency_code)}</span>
                    {disc > 0 && <span className="text-[11px] text-gray-400 line-through">{money(base, p.currency_code)}</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">{tt("This offer has no products listed.")}</p>
        )}

        {/* Contact CTA */}
        <div className="mt-8 rounded-2xl bg-white border border-gray-100 p-6 text-center">
          <h3 className="font-extrabold text-[#0B1F4D]">{tt("Interested? Contact")} {supplierName}</h3>
          <p className="text-sm text-gray-400 mt-1 mb-4">{tt("Place an order or ask for a custom quote.")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-green-500 text-white px-5 py-2.5 text-sm font-bold hover:bg-green-400"><MessageCircle className="w-4 h-4" /> {tt("WhatsApp")}</a>}
            {supplier?.business_email && <a href={`mailto:${supplier.business_email}?subject=${encodeURIComponent('Offer: ' + offer.title)}`} className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] px-5 py-2.5 text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-colors"><Mail className="w-4 h-4" /> {tt("Email")}</a>}
            <Link href={`/brand/${supplier?.brand_slug ?? supplier?.id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563eb] hover:underline">{tt("Visit store")} <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </div>
    </div>
  )
}
