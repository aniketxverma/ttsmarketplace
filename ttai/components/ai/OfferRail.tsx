'use client'

import Link from 'next/link'

export type RailOffer = {
  id: string; name: string; slug: string; price: string
  img: string | null; supplier: string; flag: string; fresh: boolean
}

/** Auto-scrolling marquee of "Today's Best Offers" — duplicated track for a
 *  seamless loop, pauses on hover. Variety comes from the server (round-robin
 *  across suppliers) so the rail mixes food, electronics, audio, etc. */
export function OfferRail({ offers }: { offers: RailOffer[] }) {
  if (!offers.length) return null
  const track = [...offers, ...offers]
  // Slow it down for longer lists so it stays readable.
  const duration = Math.max(28, offers.length * 4.5)

  return (
    <div className="group relative overflow-hidden">
      {/* edge fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent z-10" />
      <div className="flex gap-3 w-max animate-marquee group-hover:[animation-play-state:paused]" style={{ animationDuration: `${duration}s` }}>
        {track.map((p, i) => (
          <Link
            key={`${p.id}-${i}`}
            href={`/product/${p.slug ?? p.id}`}
            className="group/card flex-shrink-0 w-[168px] rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all bg-white"
          >
            <div className="relative aspect-square bg-white flex items-center justify-center overflow-hidden">
              {p.img ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={p.img} alt={p.name} className="w-full h-full object-contain p-2 group-hover/card:scale-105 transition-transform duration-300" />
              ) : (
                <svg className="w-7 h-7 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              )}
              {p.fresh && <span className="absolute top-1.5 left-1.5 rounded bg-green-500 text-white text-[9px] font-extrabold px-1.5 py-0.5">NEW</span>}
            </div>
            <div className="p-2.5 border-t border-gray-50">
              <p className="text-[11px] font-medium text-gray-600 line-clamp-2 h-[28px] leading-tight">{p.name}</p>
              <p className="text-sm font-extrabold text-[#0B1F4D] mt-1">{p.price}</p>
              <p className="text-[10px] text-gray-400 truncate">{p.flag} {p.supplier}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
