import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Crown, ShieldCheck, Award, Store, ChevronLeft, Package, Users, ArrowRight } from 'lucide-react'
import { ProductImageGallery } from './ProductImageGallery'
import { CheckoutButton } from './CheckoutButton'
import { useServerTranslations } from '@/lib/i18n/server'
import { BrandLogo } from '@/components/BrandLogo'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: p } = await supabase
    .from('products')
    .select('name, description, product_images(url, sort_order)')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single() as { data: any }

  if (!p) return {}
  const imgs = ((p.product_images ?? []) as any[]).sort((a: any, b: any) => a.sort_order - b.sort_order)
  return {
    title: `${p.name} — Wholesale Product · TTAI EMA`,
    description: p.description?.slice(0, 160),
    openGraph: { images: imgs[0]?.url ? [{ url: imgs[0].url }] : [] },
  }
}

const TIER: Record<string, { label: string; bg: string; text: string; Icon: React.ComponentType<{ className?: string }> }> = {
  GOLD:       { label: 'Gold Verified',     bg: 'bg-gradient-to-r from-amber-400 to-yellow-300', text: 'text-amber-900',  Icon: Crown },
  SILVER:     { label: 'Verified Supplier', bg: 'bg-gradient-to-r from-slate-300 to-gray-200',   text: 'text-gray-800',   Icon: ShieldCheck },
  BRONZE:     { label: 'Bronze',            bg: 'bg-gradient-to-r from-orange-300 to-amber-200', text: 'text-orange-900', Icon: Award },
  UNVERIFIED: { label: 'Supplier',          bg: 'bg-gray-100',                                    text: 'text-gray-600',   Icon: Store },
}

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100)
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { t } = await useServerTranslations()
  const supabase = createClient()

  const PRODUCT_SELECT = `
    id, name, slug, description, price_cents, currency_code,
    min_order_qty, stock_qty, is_published, marketplace_context,
    product_images(url, sort_order),
    categories(name, slug),
    suppliers(
      id, trade_name, legal_name, brand_slug, logo_url, tagline,
      phone, whatsapp, business_email, reliability_tier,
      years_experience, employee_count, countries_served,
      countries(name), cities(name)
    )
  `

  // Try slug lookup first
  let { data: product } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single() as { data: any }

  // Fallback: treat the param as a UUID (id) — handles old links or brand-page ID links
  if (!product) {
    const { data: byId } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('id', params.slug)
      .eq('is_published', true)
      .single() as { data: any }
    product = byId
  }

  if (!product) notFound()

  const supplier = product.suppliers as any
  const images   = ((product.product_images ?? []) as any[]).sort((a: any, b: any) => a.sort_order - b.sort_order)
  const tier     = TIER[supplier?.reliability_tier ?? 'UNVERIFIED'] ?? TIER.UNVERIFIED

  // More products from same supplier (exclude current)
  const { data: moreRaw } = await supabase
    .from('products')
    .select('id, name, slug, price_cents, currency_code, min_order_qty, product_images(url, sort_order)')
    .eq('supplier_id', supplier?.id)
    .eq('is_published', true)
    .neq('slug', params.slug)
    .limit(6) as { data: any[] | null }

  const more = (moreRaw ?? []).map((p: any) => {
    const imgs = ((p.product_images ?? []) as any[]).sort((a: any, b: any) => a.sort_order - b.sort_order)
    return { ...p, thumb: imgs[0]?.url ?? null }
  })

  const waHref = supplier?.whatsapp
    ? `https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}?text=Hola! Estoy interesado/a en: ${product.name}`
    : null

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-11 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/marketplace" className="hover:text-[#0B1F4D] transition-colors">{t('product.breadcrumb')}</Link>
          <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
          {supplier?.brand_slug && (
            <>
              <Link href={`/brand/${supplier.brand_slug}`} className="hover:text-[#0B1F4D] transition-colors font-medium">
                {supplier.trade_name ?? supplier.legal_name}
              </Link>
              <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
            </>
          )}
          <span className="text-gray-600 truncate">{product.name}</span>
        </div>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left: image gallery */}
          <div className="lg:sticky lg:top-20">
            <ProductImageGallery images={images} name={product.name} />
          </div>

          {/* Right: details */}
          <div className="space-y-6">

            {/* Category + name */}
            <div>
              {product.categories?.name && (
                <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-1">
                  {product.categories.name}
                </p>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D] leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price + MOQ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-baseline gap-3 flex-wrap mb-4">
                <span className="text-3xl font-black text-[#0B1F4D]">
                  {fmt(product.price_cents, product.currency_code)}
                </span>
                <span className="text-sm text-gray-400 font-medium">{t('product.per_unit')}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F7F8FA] rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t('product.min_order')}</p>
                  <p className="text-lg font-extrabold text-[#0B1F4D]">{product.min_order_qty} <span className="text-sm font-semibold text-gray-500">{t('product.min_order_uds')}</span></p>
                </div>
                <div className="bg-[#F7F8FA] rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t('product.stock')}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${product.stock_qty > 100 ? 'bg-green-500' : product.stock_qty > 0 ? 'bg-amber-400' : 'bg-red-500'}`} />
                    <p className="text-lg font-extrabold text-[#0B1F4D]">
                      {product.stock_qty > 500 ? '+500' : product.stock_qty}
                      <span className="text-sm font-semibold text-gray-500"> {t('product.in_stock')}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide mb-2">{t('product.description')}</h2>
                <p className="text-gray-600 leading-relaxed text-[15px]">{product.description}</p>
              </div>
            )}

            {/* ── Add to Cart + Buy Now ─────────────────────────────── */}
            <CheckoutButton
              productId={product.id}
              name={product.name}
              price_cents={product.price_cents}
              currency_code={product.currency_code}
              imageUrl={images[0]?.url}
              supplierName={supplier?.trade_name ?? supplier?.legal_name ?? ''}
              min_order_qty={product.min_order_qty}
              disabled={product.stock_qty === 0}
            />

            {/* ── Secondary contact (WhatsApp / Call) ──────────────── */}
            {(waHref || supplier?.phone) && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-gray-400 font-medium shrink-0">{t('product.contact_wa').split(' ')[0]}:</span>
                {waHref && (
                  <a href={waHref} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 border border-green-200 hover:border-green-400 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-all">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
                {supplier?.phone && (
                  <a href={`tel:${supplier.phone}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F4D] border border-gray-200 hover:border-[#0B1F4D] bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {t('product.call')}
                  </a>
                )}
              </div>
            )}

            {/* Supplier card */}
            {supplier && (
              <Link href={`/brand/${supplier.brand_slug}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-[#0B1F4D]/20 transition-all group">
                {/* Logo */}
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-white">
                  <BrandLogo
                    src={supplier.logo_url}
                    name={supplier.trade_name ?? supplier.legal_name ?? 'S'}
                    size={56}
                    textClass="text-xl"
                  />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-extrabold text-[#0B1F4D] text-sm truncate">{supplier.trade_name ?? supplier.legal_name}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${tier.bg} ${tier.text}`}>
                      <tier.Icon className="w-2.5 h-2.5" />{tier.label}
                    </span>
                  </div>
                  {supplier.tagline && <p className="text-xs text-gray-400 truncate">{supplier.tagline}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    {supplier.years_experience > 0 && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                        <Package className="w-3 h-3" />{supplier.years_experience} {t('common.years')}
                      </span>
                    )}
                    {supplier.countries_served > 0 && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                        <Users className="w-3 h-3" />{supplier.countries_served} {t('common.countries')}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0B1F4D] transition-colors flex-shrink-0" />
              </Link>
            )}

          </div>
        </div>

        {/* ── More from this supplier ─────────────────────────────────────── */}
        {more.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-[#0B1F4D]">{t('product.more_from')} {supplier?.trade_name}</h2>
              {supplier?.brand_slug && (
                <Link href={`/brand/${supplier.brand_slug}`}
                  className="text-sm font-bold text-[#0B1F4D] hover:underline flex items-center gap-1">
                  {t('product.view_all')} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {more.map((p: any) => (
                <Link key={p.id} href={`/product/${p.slug ?? p.id}`}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                  <div className="relative aspect-square bg-[#F5F5F3]">
                    {p.thumb ? (
                      <Image src={p.thumb} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-2 mb-1">{p.name}</p>
                    <p className="text-xs font-extrabold text-[#0B1F4D]">{fmt(p.price_cents, p.currency_code)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
