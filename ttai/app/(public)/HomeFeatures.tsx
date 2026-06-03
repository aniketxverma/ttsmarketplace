'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, ShieldCheck, Store, Radio } from 'lucide-react'

/* Scroll-triggered reveal wrapper */
function Reveal({
  children, from = 'up', delay = 0, className = '',
}: {
  children: React.ReactNode; from?: 'up' | 'left' | 'right'; delay?: number; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect() } },
      { threshold: 0.15, rootMargin: '-40px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const hidden =
    from === 'left'  ? 'opacity-0 -translate-x-10' :
    from === 'right' ? 'opacity-0 translate-x-10' :
    'opacity-0 translate-y-10'
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${shown ? 'opacity-100 translate-x-0 translate-y-0' : hidden} ${className}`}>
      {children}
    </div>
  )
}

const FEATURES = [
  {
    Icon: ShieldCheck,
    badge: 'Verified Network',
    title: 'Source from verified suppliers',
    desc: 'Every supplier on TTAI EMA is ID-verified and rated. Browse full brand profiles with products, certifications, locations and reviews — no guesswork, no fake listings.',
    points: ['ID-verified & tiered (Gold / Silver / Bronze)', 'Complete brand storefronts', 'Real certifications & customer reviews'],
    img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=900&q=80',
    href: '/suppliers', cta: 'Browse Suppliers',
    accent: '#0B1F4D', stat: { value: '200+', label: 'Verified suppliers' },
  },
  {
    Icon: Store,
    badge: 'Two Ways to Buy',
    title: 'Wholesale or retail — same brand',
    desc: 'Each supplier runs two shops from one storefront. Order in bulk by pallet or truck in the B2B shop, or buy single pieces in the Online shop. You choose how you trade.',
    points: ['B2B shop — box, pallet & full-truck pricing', 'Online shop — buy by piece, no minimum', 'One verified brand, both channels'],
    img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80',
    href: '/marketplace', cta: 'Explore Marketplace',
    accent: '#7c3aed', stat: { value: '5K+', label: 'Products listed' },
  },
  {
    Icon: Radio,
    badge: 'Stay Connected',
    title: 'Follow brands on Canal',
    desc: 'Subscribe to a supplier’s Canal and get their updates, exclusive offers and new product drops in a clean WhatsApp-style inbox — all your followed brands in one place.',
    points: ['WhatsApp-style update feed', 'Exclusive offers & launch alerts', 'All your canales in one inbox'],
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80',
    href: '/channels', cta: 'Discover Canales',
    accent: '#16a34a', stat: { value: 'Live', label: 'Real-time updates' },
  },
]

export function HomeFeatures() {
  return (
    <section className="py-24 px-4 bg-white overflow-hidden">
      <div className="container mx-auto max-w-6xl">

        {/* Heading */}
        <Reveal>
          <div className="text-center mb-16 sm:mb-20">
            <p className="text-[#F5A623] font-bold text-sm uppercase tracking-widest mb-3">How TTAI works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B1F4D] leading-tight">
              Trade smarter, in three moves
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto text-base leading-relaxed">
              A modern B2B marketplace built for how trade actually happens — discover, choose your channel, and stay connected.
            </p>
            <div className="mt-5 mx-auto w-16 h-1 bg-[#F5A623] rounded-full" />
          </div>
        </Reveal>

        {/* Alternating feature rows */}
        <div className="space-y-24 sm:space-y-32">
          {FEATURES.map((f, i) => {
            const reversed = i % 2 === 1
            return (
              <div key={f.title} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

                {/* Graphic */}
                <Reveal from={reversed ? 'right' : 'left'} className={reversed ? 'lg:order-2' : ''}>
                  <div className="relative">
                    {/* Decorative blob */}
                    <div className="absolute -inset-4 rounded-[2rem] -z-10 opacity-10 blur-2xl"
                      style={{ background: f.accent }} />
                    <div className="relative rounded-[1.75rem] overflow-hidden shadow-2xl aspect-[4/3] bg-gray-100">
                      <Image src={f.img} alt={f.title} fill className="object-cover hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 1024px) 100vw, 50vw" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#0B1F4D]/20 to-transparent" />
                    </div>
                    {/* Floating stat card */}
                    <div className={`absolute -bottom-5 ${reversed ? '-right-2 sm:-right-5' : '-left-2 sm:-left-5'} bg-white rounded-2xl shadow-xl border border-gray-100 px-5 py-3.5 flex items-center gap-3`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${f.accent}15` }}>
                        <f.Icon className="w-5 h-5" style={{ color: f.accent }} />
                      </div>
                      <div>
                        <p className="text-xl font-extrabold text-[#0B1F4D] leading-none">{f.stat.value}</p>
                        <p className="text-[11px] text-gray-400 font-semibold mt-0.5">{f.stat.label}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Copy */}
                <Reveal from={reversed ? 'left' : 'right'} delay={120} className={reversed ? 'lg:order-1' : ''}>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold mb-4"
                      style={{ background: `${f.accent}12`, color: f.accent }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.accent }} />
                      {f.badge}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D] leading-tight mb-3">{f.title}</h3>
                    <p className="text-gray-500 text-[15px] leading-relaxed mb-5">{f.desc}</p>
                    <ul className="space-y-2.5 mb-7">
                      {f.points.map(p => (
                        <li key={p} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: f.accent }} />
                          <span className="text-sm text-gray-600 font-medium">{p}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={f.href}
                      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                      style={{ background: f.accent }}>
                      {f.cta}<ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Reveal>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
