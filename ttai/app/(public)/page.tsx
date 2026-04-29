import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const REGIONS = [
  { label: 'Middle East', desc: 'Discover suppliers in the Middle East', icon: '🕌', href: '/marketplace?region=me' },
  { label: 'Europe',      desc: 'Explore European suppliers',            icon: '🏛️', href: '/marketplace?region=eu' },
  { label: 'USA',         desc: 'Find suppliers in the United States',   icon: '🗽', href: '/marketplace?region=us' },
  { label: 'Africa',      desc: 'Explore African suppliers',             icon: '🌍', href: '/marketplace?region=af' },
]

const PRODUCT_FAMILIES = [
  {
    name: 'Food & Beverages',
    desc: 'Canned food, snacks, drinks, dairy, oils and more.',
    img: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80',
    icon: '🥗',
    color: 'bg-green-500',
    slug: 'agriculture-food',
  },
  {
    name: 'Cleaning & Household',
    desc: 'Detergents, surface cleaners, disinfectants, and more.',
    img: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80',
    icon: '🧴',
    color: 'bg-blue-500',
    slug: 'health-beauty',
  },
  {
    name: 'Personal Care & Hygiene',
    desc: 'Shampoos, soaps, creams, oral care, and more.',
    img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
    icon: '🧼',
    color: 'bg-purple-500',
    slug: 'health-beauty',
  },
  {
    name: 'Industrial & Technical',
    desc: 'Raw materials, chemicals, lubricants, industrial solutions.',
    img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',
    icon: '⚙️',
    color: 'bg-orange-500',
    slug: 'industrial-machinery',
  },
  {
    name: 'Electronics & Tech',
    desc: 'Electronics, accessories, components and more.',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
    icon: '💻',
    color: 'bg-slate-600',
    slug: 'electronics-technology',
  },
  {
    name: 'Recycling & Sustainable',
    desc: 'Eco-friendly, recycled and sustainable solutions.',
    img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&q=80',
    icon: '♻️',
    color: 'bg-emerald-600',
    slug: 'home-garden',
  },
]

const HOW_IT_WORKS = [
  { step: 1, title: 'Choose a Product Family', desc: 'Select the category you are interested in.' },
  { step: 2, title: 'Select a Region',          desc: 'Choose your region or country.' },
  { step: 3, title: 'Find Factories',            desc: 'Discover verified factories in that region.' },
  { step: 4, title: 'View Products',             desc: 'Explore products and request information.' },
  { step: 5, title: 'Connect & Trade',            desc: 'Connect with suppliers and start trading.' },
]

