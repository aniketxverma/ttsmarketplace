import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { Star, Store, ArrowRight } from 'lucide-react'

export type Storefront = {
  id: string
  name: string
  tagline: string | null
  href: string
  premium: boolean
  tier: string | null
  thumbs: string[]
}

// A single shop rendered as a real mall storefront: an awning sign, a glass
// shop-window showing real products, and a door (Enter). Premium shops get a
// gold awning + featured badge (they pay for the best mall locations).
function StorefrontCard({ s }: { s: Storefront }) {
  const accent = s.premium ? '#F5A623' : '#0B1F4D'
  return (
    <div className="group relative flex flex-col">
      {s.premium && (
        <span className="absolute -top-2.5 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[10px] font-extrabold px-2 py-0.5 shadow-md">
          ★ Premium
        </span>
      )}
      {/* Awning / shop sign */}
      <div className="relative overflow-hidden rounded-t-2xl px-3 py-2.5 text-center shadow-sm" style={{ background: accent }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 9px, transparent 9px 18px)' }} />
        <p className={`relative font-extrabold text-sm truncate ${s.premium ? 'text-[#0B1F4D]' : 'text-white'}`}>{s.name}</p>
      </div>
      {/* Shop window */}
      <div className="relative bg-gradient-to-b from-white to-gray-50 border-x border-gray-200 p-2 flex-1">
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => {
            const t = s.thumbs[i]
            return (
              <div key={i} className="aspect-square rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                {t ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t} alt="" loading="lazy" className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Store className="w-5 h-5 text-gray-200" />
                )}
              </div>
            )
          })}
        </div>
        {/* glass reflection */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-40" />
      </div>
      {/* Storefront base / door */}
      <div className="rounded-b-2xl bg-gray-100 border border-gray-200 border-t-0 px-3 py-2.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
          <Star className="w-3.5 h-3.5 fill-amber-400" />{s.tier === 'GOLD' ? 'Gold' : 'Verified'}
        </span>
        <Link href={s.href} className="inline-flex items-center gap-1 rounded-lg bg-[#0B1F4D] hover:bg-[#162d6e] text-white text-xs font-bold px-3 py-1.5 transition-colors group-hover:gap-1.5">
          Enter <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

export async function MallCorridor({ storefronts, locationLabel }: { storefronts: Storefront[]; locationLabel: string }) {
  
  const tt = await localizeUI(["No stores open in this area yet.", "Walk the Mall —", "storefronts"], getLocale())
  if (!storefronts.length) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-12 text-center text-gray-400">
        <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{tt("No stores open in this area yet.")}</p>
      </div>
    )
  }
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      {/* Mall level header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-[#0B1F4D] to-[#1a3a7a]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5A623]">Level 1 · Shops &amp; Food Court</p>
          <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight">{tt("Walk the Mall —")} {locationLabel}</h2>
        </div>
        <span className="text-[11px] font-bold text-white/70">{storefronts.length} {tt("storefronts")}</span>
      </div>
      {/* Corridor: storefronts line both sides of a walkway */}
      <div className="relative bg-[#efe9df] px-3 sm:px-6 py-6"
        style={{ backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.04), transparent 40%), repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 56px)' }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {storefronts.map((s) => <StorefrontCard key={s.id} s={s} />)}
        </div>
        {/* polished walkway floor */}
        <div className="mt-6 h-3 rounded-full bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      </div>
    </div>
  )
}
