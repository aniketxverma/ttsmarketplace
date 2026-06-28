import Link from 'next/link'
import { Globe, Lock, ArrowRight, Handshake, MapPin, TrendingUp, Users, Network, Boxes } from 'lucide-react'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'

/**
 * Private strategic teaser for manufacturers shown on the Factories page. It only
 * creates interest + drives a contact request — the program mechanics are
 * deliberately NOT explained publicly (presented only in a private meeting).
 */
export async function DistributionNetworkSection() {
  const tt = await localizeUI([
    'Private · By invitation only',
    'TTAIEMA Official Distribution Network',
    'Build and Manage Your Global Sales Network',
    'TTAIEMA offers manufacturers and brand owners an exclusive opportunity to strengthen and expand their international distribution network through one intelligent business platform.',
    'Build stronger relationships with your distributors',
    'Expand into new countries and markets',
    'Increase international brand visibility',
    'Support existing distributors and business partners',
    'Connect buyers with their nearest official distributor',
    'Develop and manage a stronger global sales network',
    'A private program',
    'The TTAIEMA Official Distribution Network is available by invitation only. To protect the uniqueness of this business model, the complete system is presented only during a private business meeting — never explained publicly.',
    'Request a Private Presentation',
    'Contact TTAIEMA',
    'We will explain how the program works and how it can help you build and manage your international distribution network.',
  ], getLocale())

  const benefits = [
    { Icon: Handshake, text: tt('Build stronger relationships with your distributors') },
    { Icon: MapPin, text: tt('Expand into new countries and markets') },
    { Icon: TrendingUp, text: tt('Increase international brand visibility') },
    { Icon: Users, text: tt('Support existing distributors and business partners') },
    { Icon: Boxes, text: tt('Connect buyers with their nearest official distributor') },
    { Icon: Network, text: tt('Develop and manage a stronger global sales network') },
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
      <div className="relative overflow-hidden rounded-3xl border border-[#F5A623]/30 bg-gradient-to-br from-[#0B1F4D] via-[#0d2456] to-[#081530] shadow-xl">
        {/* soft gold glow + globe watermark */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#F5A623]/10 blur-3xl" />
        <Globe className="pointer-events-none absolute -bottom-16 -right-12 w-72 h-72 text-white/[0.04]" strokeWidth={0.8} />

        <div className="relative p-7 sm:p-10">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F5A623]/40 bg-[#F5A623]/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#F5A623]">
            <Lock className="w-3.5 h-3.5" /> {tt('Private · By invitation only')}
          </span>

          {/* Title + subtitle */}
          <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
            🌍 {tt('TTAIEMA Official Distribution Network')}
          </h2>
          <p className="mt-2 text-lg sm:text-xl font-bold text-[#F5A623]">
            {tt('Build and Manage Your Global Sales Network')}
          </p>
          <p className="mt-3 max-w-3xl text-sm sm:text-[15px] leading-relaxed text-blue-100/80">
            {tt('TTAIEMA offers manufacturers and brand owners an exclusive opportunity to strengthen and expand their international distribution network through one intelligent business platform.')}
          </p>

          {/* Benefits */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 max-w-4xl">
            {benefits.map((b) => (
              <div key={b.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                  <b.Icon className="w-4 h-4 text-[#F5A623]" />
                </span>
                <p className="text-sm text-blue-50/90 font-medium leading-snug">{b.text}</p>
              </div>
            ))}
          </div>

          {/* Private program note */}
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#F5A623] mb-1.5">{tt('A private program')}</p>
            <p className="text-sm text-blue-100/75 leading-relaxed">
              {tt('The TTAIEMA Official Distribution Network is available by invitation only. To protect the uniqueness of this business model, the complete system is presented only during a private business meeting — never explained publicly.')}
            </p>
          </div>

          {/* CTA */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <Link href="/contact?topic=distribution-network"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3.5 text-sm font-extrabold text-[#0B1F4D] hover:bg-[#fbb93a] transition-colors shadow-lg">
              {tt('Request a Private Presentation')} <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-blue-100/60 max-w-sm leading-relaxed">
              {tt('We will explain how the program works and how it can help you build and manage your international distribution network.')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
