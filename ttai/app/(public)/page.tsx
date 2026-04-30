import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/* ─── SVG icon components ───────────────────────────────────────────────── */
function IconGlobe({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconShield({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
function IconPackage({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}
function IconHandshake({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconMapPin({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconChevronRight({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
function IconArrowRight({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}
function IconCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function IconPhone({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}
function IconLock({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
function IconSearch({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
function IconFactory({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}
function IconTruck({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  )
}

/* ─── Region icons (SVG, no emoji) ─────────────────────────────────────── */
function IconMiddleEast() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="#1e3a5f" />
      <path d="M16 6c0 0-6 4-6 10s6 10 6 10 6-4 6-10-6-10-6-10z" fill="#2d5986" />
      <path d="M8 16h16" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 8v16" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3" fill="#F5A623" />
    </svg>
  )
}
function IconEurope() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="#003399" />
      {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180)
        const x = 16 + 8 * Math.cos(angle)
        const y = 16 + 8 * Math.sin(angle)
        return <circle key={i} cx={x} cy={y} r="1.4" fill="#FFD700" />
      })}
    </svg>
  )
}
function IconUSA() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="#B22234" />
      {[8,11,14,17,20,23].map((y, i) => (
        <rect key={i} x="3" y={y} width="26" height="1.8" fill={i % 2 === 0 ? '#FFFFFF' : '#B22234'} rx="0.5" />
      ))}
      <rect x="3" y="8" width="12" height="9" fill="#3C3B6E" rx="0.5" />
      {[0,1,2,3].map((r) => [0,1,2].map((c) => (
        <circle key={`${r}-${c}`} cx={5.5 + c * 3.5} cy={10 + r * 2} r="0.8" fill="white" />
      )))}
    </svg>
  )
}
function IconAfrica() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="#2d6a2d" />
      <path d="M12 8c-2 1-3 3-3 5 0 2 1 3 0 5s1 4 3 5c2 1 4 1 6-1 2-2 3-5 2-8-1-3-3-5-5-6-1 0-2 0-3 0z" fill="#5a9e5a" />
      <path d="M14 10c1 2 2 5 1 8" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

/* ─── Product family icons ──────────────────────────────────────────────── */
function FoodIcon() {
  return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
}
function CleanIcon() {
  return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
}
function CareIcon() {
  return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
}
function IndustrialIcon() {
  return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function ElectronicsIcon() {
  return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
}
function RecycleIcon() {
  return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
}

/* ─── How It Works step icons ───────────────────────────────────────────── */
function StepIcons({ step }: { step: number }) {
  const icons = [
    <svg key={1} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    <svg key={2} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    <svg key={3} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    <svg key={4} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    <svg key={5} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  ]
  return icons[step - 1] ?? icons[0]
}

/* ─── Data ──────────────────────────────────────────────────────────────── */
const REGIONS = [
  { label: 'Middle East', desc: 'Dubai, Lebanon, Saudi Arabia & more', Icon: IconMiddleEast, href: '/regions/middle-east' },
  { label: 'Europe',      desc: 'Germany, France, UK, Italy & more',   Icon: IconEurope,     href: '/regions/europe' },
  { label: 'Americas',    desc: 'USA, Canada, Brazil & more',          Icon: IconUSA,        href: '/regions/americas' },
  { label: 'Africa',      desc: 'Morocco, Egypt, South Africa & more', Icon: IconAfrica,     href: '/regions/africa' },
]

const PRODUCT_FAMILIES = [
  { name: 'Food & Beverages',      desc: 'Canned food, snacks, drinks, dairy, oils and more.',          img: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=600&q=80', Icon: FoodIcon,        color: 'bg-green-500',   slug: 'agriculture-food' },
  { name: 'Cleaning & Household',  desc: 'Detergents, surface cleaners, disinfectants, and more.',      img: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80', Icon: CleanIcon,       color: 'bg-blue-500',    slug: 'health-beauty' },
  { name: 'Personal Care',         desc: 'Shampoos, soaps, creams, oral care, and more.',               img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80', Icon: CareIcon,        color: 'bg-purple-500',  slug: 'health-beauty' },
  { name: 'Industrial & Technical',desc: 'Raw materials, chemicals, lubricants, solutions.',            img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80', Icon: IndustrialIcon,  color: 'bg-orange-500',  slug: 'industrial-machinery' },
  { name: 'Electronics & Tech',    desc: 'Electronics, accessories, components and more.',              img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80', Icon: ElectronicsIcon, color: 'bg-slate-600',   slug: 'electronics-technology' },
  { name: 'Recycling & Sustainable',desc: 'Eco-friendly, recycled and sustainable solutions.',         img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80', Icon: RecycleIcon,     color: 'bg-emerald-600', slug: 'home-garden' },
]

const HOW_IT_WORKS = [
  { step: 1, title: 'Choose a Category',   desc: 'Browse product families to find what you need.' },
  { step: 2, title: 'Select a Region',     desc: 'Filter by country, region or continent.' },
  { step: 3, title: 'Discover Factories',  desc: 'View verified factories with full profiles.' },
  { step: 4, title: 'Review Products',     desc: 'Explore products, specs and pricing.' },
  { step: 5, title: 'Connect & Trade',     desc: 'Place orders and start trading securely.' },
]

const STATS = [
  { value: '50+',  label: 'Countries' },
  { value: '200+', label: 'Verified Suppliers' },
  { value: '5K+',  label: 'Products Listed' },
  { value: '99%',  label: 'Satisfaction Rate' },
]

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default async function HomePage({ searchParams }: { searchParams: { code?: string } }) {
  if (searchParams.code) redirect(`/auth/callback?code=${searchParams.code}`)

  const supabase = createClient()
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, legal_name, trade_name, description, reliability_tier, cities(name), countries(name, iso_code)')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: true })
    .limit(3)

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0B1F4D] text-white min-h-[92vh] flex items-center">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Rotating ring */}
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full border border-blue-500/10 animate-rotate-slow" />
          <div className="absolute -top-16 -left-16 w-[350px] h-[350px] rounded-full border border-blue-400/10 animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/15 blur-3xl animate-float delay-400" />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
          {/* Diagonal gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F4D] via-[#0f2d6b]/80 to-[#091840]" />
        </div>

        <div className="container mx-auto px-4 py-20 lg:py-28 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* ── Left column ────────────────────────────────────────── */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="animate-fade-in-up inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-blue-100">
                <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-blink" />
                Global B2B Trade Platform
              </div>

              {/* Headline */}
              <div className="space-y-3 animate-fade-in-up delay-150">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
                  Global Marketplace<br />
                  Managed by{' '}
                  <span className="text-gradient-gold">TTAI EMA</span>
                </h1>
                <p className="text-lg text-blue-200 max-w-md leading-relaxed">
                  Connecting verified factories, suppliers, and global buyers — all in one trusted platform.
                </p>
              </div>

              {/* Trust icons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up delay-300">
                {[
                  { Icon: IconGlobe,     label: 'Global Reach' },
                  { Icon: IconShield,    label: 'Verified' },
                  { Icon: IconPackage,   label: 'Wide Range' },
                  { Icon: IconHandshake, label: 'Trusted' },
                ].map(({ Icon, label }, i) => (
                  <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#F5A623]" />
                    </div>
                    <p className="text-xs text-blue-200 font-medium text-center leading-tight">{label}</p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 animate-fade-in-up delay-400">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] text-[#0B1F4D] px-7 py-3.5 text-sm font-bold hover:bg-[#fbb93a] hover:shadow-lg hover:shadow-[#F5A623]/30 transition-all duration-200 hover:-translate-y-0.5"
                >
                  Explore Marketplace
                  <IconArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/suppliers"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 text-white px-7 py-3.5 text-sm font-semibold hover:bg-white/10 transition-all duration-200"
                >
                  View Suppliers
                </Link>
              </div>
            </div>

            {/* ── Right column — Region finder ────────────────────────── */}
            <div className="animate-slide-right delay-200">
              <div className="bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                <div className="bg-gradient-to-r from-[#0B1F4D] to-[#162d6e] px-6 py-5">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#F5A623]/20 flex items-center justify-center">
                      <IconMapPin className="w-4 h-4 text-[#F5A623]" />
                    </div>
                    <h2 className="font-bold text-white text-lg">Find Products by Region</h2>
                  </div>
                  <p className="text-sm text-blue-200 ml-10">Select a region to discover suppliers</p>
                </div>

                <div className="divide-y divide-gray-100">
                  {REGIONS.map((r, i) => (
                    <Link
                      key={r.label}
                      href={r.href}
                      className="flex items-center justify-between px-6 py-4 hover:bg-blue-50 transition-colors group"
                      style={{ animationDelay: `${300 + i * 80}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                          <r.Icon />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 group-hover:text-[#0B1F4D]">{r.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#0B1F4D] flex items-center justify-center transition-colors flex-shrink-0">
                        <IconChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t">
                  <Link
                    href="/marketplace"
                    className="flex items-center justify-center gap-2 text-[#0B1F4D] text-sm font-semibold hover:text-blue-700 transition-colors"
                  >
                    <IconSearch className="w-4 h-4" />
                    Browse all products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#0f2a5e] border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {STATS.map(({ value, label }, i) => (
              <div
                key={label}
                className="py-6 px-6 text-center animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <p className="text-3xl font-extrabold text-[#F5A623]">{value}</p>
                <p className="text-xs text-blue-300 mt-1 font-medium uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRODUCT FAMILIES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest mb-2">What We Offer</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">Explore Our Product Families</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">Discover high-quality products from verified factories across 6 major categories</p>
            <div className="mt-4 mx-auto w-16 h-1 bg-[#F5A623] rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCT_FAMILIES.map((cat, i) => (
              <Link
                key={cat.name}
                href={`/marketplace?category=${cat.slug}`}
                className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={cat.img}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className={`absolute bottom-3 left-3 w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center shadow-lg`}>
                    <cat.Icon />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[#0B1F4D] text-base group-hover:text-blue-700 transition-colors">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{cat.desc}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#F5A623] group-hover:gap-2.5 transition-all">
                    Browse products
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SHOP BY REGION
      ══════════════════════════════════════════════════════════════════ */}
      <section id="shop-by-region" className="py-24 px-4 bg-[#0B1F4D] overflow-hidden relative">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Glow orbs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#F5A623]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="container mx-auto relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest mb-2">Global Discovery</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Shop by Region</h2>
              <p className="text-blue-300 mt-2 text-sm max-w-md">Discover curated product collections tailored to each region&apos;s taste and demand.</p>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#F5A623] hover:text-[#fbb93a] transition-colors flex-shrink-0"
            >
              View all products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Region cards grid — 2 large + 3 small */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large cards: first 2 */}
            {[
              { id: 'middle-east', name: 'Middle East', tagline: 'From historic souks to gleaming skylines', img: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=900&q=80', countries: 6, span: true },
              { id: 'europe',      name: 'Europe',      tagline: 'Quality, precision and centuries of craftsmanship', img: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=900&q=80', countries: 5, span: true },
            ].map((r, i) => (
              <Link
                key={r.id}
                href={`/regions/${r.id}`}
                className="group relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gray-800 sm:col-span-1"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative h-56 sm:h-64 lg:h-72">
                  <Image
                    src={r.img}
                    alt={r.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-600"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-white font-extrabold text-xl">{r.name}</h3>
                      <p className="text-white/60 text-xs mt-1 leading-snug max-w-[200px]">{r.tagline}</p>
                      <p className="text-[#F5A623] text-xs font-bold mt-2">{r.countries} countries →</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-[#F5A623] group-hover:border-[#F5A623] transition-all flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Small cards: Asia, Africa, Americas stacked */}
            <div className="flex flex-col gap-4">
              {[
                { id: 'asia',     name: 'Asia',     tagline: 'The engine of global manufacturing', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=700&q=80', countries: 4 },
                { id: 'africa',   name: 'Africa',   tagline: 'A continent of rising markets',       img: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=700&q=80', countries: 3 },
                { id: 'americas', name: 'Americas', tagline: 'Vast markets coast to coast',         img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=700&q=80', countries: 3 },
              ].map((r, i) => (
                <Link
                  key={r.id}
                  href={`/regions/${r.id}`}
                  className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 bg-gray-800 flex-1"
                  style={{ animationDelay: `${(i + 2) * 80}ms` }}
                >
                  <div className="relative h-32 sm:h-36">
                    <Image
                      src={r.img}
                      alt={r.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                  </div>
                  <div className="absolute inset-0 flex items-center px-5">
                    <div className="flex-1">
                      <h3 className="text-white font-extrabold text-base">{r.name}</h3>
                      <p className="text-white/60 text-[11px] mt-0.5 leading-snug max-w-[180px]">{r.tagline}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-[#F5A623] group-hover:border-[#F5A623] transition-all flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-gray-50 overflow-hidden">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">How It Works</h2>
            <div className="mt-4 mx-auto w-16 h-1 bg-[#F5A623] rounded-full" />
          </div>

          {/* Desktop stepper */}
          <div className="hidden md:flex items-start gap-0">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="flex items-start flex-1 animate-fade-in-up" style={{ animationDelay: `${i * 120}ms` }}>
                <div className="flex flex-col items-center flex-1">
                  {/* Connector + icon row */}
                  <div className="flex items-center w-full mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#0B1F4D] text-white flex items-center justify-center shadow-lg flex-shrink-0 group hover:bg-[#F5A623] transition-colors duration-300 cursor-default relative">
                      <StepIcons step={item.step} />
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[10px] font-extrabold flex items-center justify-center">
                        {item.step}
                      </div>
                    </div>
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-[#0B1F4D]/40 to-gray-200 mx-3 animate-line-grow" style={{ animationDelay: `${i * 120 + 200}ms` }} />
                    )}
                  </div>
                  {/* Text */}
                  <div className="pr-6">
                    <p className="font-bold text-sm text-[#0B1F4D] mb-1">{item.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile stepper */}
          <div className="flex flex-col gap-4 md:hidden">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="flex items-start gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-[#0B1F4D] text-white flex items-center justify-center shadow-md">
                    <StepIcons step={item.step} />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[10px] font-extrabold flex items-center justify-center">
                    {item.step}
                  </div>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-200" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-bold text-sm text-[#0B1F4D]">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FACTORIES & ZONES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest mb-2">Our Network</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">Main Factories & Zones</h2>
            <p className="text-gray-400 mt-3 text-sm">
              All managed and verified by <span className="text-[#F5A623] font-bold">TTAI EMA</span>
            </p>
            <div className="mt-4 mx-auto w-16 h-1 bg-[#F5A623] rounded-full" />
          </div>

          {suppliers && suppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suppliers.map((s, i) => {
                const city = s.cities as unknown as { name: string } | null
                const country = s.countries as unknown as { name: string; iso_code: string } | null
                const displayName = s.trade_name ?? s.legal_name
                const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                const isGold = s.reliability_tier === 'GOLD'

                return (
                  <Link
                    key={s.id}
                    href={`/suppliers/${s.id}`}
                    className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-fade-in-up"
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    {/* Card header */}
                    <div className="relative bg-gradient-to-br from-[#0B1F4D] to-[#162d6e] p-5">
                      {isGold && (
                        <div className="absolute top-3 right-3 bg-[#F5A623] text-[#0B1F4D] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Gold
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white flex items-center justify-center text-xl font-black flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-bold text-white group-hover:text-[#F5A623] transition-colors leading-tight">{displayName}</h3>
                          <p className="text-xs text-blue-200 mt-0.5 flex items-center gap-1">
                            <IconMapPin className="w-3 h-3" />
                            {[city?.name, country?.name].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5 space-y-3 bg-white">
                      <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <IconCheck className="w-3 h-3" />
                        </div>
                        Verified & managed by TTAI EMA
                      </div>
                      {s.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{s.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {['Wholesale', 'Export', 'B2B'].map((tag) => (
                          <span key={tag} className="text-[11px] bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#F5A623] group-hover:gap-2 transition-all">
                        <IconFactory className="w-3.5 h-3.5" />
                        View supplier profile
                        <IconArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200">
              <IconFactory className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No suppliers yet</p>
              <p className="text-xs text-gray-300 mt-1">Run the demo seed in Supabase to populate suppliers</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/suppliers"
              className="inline-flex items-center gap-2.5 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] px-8 py-3.5 text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all duration-200 hover:shadow-lg"
            >
              <IconFactory className="w-4 h-4" />
              View All Suppliers
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#0B1F4D] text-white relative overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Glow orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 border border-[#F5A623]/30 rounded-full px-4 py-2 text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
                Join the Network
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight">
                Ready to Start<br className="hidden sm:block" />
                <span className="text-[#F5A623]"> Trading?</span>
              </h2>
              <p className="text-blue-200 max-w-xl mx-auto text-base leading-relaxed">
                Join thousands of verified suppliers and buyers on TTAI EMA&apos;s trusted global marketplace.
              </p>
            </div>

            {/* Two CTA cards side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
              <Link
                href="/register"
                className="group flex flex-col items-center text-center rounded-2xl bg-[#F5A623] text-[#0B1F4D] px-6 py-6 font-bold hover:bg-[#fbb93a] hover:shadow-2xl hover:shadow-[#F5A623]/20 transition-all hover:-translate-y-1"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0B1F4D]/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-base font-black">Join as Supplier</p>
                <p className="text-xs font-normal text-[#0B1F4D]/70 mt-1">List products and reach global buyers</p>
              </Link>
              <Link
                href="/marketplace"
                className="group flex flex-col items-center text-center rounded-2xl bg-white/10 border border-white/20 text-white px-6 py-6 font-bold hover:bg-white/15 hover:border-white/30 transition-all hover:-translate-y-1 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-base font-black">Browse Marketplace</p>
                <p className="text-xs font-normal text-blue-200 mt-1">Discover verified suppliers worldwide</p>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-blue-300">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                No setup fee
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Verified in 48 hours
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TRUST BAR
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto">
          <p className="text-center text-xs font-black uppercase tracking-widest text-[#F5A623] mb-10">Why businesses trust us</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: IconShield, label: 'Verified Suppliers',  desc: 'Every factory audited, certified, and continuously monitored by our compliance team.', color: 'bg-blue-50 text-blue-600' },
              { Icon: IconGlobe,  label: 'Global Network',      desc: '50+ countries connected on one platform with local support in every major region.', color: 'bg-green-50 text-green-600' },
              { Icon: IconLock,   label: 'Secure Transactions', desc: 'End-to-end encrypted trade environment with escrow and invoice payment protection.', color: 'bg-purple-50 text-purple-600' },
              { Icon: IconPhone,  label: '24/7 Support',        desc: 'Dedicated trade specialists available around the clock to resolve any issue fast.', color: 'bg-orange-50 text-orange-600' },
            ].map(({ Icon, label, desc, color }, i) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#0B1F4D] text-sm mb-2">{label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