export default async function HomePage({ searchParams }: { searchParams: { code?: string } }) {
  if (searchParams.code) {
    redirect(`/auth/callback?code=${searchParams.code}`)
  }

  const supabase = createClient()
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, legal_name, trade_name, description, reliability_tier, city_id, cities(name), country_id, countries(name, iso_code)')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: true })
    .limit(3)

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0B1F4D] text-white">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-3xl" />
          {/* Grid dots pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
        </div>

        <div className="container mx-auto px-4 py-16 lg:py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  Global Marketplace<br />
                  Managed by{' '}
                  <span className="text-[#F5A623]">TTAI EMA</span>
                </h1>
                <p className="text-lg text-blue-200">
                  Connecting factories, suppliers and buyers around the world.
                </p>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: '🌐', label: 'Global Reach' },
                  { icon: '✅', label: 'Verified Suppliers' },
                  { icon: '📦', label: 'Wide Range of Products' },
                  { icon: '🤝', label: 'Trusted Partnerships' },
                ].map((b) => (
                  <div key={b.label} className="text-center space-y-1">
                    <div className="text-2xl">{b.icon}</div>
                    <p className="text-xs text-blue-200 font-medium leading-tight">{b.label}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 rounded-md bg-[#F5A623] text-[#0B1F4D] px-8 py-3.5 text-sm font-bold hover:bg-[#e8962c] transition-colors"
              >
                Explore the Marketplace
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Right — Region finder */}
            <div className="bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-4 border-b">
                <h2 className="font-bold text-[#0B1F4D] text-lg">Find Products by Region</h2>
                <p className="text-sm text-gray-500 mt-0.5">Choose a region to discover products and suppliers.</p>
              </div>
              <div className="divide-y">
                {REGIONS.map((r) => (
                  <Link
                    key={r.label}
                    href={r.href}
                    className="flex items-center justify-between px-5 py-4 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{r.icon}</span>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{r.label}</p>
                        <p className="text-xs text-gray-500">{r.desc}</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0B1F4D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Families ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0B1F4D]">Explore Our Product Families</h2>
            <p className="text-gray-500 mt-2">Discover a wide range of high-quality products from trusted factories</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCT_FAMILIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/marketplace?category=${cat.slug}`}
                className="group rounded-xl border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={cat.img}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className={`absolute bottom-3 left-3 w-9 h-9 rounded-full ${cat.color} flex items-center justify-center text-white text-lg shadow-md`}>
                    {cat.icon}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[#0B1F4D]">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>
                  <p className="text-xs font-semibold text-[#F5A623] mt-3 flex items-center gap-1">
                    Explore
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-[#0B1F4D] text-center mb-14">How It Works</h2>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-0">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="flex md:flex-col items-center md:items-start flex-1 gap-4 md:gap-3">
                <div className="flex items-center gap-3 md:gap-0">
                  <div className="w-10 h-10 rounded-full bg-[#0B1F4D] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block h-0.5 flex-1 bg-gray-300 mx-3" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#0B1F4D]">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-[130px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Factories & Zones ────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#0B1F4D]">Our Main Factories & Zones</h2>
            <p className="text-sm text-gray-500 mt-1">
              Managed by <span className="text-[#F5A623] font-semibold">TTAI EMA</span>
            </p>
          </div>

          {suppliers && suppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suppliers.map((s) => {
                const city = s.cities as unknown as { name: string } | null
                const country = s.countries as unknown as { name: string; iso_code: string } | null
                const displayName = s.trade_name ?? s.legal_name
                const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <Link
                    key={s.id}
                    href={`/suppliers/${s.id}`}
                    className="rounded-xl border hover:shadow-lg transition-shadow overflow-hidden group"
                  >
                    <div className="bg-gray-50 p-5 flex items-center gap-4 border-b">
                      <div className="w-14 h-14 rounded-lg bg-[#0B1F4D] text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0B1F4D] group-hover:text-blue-700 transition-colors">{displayName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Main Zone: {country?.name ?? '—'}
                          {city ? ` – ${city.name}` : ''}
                          {country?.iso_code && (
                            <span className="ml-1">{country.iso_code === 'ES' ? '🇪🇸' : country.iso_code === 'US' ? '🇺🇸' : country.iso_code === 'LB' ? '🇱🇧' : ''}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Managed by TTAI EMA
                      </div>
                      {s.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{s.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['Food', 'Beverages', 'Export'].map((tag) => (
                          <span key={tag} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 font-medium">
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
            <div className="text-center py-12 text-gray-400">
              <p>No suppliers yet. Run the demo seed to populate suppliers.</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-md border-2 border-[#0B1F4D] text-[#0B1F4D] px-8 py-3 text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-colors"
            >
              View All Suppliers
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom trust bar ─────────────────────────────────────────────── */}
      <section className="border-t py-8 px-4 bg-white">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: '✅', label: 'Verified Suppliers', desc: 'All factories are verified and trusted.' },
            { icon: '🌐', label: 'Global Network',     desc: 'We connect more than 50+ countries.' },
            { icon: '🔒', label: 'Secure Transactions', desc: 'Safe and reliable trading environment.' },
            { icon: '📞', label: '24/7 Support',       desc: 'Our team is always here to help you.' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-semibold text-sm text-[#0B1F4D]">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
