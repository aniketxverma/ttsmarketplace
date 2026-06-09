import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronLeft, ImageOff, Users, Package, BadgeCheck, ShieldCheck, Star,
  Clock, RotateCcw, Globe, Truck, Tag, Boxes, CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SellersTable, type Seller } from './SellersTable'
import { CopyProductButton } from '../../product/[slug]/CopyProductButton'

export const revalidate = 60

// EU member-state ISO codes — used to flag "No customs" vs "Customs may apply".
const EU_ISO = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'])

function isoToFlag(iso?: string | null) {
  if (!iso || iso.length !== 2) return '🌐'
  const A = 0x1f1e6
  return String.fromCodePoint(...iso.toUpperCase().split('').map((c) => A + c.charCodeAt(0) - 65))
}

function money(cents: number, currency: string, max = 0) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency, maximumFractionDigits: max }).format(cents / 100)
}

function sameC(a?: string | null, b?: string | null) {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()
}

const TIER_META: Record<string, { label: string; premium: boolean }> = {
  GOLD:   { label: 'Premium',  premium: true },
  SILVER: { label: 'Verified', premium: false },
  BRONZE: { label: 'Verified', premium: false },
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data: m } = await (admin.from('master_products') as any)
    .select('name, description, image_urls').eq('id', params.id).maybeSingle()
  if (!m) return {}
  return {
    title: `${m.name} — Compare suppliers · TTAI EMA`,
    description: (m.description ?? '').slice(0, 160),
    openGraph: { images: (m.image_urls ?? [])[0] ? [{ url: m.image_urls[0] }] : [] },
  }
}

