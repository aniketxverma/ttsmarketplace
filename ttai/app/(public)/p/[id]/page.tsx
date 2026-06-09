import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ImageOff, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { sortOffers } from '@/lib/offers'
import { OfferList, type Offer } from './OfferList'
import { CopyProductButton } from '../../product/[slug]/CopyProductButton'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: m } = await (supabase.from('master_products') as any)
    .select('name, description, image_urls').eq('id', params.id).maybeSingle()
  if (!m) return {}
  return {
    title: `${m.name} — Compare suppliers · TTAI EMA`,
    description: (m.description ?? '').slice(0, 160),
    openGraph: { images: (m.image_urls ?? [])[0] ? [{ url: m.image_urls[0] }] : [] },
  }
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100)
}

function sameC(a?: string | null, b?: string | null) {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()
}

export default async function MasterProductPage({ params, searchParams }: { params: { id: string }; searchParams: { shop?: string } }) {
  const supabase = createClient()

  const { data: master } = await (supabase.from('master_products') as any)
    .select('id, name, brand_name, family, model, ean, description, specs, image_urls, capacity, color, region, categories(name, slug)')
    .eq('id', params.id)
    .maybeSingle()
  if (!master) notFound()

  // Buyer's country (for "nearest supplier" ranking) — from their profile, if logged in.
  const { data: { user } } = await supabase.auth.getUser()
  let buyerCountry: string | null = null
  if (user) {
    const { data: prof } = await (supabase.from('profiles') as any)
      .select('country_name, tax_country').eq('id', user.id).maybeSingle()
    buyerCountry = prof?.country_name ?? prof?.tax_country ?? null
  }

  // Retail (consumer) presentation when arriving from the Online Store.
  const retail = searchParams.shop === 'online'

  // All supplier offers for this master = published products linked to it.
  const { data: rows } = await (supabase.from('products') as any)
    .select(`
      id, slug, name, price_cents, retail_price_cents, vat_rate, currency_code, stock_qty, min_order_qty,
      condition, warranty, warehouse_location, delivery_days, lead_time,
      suppliers!supplier_id!inner(id, legal_name, trade_name, reliability_tier, status, cities(name), countries(name, iso_code)),
      product_images(url, sort_order)
    `)
    .eq('master_product_id', params.id)
    .eq('is_published', true)
    .eq('suppliers.status', 'ACTIVE')

  const masterImages: string[] = master.image_urls ?? []

  const offers: Offer[] = sortOffers(
    ((rows ?? []) as any[]).map((p) => {
      const s = p.suppliers
      const img = (p.product_images ?? []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ?? masterImages[0]
      // Retail surface shows the consumer price (retail set, else wholesale + VAT).
      const retailCents = p.retail_price_cents ?? (p.vat_rate ? p.price_cents + Math.round(p.price_cents * p.vat_rate / 100) : p.price_cents)
      const showCents = retail ? retailCents : p.price_cents
      return {
        productId: p.id, slug: p.slug, name: p.name,
        priceCents: showCents, currency: p.currency_code, stock: p.stock_qty ?? 0,
        condition: p.condition ?? null, warranty: p.warranty ?? null, warehouse: p.warehouse_location ?? null,
        deliveryDays: p.delivery_days ?? null, leadTime: p.lead_time ?? null,
        location: [s?.cities?.name, s?.countries?.name].filter(Boolean).join(', ') || null,
        nearby: buyerCountry ? (sameC(s?.countries?.name, buyerCountry) || sameC(s?.countries?.iso_code, buyerCountry)) : false,
        retail,
        supplierName: s?.trade_name ?? s?.legal_name ?? 'Supplier', supplierId: s?.id,
        tier: s?.reliability_tier ?? 'UNVERIFIED', imageUrl: img,
        minOrderQty: retail ? 1 : (p.min_order_qty ?? 1),
        // ranking inputs (rank on wholesale price for stable ordering)
        price_cents: p.price_cents, master_product_id: params.id, stock_qty: p.stock_qty ?? 0,
        reliability_tier: s?.reliability_tier ?? 'UNVERIFIED',
        country: s?.countries?.name ?? s?.countries?.iso_code ?? null,
      } as any
    }),
    { buyerCountry },
  ) as any

  const best = offers[0] ?? null
  const specs = (master.specs ?? {}) as Record<string, any>
  const specEntries = Object.entries(specs).filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
  const variantLine = [master.brand_name, master.model, master.capacity, master.color, master.region].filter(Boolean).join(' · ')

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0B1F4D] mb-5">
        <ChevronLeft className="w-4 h-4" /> Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center">
            {masterImages[0] ? <Image src={masterImages[0]} alt={master.name} fill className="object-contain p-4" sizes="(max-width:1024px) 100vw, 50vw" priority /> : <ImageOff className="w-10 h-10 text-gray-300" />}
          </div>
          {masterImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-2">
              {masterImages.slice(0, 5).map((u, i) => (
                <div key={i} className="relative aspect-square rounded-lg bg-gray-50 overflow-hidden border border-gray-100">
                  <Image src={u} alt="" fill className="object-contain p-1" sizes="80px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          {master.brand_name && <p className="text-xs font-bold uppercase tracking-widest text-[#F5A623] mb-1">{master.brand_name}</p>}
          <h1 className="text-2xl font-extrabold text-[#0B1F4D] leading-tight">{master.name}</h1>
          {variantLine && <p className="text-sm text-gray-400 mt-1">{variantLine}</p>}

          <div className="flex items-center gap-2 mt-4 text-sm">
            <Users className="w-4 h-4 text-[#0B1F4D]" />
            <span className="font-bold text-[#0B1F4D]">{offers.length}</span>
            <span className="text-gray-500">supplier{offers.length === 1 ? '' : 's'} selling this product</span>
          </div>

          {best && (
            <div className="mt-4 rounded-2xl bg-[#0B1F4D] text-white p-5">
              <p className="text-xs uppercase tracking-wide text-white/60">Best price</p>
              <p className="text-3xl font-extrabold mt-0.5">{money(best.priceCents, best.currency)}</p>
              <p className="text-xs text-white/70 mt-1">from {best.supplierName}{best.location ? ` · ${best.location}` : ''}{best.deliveryDays != null ? ` · ${best.deliveryDays}d delivery` : ''}</p>
            </div>
          )}

          {master.description && <p className="text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-line">{master.description}</p>}

          {master.ean && <p className="text-xs text-gray-400 mt-3">EAN: <span className="font-mono">{master.ean}</span></p>}
        </div>
      </div>

      {/* Offers */}
      <section className="mb-10">
        <h2 className="text-lg font-extrabold text-[#0B1F4D] mb-4">Choose a supplier ({offers.length})</h2>
        {offers.length === 0 ? (
          <p className="text-sm text-gray-400">No active offers for this product yet.</p>
        ) : (
          <OfferList offers={offers} />
        )}
      </section>

      {/* Specifications */}
      {specEntries.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-extrabold text-[#0B1F4D] mb-4">Specifications</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
            {specEntries.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-400">{k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                <span className="text-xs font-bold text-[#0B1F4D] text-right">{String(v)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Supplier-only: attach your own offer to this master */}
      <SupplierAddOffer masterId={master.id} masterName={master.name} />
    </div>
  )
}

async function SupplierAddOffer({ masterId, masterName }: { masterId: string; masterName: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: sup } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).maybeSingle()
  if (!sup) return null
  return (
    <section className="rounded-2xl border-2 border-dashed border-gray-200 p-6 max-w-md">
      <h3 className="font-extrabold text-[#0B1F4D] mb-1">Sell this product too</h3>
      <p className="text-xs text-gray-500 mb-3">Your offer joins this listing — just add price, stock &amp; delivery. No duplicate product page.</p>
      <CopyProductButton masterId={masterId} productName={masterName} />
    </section>
  )
}
