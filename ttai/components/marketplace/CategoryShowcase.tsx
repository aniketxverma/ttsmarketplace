import Link from 'next/link'
import { Smartphone, UtensilsCrossed, SprayCan, Car, Package, ArrowRight } from 'lucide-react'

export type ShowcaseCat = {
  name: string
  slug: string
  accent: string
  icon: string
  count: number
  subs: string
  thumbs: string[]
}

const ICONS: Record<string, typeof Package> = {
  smartphone: Smartphone,
  food: UtensilsCrossed,
  cleaning: SprayCan,
  car: Car,
}

// Homepage "shop by category" directory — big classified blocks (mockup style):
// a coloured panel with the category + a row of product thumbnails + View All.
export function CategoryShowcase({ cats }: { cats: ShowcaseCat[] }) {
  if (!cats.length) return null
  return (
    <div className="mb-10">
      <h2 className="text-sm font-extrabold text-[#0B1F4D] uppercase tracking-wide mb-4">Shop by category</h2>
      <div className="space-y-4">
        {cats.map((c) => {
          const Icon = ICONS[c.icon] ?? Package
          return (
            <div key={c.slug} className="flex flex-col sm:flex-row rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
              {/* Coloured category panel */}
              <div className="sm:w-72 flex-shrink-0 p-5 flex flex-col text-white" style={{ background: c.accent }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold leading-tight">{c.name}</h3>
                    <p className="text-xs text-white/80">{c.count} products</p>
                  </div>
                </div>
                {c.subs ? <p className="text-xs text-white/75 mt-3 line-clamp-2 leading-relaxed">{c.subs}</p> : null}
                <Link
                  href={`/marketplace?category=${c.slug}`}
                  className="mt-4 sm:mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold hover:gap-2.5 transition-all"
                  style={{ color: c.accent }}
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {/* Product thumbnails */}
              <div className="flex-1 grid grid-cols-4 gap-2 p-3 bg-gray-50/60">
                {Array.from({ length: 4 }).map((_, i) => {
                  const t = c.thumbs[i]
                  return (
                    <Link
                      key={i}
                      href={`/marketplace?category=${c.slug}`}
                      className="aspect-square rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden hover:border-gray-300 transition-colors"
                    >
                      {t ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t} alt="" className="w-full h-full object-contain p-2" loading="lazy" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-200" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