export default async function MasterProductPage({ params, searchParams }: { params: { id: string }; searchParams: { shop?: string } }) {
  const supabase = createClient()
  // Public, read-only catalog reads via admin (service-role) so RLS can never 404 the page.
  const admin = createAdminClient()

  const { data: master } = await (admin.from('master_products') as any)
    .select('id, name, brand_name, family, model, ean, description, specs, image_urls, capacity, color, region, categories(name, slug)')
    .eq('id', params.id)
    .maybeSingle()
  if (!master) notFound()

  // Buyer's country (for "nearest supplier") — from their profile, if logged in.
  const { data: { user } } = await supabase.auth.getUser()
  let buyerCountry: string | null = null
  if (user) {
    const { data: prof } = await (supabase.from('profiles') as any)
      .select('country_name, tax_country').eq('id', user.id).maybeSingle()
    buyerCountry = prof?.country_name ?? prof?.tax_country ?? null
  }

  const retail = searchParams.shop === 'online'
  const shopQ = retail ? '?shop=online' : ''

  const { data: rows } = await (admin.from('products') as any)
    .select(`
      id, slug, name, price_cents, retail_price_cents, vat_rate, currency_code, stock_qty, min_order_qty,
      condition, warranty, warehouse_location, delivery_days, lead_time,
      suppliers!supplier_id!inner(id, legal_name, trade_name, reliability_tier, status, whatsapp, brand_slug, cities(name), countries(name, iso_code)),
      product_images(url, sort_order)
    `)
    .eq('master_product_id', params.id)
    .eq('is_published', true)
    .eq('suppliers.status', 'ACTIVE')

  const offerRows = (rows ?? []) as any[]

  // Per-offer shipping cost (defensive — column may not be migrated yet).
  const shipMap = new Map<string, number>()
  try {
    const ids = offerRows.map((p) => p.id)
    if (ids.length) {
      const { data } = await (admin.from('products') as any).select('id, shipping_cents').in('id', ids)
      for (const r of (data ?? []) as any[]) if (r.shipping_cents != null) shipMap.set(r.id, r.shipping_cents)
    }
  } catch { /* not migrated */ }

  const sellers: Seller[] = offerRows.map((p) => {
    const s = p.suppliers
    const iso = s?.countries?.iso_code ?? null
    const retailCents = p.retail_price_cents ?? (p.vat_rate ? p.price_cents + Math.round(p.price_cents * p.vat_rate / 100) : p.price_cents)
    const productPriceCents = retail ? retailCents : p.price_cents
    const shippingCents = shipMap.has(p.id) ? shipMap.get(p.id)! : null
    const euOk = iso ? EU_ISO.has(iso.toUpperCase()) : false
    const tier = TIER_META[s?.reliability_tier ?? ''] ?? { label: 'Supplier', premium: false }
    return {
      productId: p.id, slug: p.slug, href: `/product/${p.slug ?? p.id}${shopQ}`,
      productPriceCents, shippingCents, totalCents: productPriceCents + (shippingCents ?? 0),
      currency: p.currency_code,
      condition: p.condition ?? null, region: master.region ?? null,
      customsNote: euOk ? 'No customs (EU)' : 'Customs may apply',
      customsOk: euOk,
      deliveryDays: p.delivery_days ?? null, leadTime: p.lead_time ?? null, stock: p.stock_qty ?? 0,
      city: s?.cities?.name ?? null, country: s?.countries?.name ?? null, flag: isoToFlag(iso),
      supplierName: s?.trade_name ?? s?.legal_name ?? 'Supplier',
      verified: s?.status === 'ACTIVE', premium: tier.premium, tierLabel: tier.label,
      whatsapp: s?.whatsapp ?? null, brandSlug: s?.brand_slug ?? null,
      nearby: buyerCountry ? (sameC(s?.countries?.name, buyerCountry) || sameC(iso, buyerCountry)) : false,
    }
  })

  const masterImages: string[] = master.image_urls ?? []
  const specs = (master.specs ?? {}) as Record<string, any>
  const specEntries = Object.entries(specs).filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
  const variantLine = [master.brand_name, master.model, master.capacity, master.color, master.region].filter(Boolean).join(' · ')
  const currency = sellers[0]?.currency ?? 'EUR'

  // Header stats (real data).
  const bestTotal = sellers.length ? Math.min(...sellers.map((s) => s.totalCents)) : 0
  const totalStock = sellers.reduce((n, s) => n + (s.stock || 0), 0)
  const deliveries = sellers.map((s) => s.deliveryDays).filter((d): d is number => d != null)
  const avgDelivery = deliveries.length ? Math.round(deliveries.reduce((a, b) => a + b, 0) / deliveries.length) : null
  const hasEU = sellers.some((s) => s.customsOk)
  const hasImport = sellers.some((s) => !s.customsOk)

  // Attribute box uses the best (cheapest) offer for condition/warranty defaults.
  const lead = sellers.slice().sort((a, b) => a.totalCents - b.totalCents)[0] ?? null
  const ATTR = [
    { Icon: Package,     label: 'Product Type', value: (master.categories as any)?.name ?? 'Product' },
    { Icon: BadgeCheck,  label: 'Condition',    value: lead?.condition ?? 'Brand New' },
    { Icon: ShieldCheck, label: 'Warranty',     value: offerRows.find((p) => p.warranty)?.warranty ?? '1 Year Warranty' },
    { Icon: Globe,       label: 'Region Spec',  value: master.region ?? 'Global' },
    { Icon: RotateCcw,   label: 'Returns',      value: '30 Days Return' },
    { Icon: CheckCircle2, label: 'Verified Product', value: 'Yes', good: true },
  ]

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-4 flex-wrap">
        <Link href="/marketplace" className="hover:text-[#0B1F4D]">Home</Link><span>/</span>
        {(master.categories as any)?.name && <><span>{(master.categories as any).name}</span><span>/</span></>}
        {master.brand_name && <><span>{master.brand_name}</span><span>/</span></>}
        <span className="text-[#0B1F4D] font-semibold">{master.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* ── MAIN ── */}
        <div className="min-w-0">
          {/* Hero */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
              {/* Gallery */}
              <div>
                <div className="relative aspect-square rounded-xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center">
                  {masterImages[0] ? <Image src={masterImages[0]} alt={master.name} fill className="object-contain p-3" sizes="260px" priority /> : <ImageOff className="w-10 h-10 text-gray-300" />}
                </div>
                {masterImages.length > 1 && (
                  <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                    {masterImages.slice(0, 5).map((u, i) => (
                      <div key={i} className="relative aspect-square rounded-md bg-gray-50 overflow-hidden border border-gray-100">
                        <Image src={u} alt="" fill className="object-contain p-0.5" sizes="48px" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title + key facts + attribute box */}
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1F4D] leading-tight">{master.name}</h1>
                  <BadgeCheck className="w-5 h-5 text-[#2563eb] flex-shrink-0 mt-1" />
                </div>
                {variantLine && <p className="text-sm text-gray-400 mt-0.5">{variantLine}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-4">
                  <div className="text-sm space-y-1">
                    {master.brand_name && <Row k="Brand" v={master.brand_name} />}
                    {master.model && <Row k="Model" v={master.model} />}
                    {master.capacity && <Row k="Storage" v={master.capacity} />}
                    {master.color && <Row k="Color" v={master.color} />}
                    {master.ean && <Row k="EAN" v={master.ean} mono />}
                    {(master.categories as any)?.name && <Row k="Category" v={(master.categories as any).name} />}
                  </div>

                  {/* Attribute box */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-2">
                    {ATTR.map((a) => (
                      <div key={a.label} className="flex items-center gap-2.5">
                        <a.Icon className={`w-4 h-4 flex-shrink-0 ${a.good ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 leading-none">{a.label}</p>
                          <p className="text-xs font-bold text-[#0B1F4D] truncate">{a.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {specEntries.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-gray-500 mb-1">Specifications</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-gray-600 list-disc pl-4">
                      {specEntries.slice(0, 8).map(([k, v]) => (
                        <li key={k}><span className="text-gray-400">{k.replace(/_/g, ' ')}: </span><span className="font-semibold text-gray-700">{String(v)}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-100">
              <Stat Icon={Users} label="Active Suppliers" value={`${sellers.length}`} />
              <Stat Icon={Boxes} label="Total Stock" value={`${totalStock.toLocaleString()}`} />
              <Stat Icon={Tag} label="Best Price" value={sellers.length ? money(bestTotal, currency) : '—'} accent />
              <Stat Icon={Clock} label="Avg Delivery" value={avgDelivery != null ? `${avgDelivery} days` : '—'} />
            </div>
          </div>

          {/* Available sellers */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
            {sellers.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No active offers for this product yet.</p>
            ) : (
              <SellersTable sellers={sellers} productName={master.name} />
            )}
          </div>

          {/* Supplier-only: add your offer */}
          <SupplierAddOffer masterId={master.id} masterName={master.name} />
        </div>

        {/* ── SIDEBAR ── */}
        <aside className="space-y-4">
          {/* Why one page */}
          <Panel title="Why only one product page?" tone="amber">
            {['No duplicate products', 'Easy comparison', 'Best price & delivery', 'Clean marketplace', 'Better experience'].map((t) => (
              <li key={t} className="flex items-center gap-2 text-xs text-gray-600"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{t}</li>
            ))}
          </Panel>

          {/* Buy box prioritization */}
          <Panel title="Automatic Prioritization (Buy Box)" tone="blue">
            {[['Best Price', Tag], ['Nearest Supplier', Globe], ['Fastest Delivery', Truck], ['Premium Supplier', Star]].map(([t, I], i) => {
              const Icon = I as any
              return (
                <li key={t as string} className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-[#0B1F4D] text-white text-[9px] font-extrabold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <Icon className="w-3.5 h-3.5 text-gray-400" /><span className="font-semibold">{t as string}</span>
                </li>
              )
            })}
          </Panel>

          {/* Important information */}
          {(hasEU || hasImport) && (
            <Panel title="Important Information" tone="plain">
              {hasEU && (
                <div className="text-xs">
                  <p className="font-bold text-[#0B1F4D] flex items-center gap-1.5">🇪🇺 European Stock</p>
                  <ul className="mt-1 space-y-0.5 text-gray-500 pl-4 list-disc"><li>No customs</li><li>Fast delivery</li><li>VAT included</li></ul>
                </div>
              )}
              {hasImport && (
                <div className="text-xs">
                  <p className="font-bold text-[#0B1F4D] flex items-center gap-1.5">🌐 Import (non-EU)</p>
                  <ul className="mt-1 space-y-0.5 text-gray-500 pl-4 list-disc"><li>Shipping may apply</li><li>Customs: check before order</li><li>VAT may apply</li></ul>
                </div>
              )}
            </Panel>
          )}
        </aside>
      </div>
    </div>
  )
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-16 flex-shrink-0">{k}:</span>
      <span className={`font-semibold text-[#0B1F4D] ${mono ? 'font-mono text-xs' : ''}`}>{v}</span>
    </div>
  )
}

function Stat({ Icon, label, value, accent }: { Icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`w-4 h-4 ${accent ? 'text-green-600' : 'text-[#0B1F4D]'}`} />
      <div>
        <p className="text-[10px] uppercase tracking-wide text-gray-400 leading-none">{label}</p>
        <p className={`text-sm font-extrabold ${accent ? 'text-green-600' : 'text-[#0B1F4D]'}`}>{value}</p>
      </div>
    </div>
  )
}

function Panel({ title, tone, children }: { title: string; tone: 'amber' | 'blue' | 'plain'; children: React.ReactNode }) {
  const bg = tone === 'amber' ? 'bg-amber-50 border-amber-100' : tone === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'
  return (
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <h3 className="text-sm font-extrabold text-[#0B1F4D] mb-2.5">{title}</h3>
      <ul className="space-y-1.5">{children}</ul>
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
