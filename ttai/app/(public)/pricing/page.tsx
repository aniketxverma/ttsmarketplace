import Link from 'next/link'
import { Check, ArrowRight, Sparkles, Crown, Star, Warehouse } from 'lucide-react'
import { PRESENTED_BY_ROLE, FLAGSHIPS, GROWTH_LEVELS, WHY_UPGRADE, BROKER_SERVICES } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/server'
import { RolePlans } from '@/components/pricing/RolePlans'
import { Handshake } from 'lucide-react'

export const metadata = { title: 'Membership Plans · TTAI EMA' }

export default async function PricingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let currentTier = 'free'
  if (user) {
    const { data } = await (supabase.from('profiles') as any).select('tier').eq('id', user.id).single()
    currentTier = data?.tier ?? 'free'
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] text-white py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/80 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Matchmaking membership
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Reach the partners that grow your business
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            TTAI EMA connects you directly to your counterpart in the supply chain — suppliers,
            distributors and factories. Start free, then unlock the partners you want to reach.
            Every member is verified.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-7 text-sm text-blue-200/90">
            <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[#F5A623]" strokeWidth={3} /> Free plan, no card needed</span>
            <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[#F5A623]" strokeWidth={3} /> Verified in 48 hours</span>
            <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[#F5A623]" strokeWidth={3} /> Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* ── Role-based plan cards (Factory / Supplier / Retail) ───────────── */}
      <div className="container mx-auto max-w-5xl px-4 -mt-12 pb-4">
        <RolePlans loggedIn={!!user} currentTier={currentTier} />

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 mt-8 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-green-600" strokeWidth={3} /> No setup fee</span>
          <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-green-600" strokeWidth={3} /> Upgrade or downgrade anytime</span>
          <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-green-600" strokeWidth={3} /> Every member verified</span>
          <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-green-600" strokeWidth={3} /> Cancel anytime</span>
        </div>
        <p className="text-center text-xs text-gray-400 mt-5">
          Paid plans are activated by our team after onboarding. Prices shown are indicative — contact us to confirm your plan.
        </p>

        {/* ── One Platform. Three Growth Levels. ── */}
        <div className="mt-12 rounded-3xl bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] text-white p-8 sm:p-10">
          <div className="text-center mb-7">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">One Platform · Three Growth Levels</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold">Start Local. Grow National. Expand Worldwide.</h2>
            <p className="text-blue-200/80 text-sm mt-2">Start where you are. Grow at your own pace. Expand when you&apos;re ready.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GROWTH_LEVELS.map((g, i) => (
              <div key={g.title} className="relative rounded-2xl bg-white/[0.06] border border-white/10 p-5 text-center">
                {i < GROWTH_LEVELS.length - 1 && <ArrowRight className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F5A623] z-10" />}
                <span className="text-3xl">{g.icon}</span>
                <p className="font-extrabold text-lg mt-2">{g.title}</p>
                <p className="text-blue-200/70 text-xs mt-1 leading-relaxed">{g.sub}</p>
                <p className="text-[#F5A623] font-bold text-sm mt-3">{g.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Flagship programs: TTAI ON ─────────────────────────────────────── */}
      <div className="container mx-auto max-w-6xl px-4 pt-10">
        <div className="text-center mb-7">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">Premium programs</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">TTAI ON — fully managed growth</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-xl mx-auto">
            Hands-on programs where our team does the heavy lifting — logistics, sales and international fairs.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 pb-4 space-y-6">
        {FLAGSHIPS.map((fp) => {
          const mailto = `mailto:info@ttaiema.com?subject=${encodeURIComponent(fp.name + ' enquiry')}&body=${encodeURIComponent(`Hi TTAI EMA team,\n\nI'm interested in the ${fp.name} program. Please get in touch.\n\nCompany:\nCountry:\nPhone:\n`)}`
          return (
          <div key={fp.id} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1F4D] via-[#13306e] to-[#0a1733] text-white p-8 sm:p-10">
            <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-[#F5A623]/20 blur-3xl pointer-events-none" />

            {/* Header + price */}
            <div className="relative grid md:grid-cols-[1.5fr_1fr] gap-8 items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest mb-4">
                  <Crown className="w-3.5 h-3.5" /> Flagship program
                </div>
                <h3 className="text-3xl sm:text-4xl font-extrabold">{fp.name}</h3>
                <p className="text-[#F5A623] font-semibold text-sm mt-1">{fp.subtitle}</p>
                <p className="text-blue-200 text-base mt-3 max-w-xl">{fp.tagline}</p>
              </div>

              <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-6 md:text-right">
                <span className="inline-block rounded-full bg-[#F5A623] text-[#0B1F4D] text-[11px] font-extrabold uppercase tracking-wide px-3 py-1 mb-3">
                  {fp.valueNote}
                </span>
                <div className="flex md:justify-end items-end gap-1">
                  <span className="text-5xl font-extrabold">{fp.fee}</span>
                  <span className="text-blue-300 text-lg mb-1.5">{fp.feePeriod}</span>
                </div>
                <p className="text-blue-300/90 text-sm mt-1">{fp.feeLabel ?? 'Program fee'}{fp.feeNote ? ` · ${fp.feeNote}` : ''}</p>
                <a href={mailto}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] hover:bg-[#fbb93a] text-[#0B1F4D] px-7 py-3.5 text-sm font-extrabold transition-colors mt-5 w-full">
                  {fp.cta ?? 'Talk to our team'} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Sub-packages (e.g. Logistics €3,500 + Business Dev €5,000) */}
            {fp.packages && (
              <div className="relative grid sm:grid-cols-2 gap-4 mt-8">
                {fp.packages.map((pk) => (
                  <div key={pk.title} className="rounded-2xl bg-white/[0.05] border border-[#F5A623]/20 p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="font-extrabold text-white text-sm">{pk.title}</p>
                      <span className="rounded-full bg-[#F5A623] text-[#0B1F4D] text-[11px] font-extrabold px-2.5 py-0.5">{pk.value}</span>
                    </div>
                    <ul className="space-y-2">
                      {pk.items.map((it) => (
                        <li key={it} className="flex items-start gap-2 text-sm text-blue-100">
                          <span className="mt-0.5 w-4 h-4 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-[#F5A623]" strokeWidth={3.5} />
                          </span>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Special highlights (optional) */}
            {fp.highlights && fp.highlights.length > 0 && (
              <div className="relative grid sm:grid-cols-2 gap-4 mt-8">
                {fp.highlights.map((h, i) => (
                  <div key={h.title} className="rounded-2xl bg-white/[0.05] border border-[#F5A623]/20 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-xl bg-[#F5A623]/15 flex items-center justify-center flex-shrink-0">
                        {i === 0 ? <Warehouse className="w-4 h-4 text-[#F5A623]" /> : <Star className="w-4 h-4 text-[#F5A623]" />}
                      </span>
                      <p className="font-extrabold text-white text-sm">{h.title}</p>
                    </div>
                    <p className="text-blue-100/90 text-sm leading-relaxed">{h.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Services / fairs / premium benefits */}
            {(fp.included || fp.fairs || fp.support) && (
              <div className="relative grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 mt-9 pt-8 border-t border-white/10">
                {fp.included && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-300/80 mb-3">{fp.includedLabel ?? 'Included services'}</p>
                    <ul className="space-y-2.5">
                      {fp.included.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-blue-100">
                          <span className="mt-0.5 w-4 h-4 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-[#F5A623]" strokeWidth={3.5} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {fp.fairs && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-300/80 mb-3">International events & fairs</p>
                    <ul className="space-y-2.5">
                      {fp.fairs.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-blue-100">
                          <span className="mt-0.5 w-4 h-4 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                            <Star className="w-2.5 h-2.5 text-[#F5A623]" strokeWidth={3} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {fp.support && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-300/80 mb-3">{fp.supportLabel ?? 'Business support'}</p>
                    <ul className="space-y-2.5">
                      {fp.support.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-blue-100">
                          <span className="mt-0.5 w-4 h-4 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-[#F5A623]" strokeWidth={3.5} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Business benefits */}
            {fp.benefits && (
              <div className="relative mt-8 pt-8 border-t border-white/10">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-300/80 mb-3">{fp.benefitsLabel ?? 'Benefits'}</p>
                <div className="flex flex-wrap gap-2">
                  {fp.benefits.map((b) => (
                    <span key={b} className="rounded-full bg-white/[0.06] border border-white/10 text-blue-100 text-xs font-semibold px-3 py-1.5">{b}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Who it's for */}
            {fp.who && (
              <div className="relative mt-7">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-300/80 mb-3">Who it’s for</p>
                <div className="flex flex-wrap gap-2">
                  {fp.who.map((w) => (
                    <span key={w} className="rounded-full bg-[#F5A623]/10 border border-[#F5A623]/25 text-[#F5A623] text-xs font-semibold px-3 py-1.5">{w}</span>
                  ))}
                </div>
              </div>
            )}

            <p className="relative text-blue-300/60 text-xs mt-8 max-w-3xl">{fp.disclaimer}</p>
          </div>
          )
        })}
      </div>

      {/* ── Why upgrade ───────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-5xl px-4 pt-14">
        <div className="text-center mb-8">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">Why upgrade</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">We become part of your business team</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-xl mx-auto">TTAIEMA is not only a marketplace — at Premium, we actively help you grow internationally.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {WHY_UPGRADE.map((w) => (
            <div key={w.name} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: w.accent }} />
                <h3 className="font-extrabold text-[#0B1F4D]">{w.name}</h3>
              </div>
              <ul className="space-y-2.5">
                {w.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: w.accent }} strokeWidth={3} />{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Brokers ───────────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-5xl px-4 pt-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1F4D] via-[#13306e] to-[#0a1733] text-white p-8 sm:p-10">
          <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-[#F5A623]/15 blur-3xl pointer-events-none" />
          <div className="relative grid md:grid-cols-[1.3fr_1fr] gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest mb-4"><Handshake className="w-3.5 h-3.5" /> Broker Network</span>
              <h2 className="text-3xl font-extrabold">Become an Official TTAIEMA Broker</h2>
              <p className="text-blue-200 mt-3 max-w-lg">Our broker network connects buyers, suppliers, factories and distributors worldwide — and earns commission on the deals they introduce.</p>
              <a href={`mailto:info@ttaiema.com?subject=${encodeURIComponent('Become a TTAIEMA Broker Partner')}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] hover:bg-[#fbb93a] text-[#0B1F4D] px-7 py-3.5 text-sm font-extrabold transition-colors mt-6">
                Become a Broker Partner <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300/80 mb-3">Broker services</p>
              <div className="flex flex-wrap gap-2">
                {BROKER_SERVICES.map((b) => (
                  <span key={b} className="rounded-full bg-white/[0.06] border border-white/10 text-blue-100 text-xs font-semibold px-3 py-1.5">{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── How presentation works by role ────────────────────────────────── */}
      <div className="bg-gray-50 border-y border-gray-100 py-16 px-4 mt-10">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">Directional matchmaking</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">What each role is presented</h2>
            <p className="text-gray-400 text-sm mt-2 max-w-xl mx-auto">
              You only ever see the part of the chain relevant to you — and your plan decides how far you reach.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRESENTED_BY_ROLE.map((r) => (
              <div key={r.role} className="rounded-2xl bg-white border border-gray-100 px-5 py-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0B1F4D]/5 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-[#0B1F4D]" />
                </div>
                <div>
                  <p className="font-extrabold text-[#0B1F4D] text-sm">{r.role}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{r.presented}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D] mb-3">Ready to find your next partner?</h2>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto">
          Register your business, get verified, and we&apos;ll present you the right side of the chain.
        </p>
        <Link href="/register"
          className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-8 py-3.5 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors shadow-lg">
          Register your business
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
