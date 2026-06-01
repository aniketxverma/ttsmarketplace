'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Country } from '@/lib/regions-data'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Open country card — Spain (free access, pulsing golden beacon)
 * ─────────────────────────────────────────────────────────────────────────── */
export function OpenCountryCard({
  country,
  regionId,
  index,
}: {
  country: Country
  regionId: string
  index: number
}) {
  return (
    <div className="relative" style={{ animationDelay: `${index * 60}ms` }}>
      {/* ── Pulsing golden ring around the card ── */}
      <span
        className="absolute -inset-[3px] rounded-[18px] border-[3px] border-[#F5A623] pointer-events-none z-10"
        style={{ animation: 'beaconRing 2s ease-in-out infinite' }}
      />
      <span
        className="absolute -inset-[3px] rounded-[18px] bg-[#F5A623]/10 pointer-events-none z-10"
        style={{ animation: 'beaconGlow 2s ease-in-out infinite' }}
      />

      {/* ── "Start here" beacon dot ── */}
      <span className="absolute -top-3 -right-3 z-20 flex">
        <span className="relative flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5A623] opacity-75" />
          <span className="relative inline-flex rounded-full h-6 w-6 bg-[#F5A623] items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
        </span>
      </span>

      <Link
        href={`/regions/${regionId}/${country.id}`}
        className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gray-100 block"
      >
        {/* Image */}
        <div className="relative h-52 sm:h-60">
          <Image
            src={country.image}
            alt={country.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          {/* Free badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#F5A623] text-[#0B1F4D] px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-lg z-10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Free Access
          </div>
        </div>

        {/* Overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl leading-none">{country.flag}</span>
                <h3 className="text-white font-extrabold text-lg leading-tight">{country.name}</h3>
              </div>
              <p className="text-white/70 text-xs leading-snug max-w-[220px]">{country.tagline}</p>
              <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-[#F5A623]">
                <span>{country.categories.length} collections</span>
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#F5A623] flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>

      {/* Keyframes injected once */}
      <style>{`
        @keyframes beaconRing {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.008); }
        }
        @keyframes beaconGlow {
          0%, 100% { opacity: 0.08; }
          50%       { opacity: 0.22; }
        }
      `}</style>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Locked country card — all other countries (gated behind register)
 * ─────────────────────────────────────────────────────────────────────────── */
export function LockedCountryCard({
  country,
  regionId,
  index,
}: {
  country: Country
  regionId: string
  index: number
}) {
  const registerHref = `/register`

  return (
    <Link
      href={registerHref}
      className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-gray-100 block"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image — desaturated */}
      <div className="relative h-52 sm:h-60">
        <Image
          src={country.image}
          alt={country.name}
          fill
          className="object-cover transition-transform duration-500 saturate-50 group-hover:saturate-75"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

        {/* Lock badge — top right */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center z-10">
          <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Overlay content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl leading-none opacity-80">{country.flag}</span>
              <h3 className="text-white/80 font-extrabold text-lg leading-tight">{country.name}</h3>
            </div>
            <p className="text-white/50 text-xs leading-snug max-w-[220px] line-clamp-1">{country.tagline}</p>
            {/* Register CTA */}
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-white/70 group-hover:text-[#F5A623] transition-colors">
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Register to unlock
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#F5A623] group-hover:border-[#F5A623] transition-all">
            <svg className="w-4 h-4 text-white/60 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Hover overlay: "Create a free account" */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#0B1F4D]/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl">
        <div className="text-center px-6">
          <div className="w-12 h-12 rounded-full bg-[#F5A623] flex items-center justify-center mx-auto mb-3 shadow-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-white font-extrabold text-base">Register Free</p>
          <p className="text-white/70 text-xs mt-1">Unlock all {country.categories.length} collections</p>
        </div>
      </div>
    </Link>
  )
}
