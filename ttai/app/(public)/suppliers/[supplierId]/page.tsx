import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { ProductGrid } from '@/components/marketplace/ProductGrid'
import { MessageButton } from '@/components/messages/MessageButton'
import { Crown, ShieldCheck, Award, Store, MapPin, Package, Globe, Clock } from 'lucide-react'
import type { ReliabilityTier } from '@/types/domain'

export const revalidate = 60

const TIER_CONFIG: Record<string, {
  label: string; bg: string; text: string; Icon: React.ComponentType<{ className?: string }>
}> = {
  GOLD:       { label: 'Gold Verified',     bg: 'bg-gradient-to-r from-amber-400 to-yellow-300', text: 'text-amber-900',  Icon: Crown },
  SILVER:     { label: 'Verified Supplier', bg: 'bg-gradient-to-r from-slate-300 to-gray-200',   text: 'text-gray-800',   Icon: ShieldCheck },
  BRONZE:     { label: 'Bronze Supplier',   bg: 'bg-gradient-to-r from-orange-400 to-amber-300', text: 'text-orange-900', Icon: Award },
  UNVERIFIED: { label: 'Supplier',          bg: 'bg-white/20',                                    text: 'text-white/90',   Icon: Store },
}

export default async function SupplierProfilePage({
  params,
}: {
  params: { supplierId: string }
}) {
  const supabase = createClient()

  const { data: supplier } = await (supabase.from('suppliers') as any)
    .select(`
      id, legal_name, trade_name, description, about_company, tagline,
      logo_url, banner_image, reliability_tier, status, brand_slug,
      years_experience, countries_served, founded_year, phone, whatsapp, website,
      countries(name, iso_code), cities(name)
    `)
    .eq('id', params.supplierId)
    .single() as { data: any }

  if (!supplier) notFound()

  // Full brand page exists → use the premium branded experience (Rozil-style)
  if (supplier.brand_slug && supplier.status === 'ACTIVE') {
    redirect(`/brand/${supplier.brand_slug}`)
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price_cents, currency_code, min_order_qty, marketplace_context, vat_rate, product_images(url, sort_order)')
    .eq('supplier_id', params.supplierId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const tier        = TIER_CONFIG[supplier.reliability_tier] ?? TIER_CONFIG.UNVERIFIED
  const displayName = supplier.trade_name ?? supplier.legal_name
  const initials    = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const country     = supplier.countries as { name: string; iso_code: string } | null
  const city        = supplier.cities    as { name: string } | null
  const location    = [city?.name, country?.name].filter(Boolean).join(', ')
  const about       = supplier.about_company ?? supplier.description ?? null
  const productCount = products?.length ?? 0

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ══ HERO BANNER (matches brand page style) ════════════════════════ */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        {supplier.banner_image ? (
          <Image src={supplier.banner_image} alt="" fill className="object-cover" sizes="100vw" priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F4D] via-[#1a3a7a] to-[#0d2d5e]" />
        )}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(5,15,40,0.92) 0%, rgba(5,15,40,0.55) 45%, rgba(5,15,40,0.12) 100%)',
        }} />

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-5">

            {/* Logo + name */}
            <div className="flex items-end gap-4 flex-1 min-w-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                {supplier.logo_url ? (
                  <Image src={supplier.logo_url} alt={displayName} width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-[#0B1F4D] flex items-center justify-center">
                    <span className="text-white font-extrabold text-2xl">{initials}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${tier.bg} ${tier.text}`}>
                    <tier.Icon className="w-3 h-3" />{tier.label}
                  </span>
                  {supplier.status !== 'ACTIVE' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white/80 border border-white/20">
                      Profile preview
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight truncate">{displayName}</h1>
                {supplier.tagline && (
                  <p className="text-white/70 text-sm mt-1 line-clamp-1">{supplier.tagline}</p>
                )}
                {location && (
                  <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{location}
                  </p>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="flex-shrink-0">
              <MessageButton supplierId={supplier.id} redirectBase="/buyer/messages" />
            </div>
          </div>
        </div>
      </div>

      {/* ══ STATS BAR ══════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[
              { Icon: Package, value: productCount,                      label: 'Products' },
              { Icon: Clock,   value: supplier.years_experience || '—',  label: 'Years Experience' },
              { Icon: Globe,   value: supplier.countries_served || '—',  label: 'Countries Served' },
            ].map(({ Icon, value, label }) => (
              <div key={label} className="py-5 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Icon className="w-4 h-4 text-[#F5A623]" />
                  <p className="text-xl font-extrabold text-[#0B1F4D]">{value}</p>
                </div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BODY ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-10">

        {/* About */}
        {about && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-[#F5A623] inline-block" />
              About {displayName}
            </h2>
            <p className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-line">{about}</p>
          </section>
        )}

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-extrabold text-[#0B1F4D]">Products ({productCount})</h2>
          </div>
          {products && products.length > 0 ? (
            <ProductGrid>
              {products.map((p: any) => {
                const images = p.product_images as { url: string; sort_order: number }[]
                const mainImg = images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url
                return (
                  <ProductCard
                    key={p.id}
                    product={p as Parameters<typeof ProductCard>[0]['product']}
                    supplier={{ legal_name: supplier.legal_name, trade_name: supplier.trade_name, reliability_tier: (supplier.reliability_tier ?? 'UNVERIFIED') as ReliabilityTier }}
                    mainImageUrl={mainImg}
                    href={`/product/${p.slug ?? p.id}`}
                  />
                )
              })}
            </ProductGrid>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Package className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold text-sm">No products published yet</p>
              <p className="text-gray-400 text-xs mt-1">Check back soon — this supplier is just getting started.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
