'use client'

import { useEffect, useRef, useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Sparkles, Tag, Package, Store, LayoutGrid } from 'lucide-react'

type Sug = {
  categories: { name: string; slug: string; isSub: boolean }[]
  brands: string[]
  products: { name: string; slug: string; brand: string | null; price: number; currency: string; img: string | null }[]
  suppliers: { id: string; name: string; logo: string | null }[]
}
const EMPTY: Sug = { categories: [], brands: [], products: [], suppliers: [] }

export function SmartSearch({ defaultValue = '' }: { defaultValue?: string }) {
  const t = useT()
  const router = useRouter()
  const [q, setQ] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sug, setSug] = useState<Sug>(EMPTY)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc); return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const term = q.trim()
    if (term.length < 1) { setSug(EMPTY); setLoading(false); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`)
        setSug(await r.json()); setOpen(true)
      } catch { setSug(EMPTY) } finally { setLoading(false) }
    }, 180)
    return () => clearTimeout(t)
  }, [q])

  const go = (href: string) => { setOpen(false); router.push(href) }
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) go(`/marketplace?q=${encodeURIComponent(q.trim())}`) }
  const money = (c: number, cur: string) => { try { return new Intl.NumberFormat('en-EU', { style: 'currency', currency: cur }).format(c / 100) } catch { return `€${(c / 100).toFixed(2)}` } }

  const has = sug.categories.length || sug.brands.length || sug.products.length || sug.suppliers.length

  return (
    <div ref={box} className="relative">
      <form onSubmit={submit}>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => q.trim() && setOpen(true)}
            placeholder={t("Search products, brands, categories or suppliers…")}
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#0B1F4D] focus:ring-2 focus:ring-[#0B1F4D]/15 shadow-sm"
          />
          <span className="absolute right-24 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 rounded-full"><Sparkles className="w-3 h-3" /> AI</span>
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[#0B1F4D] text-white px-4 py-2 text-sm font-bold hover:bg-[#162d6e] transition-colors">{t("Search")}</button>
        </div>
      </form>

      {open && q.trim() && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto">
          {loading && !has ? (
            <div className="p-6 text-center text-sm text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />{t("Searching…")}</div>
          ) : !has ? (
            <div className="p-6 text-center text-sm text-gray-400">{t("No matches. Press Enter to search anyway.")}</div>
          ) : (
            <div className="py-2">
              {sug.categories.length > 0 && (
                <Group icon={<LayoutGrid className="w-3.5 h-3.5" />} label="Categories">
                  {sug.categories.map((c) => (
                    <button key={c.slug} onClick={() => go(`/marketplace?category=${c.slug}`)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 text-left">
                      <LayoutGrid className="w-4 h-4 text-gray-400" /><span className="text-sm font-semibold text-gray-700">{c.name}</span>{c.isSub && <span className="text-[10px] text-gray-400">{t("subcategory")}</span>}
                    </button>
                  ))}
                </Group>
              )}
              {sug.brands.length > 0 && (
                <Group icon={<Tag className="w-3.5 h-3.5" />} label="Brands">
                  <div className="flex flex-wrap gap-2 px-4 py-2">
                    {sug.brands.map((b) => (
                      <button key={b} onClick={() => go(`/marketplace?brand=${encodeURIComponent(b)}`)} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-bold text-[#0B1F4D] hover:border-[#0B1F4D] hover:bg-[#0B1F4D]/5">
                        <span className="w-5 h-5 rounded bg-[#0B1F4D] text-white text-[9px] font-black flex items-center justify-center">{b.slice(0, 2).toUpperCase()}</span>{b}
                      </button>
                    ))}
                  </div>
                </Group>
              )}
              {sug.products.length > 0 && (
                <Group icon={<Package className="w-3.5 h-3.5" />} label="Products">
                  {sug.products.map((p) => (
                    <button key={p.slug} onClick={() => go(`/product/${p.slug}`)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                      <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {p.img ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={p.img} alt="" className="w-full h-full object-contain p-1" />) : <Package className="w-4 h-4 text-gray-300" />}
                      </div>
                      <span className="flex-1 min-w-0"><span className="block text-sm font-medium text-gray-700 truncate">{p.name}</span>{p.brand && <span className="block text-[11px] text-gray-400">{p.brand}</span>}</span>
                      <span className="text-sm font-extrabold text-[#0B1F4D] flex-shrink-0">{p.price > 0 ? money(p.price, p.currency) : <span className="text-violet-700 text-xs">{t("On request")}</span>}</span>
                    </button>
                  ))}
                </Group>
              )}
              {sug.suppliers.length > 0 && (
                <Group icon={<Store className="w-3.5 h-3.5" />} label="Suppliers">
                  {sug.suppliers.map((s) => (
                    <button key={s.id} onClick={() => go(`/marketplace?supplier=${s.id}`)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 text-left">
                      <Store className="w-4 h-4 text-gray-400" /><span className="text-sm font-semibold text-gray-700">{s.name}</span><span className="text-[10px] text-gray-400">· visit shop</span>
                    </button>
                  ))}
                </Group>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Group({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="flex items-center gap-1.5 px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{icon}{label}</p>
      {children}
    </div>
  )
}
