'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Heart, Store, MapPin, X, ShoppingBag } from 'lucide-react'

type Saved = { id: string; name: string; logo: string | null; tagline: string | null; country: string | null; brand_slug: string | null }

function readFavs(): string[] {
  try {
    const a = JSON.parse(localStorage.getItem('ttai_fav_store') || '[]') as string[]
    const b = JSON.parse(localStorage.getItem('ttai_fav_company') || '[]') as string[]
    return Array.from(new Set([...a, ...b]))
  } catch { return [] }
}

export default function SavedPage() {
  const [items, setItems] = useState<Saved[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids = readFavs()
    if (!ids.length) { setLoading(false); return }
    const sb = createClient()
    ;(sb.from('suppliers') as any)
      .select('id, legal_name, trade_name, logo_url, tagline, description, brand_slug, countries(name)')
      .in('id', ids)
      .then(({ data }: any) => {
        setItems((data ?? []).map((s: any) => ({
          id: s.id, name: s.trade_name ?? s.legal_name ?? 'Business',
          logo: s.logo_url ?? null, tagline: s.tagline ?? s.description ?? null,
          country: s.countries?.name ?? null, brand_slug: s.brand_slug ?? null,
        })))
        setLoading(false)
      })
  }, [])

  const remove = (id: string) => {
    for (const k of ['ttai_fav_store', 'ttai_fav_company']) {
      try {
        const arr = JSON.parse(localStorage.getItem(k) || '[]') as string[]
        localStorage.setItem(k, JSON.stringify(arr.filter((x) => x !== id)))
      } catch { /* ignore */ }
    }
    setItems((p) => p.filter((x) => x.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center"><Heart className="w-5 h-5 fill-rose-500 text-rose-500" /></span>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0B1F4D]">My Saved</h1>
            <p className="text-sm text-gray-400">Stores &amp; companies you saved across the marketplace, mall and industrial park.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white border border-gray-100 animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-200 p-14 text-center">
            <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-700">Nothing saved yet</p>
            <p className="text-sm text-gray-400 mt-1">Tap the ♥ on any store or company to keep it here.</p>
            <Link href="/store-center" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white text-sm font-bold px-6 py-2.5 hover:bg-[#162d6e] transition-colors"><ShoppingBag className="w-4 h-4" />Explore the Mall</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((s) => (
              <div key={s.id} className="group relative rounded-2xl bg-white border border-gray-200 p-4 hover:shadow-md transition-all">
                <button onClick={() => remove(s.id)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-50 hover:bg-rose-50 flex items-center justify-center text-gray-400 hover:text-rose-500" aria-label="Remove"><X className="w-4 h-4" /></button>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0B1F4D] flex items-center justify-center text-white font-black overflow-hidden flex-shrink-0">
                    {s.logo ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={s.logo} alt="" className="w-full h-full object-cover" />) : s.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-gray-900 text-sm truncate">{s.name}</p>
                    {s.country && <p className="flex items-center gap-1 text-xs text-gray-400"><MapPin className="w-3 h-3" />{s.country}</p>}
                  </div>
                </div>
                {s.tagline && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{s.tagline}</p>}
                <Link href={`/marketplace?supplier=${s.id}`} className="block text-center rounded-lg bg-[#0B1F4D] hover:bg-[#162d6e] text-white text-xs font-bold py-2 transition-colors"><Store className="w-3.5 h-3.5 inline mr-1" />Visit shop</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
