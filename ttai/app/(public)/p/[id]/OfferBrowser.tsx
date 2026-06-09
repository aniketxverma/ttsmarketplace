'use client'

import { useMemo, useState } from 'react'
import { OfferList, type Offer } from './OfferList'

const SORTS = [
  { id: 'best', label: 'Best match' },
  { id: 'price', label: 'Lowest price' },
  { id: 'delivery', label: 'Fastest delivery' },
  { id: 'rating', label: 'Top rated supplier' },
] as const

const TIER_RANK: Record<string, number> = { GOLD: 0, SILVER: 1, BRONZE: 2, UNVERIFIED: 3 }

export function OfferBrowser({ offers }: { offers: Offer[] }) {
  const conditions = useMemo(
    () => Array.from(new Set(offers.map((o) => o.condition).filter(Boolean))) as string[],
    [offers],
  )
  const regions = useMemo(
    () => Array.from(new Set(offers.map((o) => o.location).filter(Boolean))) as string[],
    [offers],
  )

  const [selCond, setSelCond] = useState<string[]>([])
  const [selRegion, setSelRegion] = useState<string>('')
  const [inStock, setInStock] = useState(false)
  const [sort, setSort] = useState<(typeof SORTS)[number]['id']>('best')

  const filtered = useMemo(() => {
    let list = offers.slice() // arrives pre-sorted by "best match"
    if (selCond.length) list = list.filter((o) => o.condition && selCond.includes(o.condition))
    if (selRegion) list = list.filter((o) => o.location === selRegion)
    if (inStock) list = list.filter((o) => o.stock > 0)
    if (sort === 'price') list.sort((a, b) => a.priceCents - b.priceCents)
    else if (sort === 'delivery') list.sort((a, b) => (a.deliveryDays ?? 999) - (b.deliveryDays ?? 999))
    else if (sort === 'rating') list.sort((a, b) => (TIER_RANK[a.tier] ?? 3) - (TIER_RANK[b.tier] ?? 3))
    return list
  }, [offers, selCond, selRegion, inStock, sort])

  function toggleCond(c: string) {
    setSelCond((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))
  }

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${active ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`

  const hasFilters = conditions.length > 0 || regions.length > 1 || offers.some((o) => o.stock <= 0)

  return (
    <div className="space-y-4">
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {conditions.map((c) => (
            <button key={c} onClick={() => toggleCond(c)} className={chip(selCond.includes(c))}>{c}</button>
          ))}
          {offers.some((o) => o.stock <= 0) && (
            <button onClick={() => setInStock((v) => !v)} className={chip(inStock)}>In stock</button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {regions.length > 1 && (
              <select value={selRegion} onChange={(e) => setSelRegion(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700">
                <option value="">All locations</option>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700">
              {SORTS.map((s) => <option key={s.id} value={s.id}>Sort: {s.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No offers match your filters. <button onClick={() => { setSelCond([]); setSelRegion(''); setInStock(false) }} className="font-bold text-[#0B1F4D] hover:underline">Clear filters</button></p>
      ) : (
        <OfferList offers={filtered} />
      )}

      {(selCond.length > 0 || selRegion || inStock) && filtered.length > 0 && (
        <p className="text-xs text-gray-400">{filtered.length} of {offers.length} offers</p>
      )}
    </div>
  )
}
