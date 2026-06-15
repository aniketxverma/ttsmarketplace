import Link from 'next/link'
import { Smartphone, UtensilsCrossed, SprayCan, Car, Package, ArrowRight } from 'lucide-react'

export type MallCat = {
  name: string
  slug: string
  accent: string
  icon: string
  count: number
  subs: string[]
  thumbs: string[]
}

const ICONS: Record<string, typeof Package> = {
  smartphone: Smartphone, food: UtensilsCrossed, cleaning: SprayCan, car: Car,
}

// Mall-style homepage: each product family is one big banner card — a coloured
// hero panel (icon, name, sub-categories, "Shop") + a strip of representative
// products. Clicking enters that category's marketplace. No mixed product wall.
export function CategoryMall({ categories }: { categories: MallCat[] }) {
  if (!categories.length) return null
  return (
    <div className="space-y-5">
      {categories.map((c) => {
        const Icon = ICONS[c.icon] ?? Package
        return (
          <Link
            key={c.slug}
            href={`/marketplace?category=${c.slug}`}
            className="group block overflow-hidden rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-col lg:flex-row">
              {/* Hero panel */}
              <div
                className="relative overflow-hidden lg:w-[340px] flex-shrink-0 p-6 sm:p-7 text-white flex flex-col justify-between"
                style={{ background: c.accent }}
              >
                <Icon className="absolute -bottom-6 -right-5 w-40 h-40 text-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" strokeWidth={1.1} />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/25 backdrop-blur flex items-center justify-center mb-4 shadow-inner">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold leading-tight">{c.name}</h3>
                  <p className="text-white/80 text-sm mt-1">{c.count} products</p>
                  {c.subs.length > 0 && (
                    <p className="text-white/75 text-xs mt-3 leading-relaxed line-clamp-2">{c.subs.join(' · ')}</p>
                  )}
                </div>
                <span className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold w-fit group-hover:gap-3 transition-all" style={{ color: c.accent }}>
                  Shop {c.name} <ArrowRight className="w-4 h-4" />
                </span>
              </div>

              {/* Representative products */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-3 bg-gray-50/60">
                {Array.from({ length: 5 }).map((_, i) => {
                  const t = c.thumbs[i]
                  return (
                    <div key={i} className="aspect-square rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                      {t ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t} alt="" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-200" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
