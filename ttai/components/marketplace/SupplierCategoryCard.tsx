import Link from 'next/link'
import { FileSpreadsheet, Package, ArrowRight, Boxes } from 'lucide-react'

export type CatalogueCard = {
  supplierName: string
  categoryName: string
  categoryImage: string | null
  accent: string
  featured: { img: string; name: string; slug: string }[]
  brands: string[]
  count: number
  hasExcel: boolean
  href: string
}

/**
 * Professional supplier × category card for the Marketplace — category banner,
 * 5–6 REAL featured products, main brands, total count and a "Check Full Excel
 * Catalogue" CTA. Avoids uploading thousands of photos; clicking enters the
 * supplier page with the full catalogue.
 */
export function SupplierCategoryCard({ card }: { card: CatalogueCard }) {
  const feat = card.featured.slice(0, 6)
  return (
    <Link href={card.href} className="group rounded-2xl bg-white border border-gray-200 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all">
      {/* Category banner */}
      <div className="relative h-24 overflow-hidden" style={{ background: card.accent }}>
        {card.categoryImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={card.categoryImage} alt={card.categoryName} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        <div className="absolute bottom-2.5 left-3.5 right-3 text-white">
          <p className="text-[11px] font-semibold text-white/80 truncate">{card.supplierName}</p>
          <p className="font-extrabold text-base leading-tight drop-shadow">{card.categoryName}</p>
        </div>
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        {/* Featured real products */}
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => {
            const f = feat[i]
            return (
              <div key={i} className="aspect-square rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center" title={f?.name}>
                {f?.img
                  ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={f.img} alt={f.name} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" />)
                  : <Package className="w-3.5 h-3.5 text-gray-200" />}
              </div>
            )
          })}
        </div>

        {/* Main brands */}
        {card.brands.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {card.brands.slice(0, 5).map((b) => (
              <span key={b} className="rounded bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5">{b}</span>
            ))}
          </div>
        )}

        {/* Count + Excel CTA */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#0B1F4D]"><Boxes className="w-4 h-4 text-gray-400" />{card.count} Products</span>
          {card.hasExcel
            ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600"><FileSpreadsheet className="w-3.5 h-3.5" /> Full Excel</span>
            : <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B1F4D] group-hover:gap-1.5 transition-all">View <ArrowRight className="w-3 h-3" /></span>}
        </div>
      </div>
    </Link>
  )
}
