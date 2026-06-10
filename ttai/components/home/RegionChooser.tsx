import Link from 'next/link'
import { REGIONS } from '@/lib/regions-data'
import { ArrowRight, Globe2, MapPin } from 'lucide-react'

/**
 * Homepage "Shop by region" — pick a region, which opens its dedicated page
 * (/regions/[id]) to choose a country. Server component (CSS-only animations).
 */
export function RegionChooser() {
  return (
    <section className="relative overflow-hidden bg-[#070f24] py-20">
      {/* ── Animated ambient background ─────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {/* drifting aurora orbs */}
        <div className="animate-aurora absolute -top-24 -left-16 h-[28rem] w-[28rem] rounded-full bg-[#F5A623]/20 blur-[120px]" />
        <div className="animate-aurora-2 absolute top-10 right-0 h-[26rem] w-[26rem] rounded-full bg-[#2563eb]/25 blur-[120px]" />
        <div className="animate-aurora absolute -bottom-28 left-1/3 h-[30rem] w-[30rem] rounded-full bg-[#0ea5e9]/15 blur-[130px]" />
        {/* scrolling dotted grid */}
        <div className="bg-region-grid absolute inset-0 opacity-60" />
        {/* twinkling particles */}
        {[
          { l: '12%', t: '24%', d: '0s' }, { l: '28%', t: '70%', d: '1.1s' },
          { l: '47%', t: '18%', d: '0.5s' }, { l: '63%', t: '60%', d: '1.8s' },
          { l: '78%', t: '30%', d: '0.9s' }, { l: '88%', t: '74%', d: '2.3s' },
          { l: '38%', t: '44%', d: '1.5s' }, { l: '70%', t: '12%', d: '0.3s' },
        ].map((p, i) => (
          <span key={i} className="animate-twinkle absolute h-1.5 w-1.5 rounded-full bg-white"
            style={{ left: p.l, top: p.t, animationDelay: p.d }} />
        ))}
        {/* fade edges into the page */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#070f24] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#070f24] to-transparent" />
      </div>

      <div className="container relative mx-auto max-w-6xl px-4">
        <div className="mb-11 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#F5A623] backdrop-blur">
            <Globe2 className="h-4 w-4 animate-rotate-slow" /> Global Trade Network
          </div>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            <span className="text-sheen">Shop by region</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-blue-200/70">
            Pick your market — then choose a country to explore its verified suppliers and curated collections.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REGIONS.map((r, i) => (
            <Link key={r.id} href={`/regions/${r.id}`}
              className="group animate-fade-in-up relative h-60 overflow-hidden rounded-3xl shadow-lg ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:ring-white/30"
              style={{ animationDelay: `${i * 90}ms` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.image} alt={r.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              {/* glow accent that brightens on hover */}
              <span className="absolute inset-x-0 top-0 h-1.5 transition-all duration-300 group-hover:h-2"
                style={{ backgroundColor: r.accentColor, boxShadow: `0 0 18px ${r.accentColor}` }} />
              {/* sheen sweep on hover */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-2xl font-extrabold leading-tight drop-shadow">{r.name}</p>
                <p className="mt-1 line-clamp-1 text-xs text-white/75">{r.tagline}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/75">
                    <MapPin className="h-3 w-3" /> {r.countries.length} countries
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-extrabold backdrop-blur transition-colors group-hover:bg-white group-hover:text-[#0B1F4D]">
                    Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/regions"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:border-[#F5A623]/50 hover:bg-white/10">
            See all regions &amp; countries <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
