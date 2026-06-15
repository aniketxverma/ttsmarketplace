'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Smartphone, UtensilsCrossed, SprayCan, Car, Package, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

export type MallProduct = { slug: string; name: string; img: string; priceCents: number; currency: string }
export type MallCat = {
  name: string
  slug: string
  accent: string
  icon: string
  count: number
  subs: string[]
  products: MallProduct[]
}

const ICONS: Record<string, typeof Package> = {
  smartphone: Smartphone, food: UtensilsCrossed, cleaning: SprayCan, car: Car,
}

function price(cents: number, currency: string) {
  try { return new Intl.NumberFormat('en-EU', { style: 'currency', currency, maximumFractionDigits: 2 }).format(cents / 100) }
  catch { return `€${(cents / 100).toFixed(2)}` }
}

function Row({ c }: { c: MallCat }) {
  const Icon = ICONS[c.icon] ?? Package
  const ref = useRef<HTMLDivElement>(null)
  const slide = (dir: number) => ref.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="flex flex-col lg:flex-row">
        {/* Hero panel — clickable into the category */}
        <Link
          href={`/marketplace?category=${c.slug}`}
          className="group relative overflow-hidden lg:w-[320px] flex-shrink-0 p-6 sm:p-7 text-white flex flex-col justify-between"
          style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)` }}
        >
          <Icon className="absolute -bottom-7 -right-6 w-44 h-44 text-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" strokeWidth={1.1} />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/25 backdrop-blur flex items-center justify-center mb-4 shadow-inner">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-extrabold leading-tight">{c.name}</h3>
            <p className="text-white/85 text-sm mt-1 font-semibold">{c.count} products</p>
            {c.subs.length > 0 && (
              <p className="text-white/70 text-xs mt-3 leading-relaxed line-clamp-2">{c.subs.join(' · ')}</p>
            )}
          </div>
          <span className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold w-fit group-hover:gap-3 transition-all shadow-sm" style={{ color: c.accent }}>
            Shop {c.name} <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        {/* Sliding product rail */}
        <div className="relative flex-1 min-w-0 bg-gray-50/50">
          {c.products.length > 4 && (
            <>
              <button
                type="button" aria-label="Previous" onClick={() => slide(-1)}
                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 items-center justify-center text-gray-600 hover:text-[#0B1F4D] hover:scale-105 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button" aria-label="Next" onClick={() => slide(1)}
                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 items-center justify-center text-gray-600 hover:text-[#0B1F4D] hover:scale-105 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <div
            ref={ref}
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory p-3 sm:px-12"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {c.products.map((p, i) => (
              <Link
                key={`${p.slug}-${i}`}
                href={`/product/${p.slug}`}
                className="group/tile snap-start flex-shrink-0 w-[140px] rounded-2xl bg-white border border-gray-100 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all"
              >
                <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
                  {p.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-contain p-2 group-hover/tile:scale-105 transition-transform duration-300" />
                  ) : (
                    <Package className="w-7 h-7 text-gray-200" />
                  )}
                </div>
                <div className="px-2.5 pb-2.5 pt-1">
                  <p className="text-[11px] font-medium text-gray-600 leading-tight line-clamp-2 h-[28px]">{p.name}</p>
                  <p className="text-sm font-extrabold text-[#0B1F4D] mt-1">{price(p.priceCents, p.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
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
