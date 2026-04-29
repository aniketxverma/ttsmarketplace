import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/* ─── Icons ─────────────────────────────────────────────────────────────── */
function IconGlobe({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function IconShield({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
}
function IconPackage({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
}
function IconHandshake({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function IconMapPin({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function IconChevronRight({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
}
function IconArrowRight({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
}
function IconCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
}
function IconPhone({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
}
function IconLock({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
}
function IconSearch({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
}
function IconFactory({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
}

/* ─── Region building icon ──────────────────────────────────────────────── */
function RegionIcon({ color }: { color: string }) {
  return (
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
  )
}

/* ─── Data ──────────────────────────────────────────────────────────────── */
const REGIONS = [
  { label: 'Middle East', desc: 'Discover suppliers in the Middle East', color: 'bg-amber-500',   href: '/marketplace?region=me' },
  { label: 'Europe',      desc: 'Explore European suppliers',            color: 'bg-blue-600',    href: '/marketplace?region=eu' },
  { label: 'USA',         desc: 'Find suppliers in the United States',   color: 'bg-red-600',     href: '/marketplace?region=us' },
  { label: 'Africa',      desc: 'Explore African suppliers',             color: 'bg-green-600',   href: '/marketplace?region=af' },
]

const PRODUCT_FAMILIES = [
  {
    name: 'Food & Beverages',
    desc: 'Canned food, snacks, drinks, dairy, oils and more.',
    img: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=600&q=80',
    icon: '🌾', color: 'bg-green-500', slug: 'agriculture-food',
  },
  {
    name: 'Cleaning & Household',
    desc: 'Detergents, surface cleaners, disinfectants, and more.',
    img: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80',
    icon: '🧹', color: 'bg-blue-500', slug: 'health-beauty',
  },
  {
    name: 'Personal Care & Hygiene',
    desc: 'Shampoos, soaps, creams, oral care, and more.',
    img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
    icon: '💆', color: 'bg-purple-500', slug: 'health-beauty',
  },
  {
    name: 'Industrial / Technical',
    desc: 'Raw materials, chemicals, lubricants, industrial solutions.',
    img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80',
    icon: '⚙️', color: 'bg-orange-500', slug: 'industrial-machinery',
  },
  {
    name: 'Electronics & Tech',
    desc: 'Electronics, accessories, components and more.',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
    icon: '💻', color: 'bg-slate-600', slug: 'electronics-technology',
  },
  {
    name: 'Recycling & Sustainable',
    desc: 'Eco-friendly, recycled and sustainable solutions.',
    img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80',
    icon: '♻️', color: 'bg-emerald-600', slug: 'home-garden',
  },
]

const HOW_IT_WORKS = [
  { step: 1, title: 'Choose a Product Family', desc: 'Select the category you are interested in.',          icon: 'M4 6h16M4 10h16M4 14h16M4 18h7' },
  { step: 2, title: 'Select a Region',         desc: 'Choose your region or country.',                      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { step: 3, title: 'Find Factories',          desc: 'Discover verified factories in that region.',         icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { step: 4, title: 'View Products',           desc: 'Explore products and request information.',           icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { step: 5, title: 'Connect & Trade',         desc: 'Connect with suppliers and start trading.',           icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
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
      <section className="relative overflow-hidden bg-[#0B1F4D] text-white min-h-[90vh] flex items-center">

        {/* World map background */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=60"
            alt=""
            fill
            className="object-cover opacity-20 mix-blend-luminosity"
            priority
            sizes="100vw"
          />
          {/* Blue overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F4D] via-[#0B1F4D]/90 to-[#0B1F4D]/70" />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          {/* Glow */}
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 lg:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left */}
            <div className="space-y-7">
              <div className="animate-fade-in-up inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-blue-100 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
                Global B2B Trade Platform
              </div>

              <div className="animate-fade-in-up delay-75 space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold leading-[1.1] tracking-tight">
                  Global Marketplace<br />
                  Managed by{' '}
                  <span className="text-[#F5A623]">TTAI EMA</span>
                </h1>
                <p className="text-base text-blue-200 max-w-md leading-relaxed">
                  Connecting factories, suppliers and buyers around the world.
                </p>
              </div>

              {/* Trust pills */}
              <div className="animate-fade-in-up delay-150 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { Icon: IconGlobe,     label: 'Global Reach' },
                  { Icon: IconShield,    label: 'Verified Suppliers' },
                  { Icon: IconPackage,   label: 'Wide Range of Products' },
                  { Icon: IconHandshake, label: 'Trusted Partnerships' },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/6 border border-white/10 hover:bg-white/10 transition-colors text-center">
                    <div className="w-9 h-9 rounded-full bg-[#F5A623]/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#F5A623]" />
                    </div>
                    <p className="text-[11px] text-blue-200 font-medium leading-tight">{label}</p>
                  </div>
                ))}
              </div>

              <div className="animate-fade-in-up delay-300">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-8 py-3.5 text-sm font-extrabold hover:bg-[#fbb93a] hover:shadow-xl hover:shadow-[#F5A623]/30 transition-all duration-200 hover:-translate-y-0.5"
                >
                  Explore the Marketplace
                  <IconArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right — Region finder card */}
            <div className="animate-fade-in-up delay-200">
              <div className="bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#0B1F4D] to-[#162d6e] px-6 py-5">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#F5A623]/20 flex items-center justify-center">
                      <IconMapPin className="w-4 h-4 text-[#F5A623]" />
                    </div>
                    <h2 className="font-bold text-white text-base">Find Products by Region</h2>
                  </div>
                  <p className="text-xs text-blue-200 ml-10">Choose a region to discover products and suppliers</p>
                </div>

                <div className="divide-y divide-gray-100">
                  {REGIONS.map((r) => (
                    <Link
                      key={r.label}
                      href={r.href}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <RegionIcon color={r.color} />
                        <div>
                          <p className="font-semibold text-sm text-gray-900 group-hover:text-[#0B1F4D]">{r.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-gray-100 group-hover:bg-[#0B1F4D] flex items-center justify-center transition-colors flex-shrink-0">
                        <IconChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="px-5 py-3.5 bg-gray-50 border-t">
                  <Link href="/marketplace" className="flex items-center justify-center gap-1.5 text-[#0B1F4D] text-sm font-semibold hover:text-blue-700 transition-colors">
                    <IconSearch className="w-4 h-4" />
                    Browse all products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRODUCT FAMILIES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">Explore Our Product Families</h2>
            <p className="text-gray-400 mt-2 text-sm">Discover a wide range of high-quality products from trusted factories</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {PRODUCT_FAMILIES.map((cat, i) => (
              <Link
                key={cat.name}
                href={`/marketplace?category=${cat.slug}`}
                className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative h-36 overflow-hidden bg-gray-100">
                  <Image
                    src={cat.img}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className={`absolute bottom-2 left-2 w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center shadow-md text-sm`}>
                    {cat.icon}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-[#0B1F4D] text-xs leading-tight group-hover:text-blue-700 transition-colors">{cat.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">{cat.desc}</p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#F5A623]">
                    Explore
                    <IconChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">How It Works</h2>
            <div className="mt-3 mx-auto w-12 h-1 bg-[#F5A623] rounded-full" />
          </div>

          {/* Desktop */}
          <div className="hidden md:flex items-start gap-0">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="flex items-start flex-1 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full mb-5">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#0B1F4D] text-white flex items-center justify-center shadow-lg hover:bg-[#F5A623] hover:text-[#0B1F4D] transition-colors duration-300 cursor-default">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                        </svg>
                      </div>
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[10px] font-extrabold flex items-center justify-center shadow">
                        {item.step}
                      </div>
                    </div>
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="flex-1 h-px bg-gradient-to-r from-[#0B1F4D]/30 to-gray-200 mx-3" />
                    )}
                  </div>
                  <div className="pr-4 w-full">
                    <p className="font-bold text-xs text-[#0B1F4D] mb-1">{item.title}</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-4 md:hidden">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="flex items-start gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-[#0B1F4D] text-white flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                    </svg>
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[10px] font-extrabold flex items-center justify-center">
                    {item.step}
                  </div>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="absolute top-11 left-1/2 -translate-x-1/2 w-px h-4 bg-gray-200" />
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
          MAIN FACTORIES & ZONES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#F5A623] font-semibold text-xs uppercase tracking-widest mb-2">Our Network</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">Our Main Factories &amp; Zones</h2>
            <p className="text-gray-400 mt-2 text-sm">
              All managed and verified by <span className="text-[#F5A623] font-bold">TTAI EMA</span>
            </p>
          </div>

          {suppliers && suppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suppliers.map((s, i) => {
                const city = s.cities as unknown as { name: string } | null
                const country = s.countries as unknown as { name: string; iso_code: string } | null
                const displayName = s.trade_name ?? s.legal_name
                const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                const isGold = s.reliability_tier === 'GOLD'
                const tagMap: Record<string, string[]> = {
                  ES: ['Food', 'Beverages', 'Agriculture'],
                  DE: ['Industrial', 'Technical', 'Chemicals'],
                  TR: ['Textiles', 'Apparel', 'Fashion'],
                  AE: ['Construction', 'Industrial', 'Building'],
                  FR: ['Wellness', 'Beauty', 'Health'],
                  IT: ['Home', 'Lifestyle', 'Office'],
                }
                const tags = tagMap[country?.iso_code ?? ''] ?? ['Wholesale', 'Export', 'B2B']

                return (
                  <Link
                    key={s.id}
                    href={`/suppliers/${s.id}`}
                    className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-fade-in-up bg-white"
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    {/* Card image header */}
                    <div className="relative h-28 bg-gradient-to-br from-[#0B1F4D] to-[#162d6e] overflow-hidden">
                      {isGold && (
                        <div className="absolute top-3 right-3 bg-[#F5A623] text-[#0B1F4D] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide z-10">
                          Gold
                        </div>
                      )}
                      {/* Abstract background pattern */}
                      <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                      <div className="absolute inset-0 flex items-center px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 text-white flex items-center justify-center text-2xl font-black flex-shrink-0 shadow-lg">
                            {initials}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-white text-base group-hover:text-[#F5A623] transition-colors leading-tight">
                              {displayName}
                            </h3>
                            <p className="text-xs text-blue-200 mt-1 flex items-center gap-1">
                              <IconMapPin className="w-3 h-3" />
                              {[city?.name, country?.name].filter(Boolean).join(' · ') || 'Global'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <IconCheck className="w-2.5 h-2.5" />
                        </div>
                        Managed by TTAI EMA
                      </div>
                      {s.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{s.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag} className="text-[11px] bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
              <IconFactory className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No suppliers yet</p>
              <p className="text-xs text-gray-300 mt-1">Run the demo seed in Supabase to populate suppliers</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/suppliers"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] px-7 py-3 text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all duration-200"
            >
              <IconFactory className="w-4 h-4" />
              View All Suppliers
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TRUST BAR
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 px-4 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { Icon: IconShield, label: 'Verified Suppliers',  desc: 'Every factory audited, certified and continuously monitored.',           color: 'bg-blue-50 text-blue-600' },
              { Icon: IconGlobe,  label: 'Global Network',      desc: '50+ countries on one platform with local support in every region.',      color: 'bg-green-50 text-green-600' },
              { Icon: IconLock,   label: 'Secure Transactions', desc: 'End-to-end encrypted trade environment with invoice payment protection.', color: 'bg-purple-50 text-purple-600' },
              { Icon: IconPhone,  label: '24/7 Support',        desc: 'Dedicated trade specialists available around the clock for you.',         color: 'bg-orange-50 text-orange-600' },
            ].map(({ Icon, label, desc, color }, i) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0B1F4D] text-sm mb-1">{label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-[#0B1F4D] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 border border-[#F5A623]/30 rounded-full px-4 py-1.5 text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
            Join the Network
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Start <span className="text-[#F5A623]">Trading?</span>
          </h2>
          <p className="text-blue-200 max-w-lg mx-auto text-sm leading-relaxed mb-8">
            Join thousands of verified suppliers and buyers on TTAI EMA&apos;s trusted global marketplace.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-8 py-3.5 text-sm font-extrabold hover:bg-[#fbb93a] hover:shadow-lg hover:shadow-[#F5A623]/30 transition-all hover:-translate-y-0.5"
            >
              Get Started Free
              <IconArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 text-white px-8 py-3.5 text-sm font-semibold hover:bg-white/10 transition-all"
            >
              Browse Marketplace
            </Link>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-blue-300 mt-8">
            {['No setup fee', 'Verified in 48 hours', 'Cancel anytime'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <IconCheck className="w-3.5 h-3.5 text-green-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
