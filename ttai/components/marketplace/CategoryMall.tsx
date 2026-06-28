'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n/client'
import { Smartphone, UtensilsCrossed, SprayCan, Car, Package, ArrowRight } from 'lucide-react'

export type MallProduct = { slug: string; name: string; img: string; priceCents: number; currency: string }
export type MallCat = {
  name: string
  slug: string
  accent: string
  icon: string
  count: number
  subs: string[]
  products: MallProduct[]
  /** Override link (e.g. the Outlet card points at /outlet, not a category). */
  href?: string
  /** Small corner badge, e.g. "NEW" on the distinct Outlet card. */
  badge?: string
}

const ICONS: Record<string, typeof Package> = {
  smartphone: Smartphone, food: UtensilsCrossed, cleaning: SprayCan, car: Car,
}

function price(cents: number, currency: string) {
  try { return new Intl.NumberFormat('en-EU', { style: 'currency', currency, maximumFractionDigits: 2 }).format(cents / 100) }
  catch { return `€${(cents / 100).toFixed(2)}` }
}

function Row({ c }: { c: MallCat }) {
  const t = useT()
  const Icon = ICONS[c.icon] ?? Package
  const target = c.href ?? `/marketplace?category=${c.slug}`

  return (
    <div className={`overflow-hidden rounded-3xl border bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 ${c.badge ? 'border-orange-200' : 'border-gray-100'}`}>
      <div className="flex flex-col lg:flex-row items-stretch">
        {/* Hero panel — clickable into the category (or /outlet for the Outlet card) */}
        <Link
          href={target}
          className="group relative overflow-hidden lg:w-[300px] flex-shrink-0 p-6 sm:p-7 text-white flex flex-col justify-between"
          style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)` }}
        >
          <Icon className="absolute -bottom-7 -right-6 w-44 h-44 text-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" strokeWidth={1.1} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/25 backdrop-blur flex items-center justify-center shadow-inner">
                <Icon className="w-8 h-8 text-white" />
              </div>
              {c.badge && <span className="rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wide px-2 py-1">{t(c.badge)}</span>}
            </div>
            <h3 className="text-2xl font-extrabold leading-tight">{c.name}</h3>
            <p className="text-white/85 text-sm mt-1 font-semibold">{c.count} {t('products')}</p>
            {c.subs.length > 0 && (
              <p className="text-white/70 text-xs mt-3 leading-relaxed line-clamp-2">{c.subs.join(' · ')}</p>
            )}
          </div>
          <span className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold w-fit group-hover:gap-3 transition-all shadow-sm" style={{ color: c.accent }}>
            {t('Shop')} {c.name} <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        {/* Auto-scrolling product rail (marquee) — pauses on hover */}
        <div className="relative flex-1 min-w-0 flex items-center bg-gray-50/50 py-4 overflow-hidden">
          <div
            className="flex gap-4 px-4 w-max animate-marquee"
            style={{ animationDuration: `${Math.max(20, c.products.length * 4)}s` }}
          >
            {[...c.products, ...c.products].map((p, i) => (
              <Link
                key={`${p.slug}-${i}`}
                href={`/product/${p.slug}`}
                className="group/tile flex-shrink-0 w-[172px] rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:border-[#0B1F4D]/25 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200"
              >
                <div className="aspect-square bg-gradient-to-b from-gray-50/60 to-white flex items-center justify-center overflow-hidden">
                  {p.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-contain p-3.5 group-hover/tile:scale-110 transition-transform duration-300" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-200" />
                  )}
                </div>
                <div className="px-3 pb-3 pt-2 border-t border-gray-50">
                  <p className="text-xs font-medium text-gray-600 leading-snug line-clamp-2 h-[32px]">{p.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-base font-extrabold text-[#0B1F4D]">{p.priceCents > 0 ? price(p.priceCents, p.currency) : <span className="text-sm text-violet-700">{t("On request")}</span>}</p>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm group-hover/tile:scale-110 transition-transform" style={{ background: c.accent }}>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-gray-50/90 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-gray-50/90 to-transparent" />
        </div>
      </div>

      {/* Footer — category name + view all */}
      <Link
        href={target}
        className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3 border-t border-gray-100 bg-white hover:bg-gray-50/70 transition-colors"
      >
        <span className="inline-flex items-center gap-2 font-extrabold text-sm" style={{ color: c.accent }}>
          <span className="w-2 h-2 rounded-full" style={{ background: c.accent }} />
          {c.name}
        </span>
        <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0B1F4D]">
          {t('View all')} {c.count} {t('products')} <ArrowRight className="w-4 h-4" />
        </span>
      </Link>
    </div>
  )
}

// Mall-style homepage: each product family is one banner with a sliding rail of
// varied representative products (one per sub-category, so it's not all phones).
export function CategoryMall({ categories }: { categories: MallCat[] }) {
  if (!categories.length) return null
  return (
    <div className="space-y-5">
      {categories.map((c) => <Row key={c.slug} c={c} />)}
    </div>
  )
}
