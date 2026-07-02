'use client'

import { useMemo } from 'react'
import { useT } from '@/lib/i18n/client'
import Link from 'next/link'
import { ArrowRight, Package, Layers, Boxes } from 'lucide-react'

type P = {
  id: string; name: string; slug?: string | null; price_cents: number | null; currency_code?: string | null
  thumb: string | null; brand_name?: string | null; category_name?: string | null
  root?: { id: string; name: string } | null; family?: { id: string; name: string } | null
}

const money = (c?: number | null, cur = 'EUR') =>
  c == null ? '' : new Intl.NumberFormat('en-EU', { style: 'currency', currency: cur || 'EUR' }).format(c / 100)

/**
 * Professional catalogue overview for a supplier page — company doesn't upload
 * thousands of products; instead we surface main brands, main categories and
 * 4–5 featured products per category, with a "View Full Excel Catalogue" button.
 */
export function CatalogueOverview({ products, perCategory = 5 }: { products: P[]; hasExcel?: boolean; perCategory?: number }) {
  const t = useT()
  const { brands, groups, familyCount } = useMemo(() => {
    const brandSet = new Set<string>()
    const byRoot = new Map<string, { id: string; name: string; items: P[] }>()
    const families = new Set<string>()
    for (const p of products) {
      if (p.brand_name) brandSet.add(p.brand_name)
      if (p.family?.id) families.add(p.family.id)
      const r = p.root ?? { id: 'other', name: p.category_name ?? 'Other' }
      if (!byRoot.has(r.id)) byRoot.set(r.id, { id: r.id, name: r.name, items: [] })
      byRoot.get(r.id)!.items.push(p)
    }
    // image-first within each category
    const groups = Array.from(byRoot.values())
    for (const g of groups) g.items.sort((a, b) => (b.thumb ? 1 : 0) - (a.thumb ? 1 : 0))
    groups.sort((a, b) => b.items.length - a.items.length)
    return { brands: Array.from(brandSet).slice(0, 14), groups, familyCount: families.size }
  }, [products])

  if (!products.length) return null

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6 mb-7" data-reveal>
      {/* Header + stats + View Full Excel */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-lg font-extrabold text-[#0B1F4D]">{t("Catalogue overview")}</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{groups.length} {t("categories")}</span>
            <span className="inline-flex items-center gap-1"><Boxes className="w-3.5 h-3.5" />{familyCount || groups.length} {t("families")}</span>
            <span className="inline-flex items-center gap-1"><Package className="w-3.5 h-3.5" />{products.length}+ products</span>
          </div>
        </div>
      </div>

      {/* Main brands */}
      {brands.length > 0 && (
        <div className="py-4 border-b border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t("Main brands")}</p>
          <div className="flex flex-wrap gap-1.5">
            {brands.map((b) => (
              <span key={b} className="rounded-full bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1">{b}</span>
            ))}
          </div>
        </div>
      )}

      {/* Categories → featured products */}
      <div className="divide-y divide-gray-100">
        {groups.map((g) => (
          <div key={g.id} className="py-4">
            <div className="flex items-center justify-between mb-2.5">
              <p className="font-extrabold text-gray-900 text-sm">{g.name} <span className="text-gray-400 font-medium">· {g.items.length}</span></p>
              <a href="#sec-products" className="text-xs font-bold text-[#0B1F4D] hover:underline inline-flex items-center gap-1">{t("View all")} <ArrowRight className="w-3 h-3" /></a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {g.items.slice(0, perCategory).map((p) => (
                <Link key={p.id} href={`/product/${p.slug ?? p.id}`} className="group rounded-xl border border-gray-100 overflow-hidden bg-white hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="relative aspect-square bg-gray-50 flex items-center justify-center">
                    {p.thumb
                      ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={p.thumb} alt={p.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />)
                      : <Package className="w-6 h-6 text-gray-200" />}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-medium text-gray-600 line-clamp-2 leading-tight h-[28px]">{p.name}</p>
                    {p.price_cents != null && <p className="text-[12px] font-extrabold text-[#0B1F4D] mt-0.5">{money(p.price_cents, p.currency_code ?? 'EUR')}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
