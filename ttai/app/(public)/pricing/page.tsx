import Link from 'next/link'
import { Check, ArrowRight, Sparkles, Crown } from 'lucide-react'
import { PLANS, PRESENTED_BY_ROLE, FLAGSHIP } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/server'
import { SubscribeButton } from './SubscribeButton'

export const metadata = { title: 'Membership Plans · TTAI EMA' }

export default async function PricingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let currentTier = 'free'
  if (user) {
    const { data } = await (supabase.from('profiles') as any).select('tier').eq('id', user.id).single()
    currentTier = data?.tier ?? 'free'
  }
  const hasPlan = currentTier !== 'free'

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

      {/* ── Plan cards ────────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-6xl px-4 -mt-12 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((p) => (
            <div key={p.tier}
              className={`relative rounded-3xl bg-white p-6 flex flex-col border transition-all duration-300 ${
                p.highlight
                  ? 'border-transparent shadow-2xl ring-2 ring-[#7c3aed] lg:-translate-y-2'
                  : 'border-gray-100 shadow-lg hover:shadow-xl'
              }`}>
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7c3aed] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most popular
                </span>
              )}

              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.accent }} />
                <h3 className="text-lg font-extrabold text-[#0B1F4D]">{p.name}</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4 min-h-[40px]">{p.tagline}</p>

              <div className="flex items-end gap-1 mb-1.5">
                <span className="text-4xl font-extrabold text-[#0B1F4D]">{p.price}</span>
                {p.period && <span className="text-gray-400 text-sm mb-1.5">{p.period}</span>}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-5" style={{ color: p.accent }}>
                {p.bestFor}
              </p>

              <ul className="space-y-2.5 mb-6 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${p.accent}1a` }}>
                      <Check className="w-2.5 h-2.5" style={{ color: p.accent }} strokeWidth={3.5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {(() => {
                const btnCls = `rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                  p.highlight
                    ? 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]'
                    : p.tier === 'free'
                      ? 'border-2 border-[#0B1F4D] text-[#0B1F4D] hover:bg-[#0B1F4D] hover:text-white'
                      : 'bg-[#0B1F4D] text-white hover:bg-[#162d6e]'
                }`
                // Free plan is just registration; paid plans go through Stripe.
                if (p.tier === 'free' && !hasPlan) {
                  return (
                    <Link href={user ? '/dashboard' : '/register'} className={`inline-flex items-center justify-center gap-2 ${btnCls}`}>
                      {user ? 'Current plan' : 'Start free'}<ArrowRight className="w-4 h-4" />
                    </Link>
                  )
                }
                return (
                  <SubscribeButton
                    tier={p.tier}
                    label="Get started"
                    loggedIn={!!user}
                    isCurrent={currentTier === p.tier}
                    hasPlan={hasPlan}
                    className={btnCls}
                  />
                )
              })()}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 mt-8 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-green-600" strokeWidth={3} /> No setup fee</span>
          <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-green-600" strokeWidth={3} /> Upgrade or downgrade anytime</span>
          <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-green-600" strokeWidth={3} /> Every member verified</span>
          <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-green-600" strokeWidth={3} /> Cancel anytime</span>
        </div>
        <p className="text-center text-xs text-gray-400 mt-5">
          Paid plans are activated by our team after onboarding. Prices shown are indicative — contact us to confirm your plan.
        </p>
      </div>

      {/* ── Flagship: TTAI ON · Business Growth ────────────────────────────── */}
      <div className="container mx-auto max-w-6xl px-4 pt-8 pb-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1F4D] via-[#13306e] to-[#0a1733] text-white p-8 sm:p-10">
          <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-[#F5A623]/20 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative grid md:grid-cols-[1.5fr_1fr] gap-8 items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest mb-4">
                <Crown className="w-3.5 h-3.5" /> Flagship program
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold">{FLAGSHIP.name}</h2>
              <p className="text-[#F5A623] font-semibold text-sm mt-1">{FLAGSHIP.subtitle}</p>
              <p className="text-blue-200 text-base mt-3 max-w-xl">{FLAGSHIP.tagline}</p>
            </div>

            {/* Price box */}
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-6 md:text-right">
              <span className="inline-block rounded-full bg-[#F5A623] text-[#0B1F4D] text-[11px] font-extrabold uppercase tracking-wide px-3 py-1 mb-3">
                {FLAGSHIP.valueNote}
              </span>
              <div className="flex md:justify-end items-end gap-1">
                <span className="text-5xl font-extrabold">{FLAGSHIP.fee}</span>
                <span className="text-blue-300 text-lg mb-1.5">{FLAGSHIP.feePeriod}</span>
              </div>
              <p className="text-blue-300/90 text-sm mt-1">Annual membership fee</p>
              <a href="mailto:info@ttaiema.com?subject=TTAI%20ON%20%E2%80%93%20Business%20Growth%20enquiry&body=Hi%20TTAI%20EMA%20team%2C%0A%0AI%27m%20interested%20in%20the%20TTAI%20ON%20%E2%80%93%20Business%20Growth%20program.%20Please%20get%20in%20touch.%0A%0ACompany%3A%0ACountry%3A%0APhone%3A%0A"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] hover:bg-[#fbb93a] text-[#0B1F4D] px-7 py-3.5 text-sm font-extrabold transition-colors mt-5 w-full">
                Talk to our team <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="relative grid sm:grid-cols-2 gap-x-10 gap-y-8 mt-9 pt-8 border-t border-white/10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300/80 mb-3">Included services</p>
              <ul className="space-y-2.5">
                {FLAGSHIP.included.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-blue-100">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-[#F5A623]" strokeWidth={3.5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300/80 mb-3">Business support</p>
              <ul className="space-y-2.5">
                {FLAGSHIP.support.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-blue-100">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-[#F5A623]" strokeWidth={3.5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="relative text-blue-300/60 text-xs mt-8 max-w-3xl">{FLAGSHIP.disclaimer}</p>
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
