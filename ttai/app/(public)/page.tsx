import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { useServerTranslations } from '@/lib/i18n/server'
import { HomeFeatures } from './HomeFeatures'
import { IndustryExplorer } from './IndustryExplorer'
import { Reveal } from '@/components/Reveal'
import { PLANS } from '@/lib/pricing'

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
  {/* Home appliance / washing-machine drum icon */}
  return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><circle cx="7.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="10.5" cy="7.5" r="0.5" fill="currentColor"/></svg>
}
function ElectronicsIcon() {
  {/* Smartphone icon — fits "Smartphones, laptops, iPhones" */}
  return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
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

// Industry ecosystem — 13 main categories. Subcategories live in the marketplace.
const PRODUCT_FAMILIES = [
  { name: 'Food & Beverage',                  desc: 'Agriculture, manufacturing, suppliers, distribution & food recycling.',       img: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=600&q=80', Icon: FoodIcon,        color: 'bg-green-500',   slug: 'food-beverage' },
  { name: 'Cleaning & Household',             desc: 'Cleaning products, tissue & paper, equipment, suppliers & recycling.',         img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80', Icon: CleanIcon,       color: 'bg-blue-500',    slug: 'cleaning-household' },
  { name: 'Personal Care',                    desc: 'Cosmetics, perfumes, hair & skin care, hygiene, suppliers & distributors.',   img: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=600&q=80', Icon: CareIcon,        color: 'bg-purple-500',  slug: 'personal-care' },
  { name: 'Electronics & Tech',               desc: 'Smartphones, computers, networking, software, AI & components.',               img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80', Icon: ElectronicsIcon, color: 'bg-slate-600',   slug: 'electronics-tech' },
  { name: 'Home Appliances',                  desc: 'Refrigerators, washing machines, ovens, A/C & kitchen appliances.',            img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', Icon: IndustrialIcon,  color: 'bg-orange-500',  slug: 'home-appliances' },
  { name: 'Recycling & Sustainability',       desc: 'Plastic, metal, glass & paper recycling, renewable energy & circular economy.',img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80', Icon: RecycleIcon,     color: 'bg-emerald-600', slug: 'recycling-sustainability' },
  { name: 'Healthcare & Medical',             desc: 'Clinics, hospitals, laboratories, medical devices & telemedicine.',            img: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=80', Icon: CareIcon,        color: 'bg-rose-500',    slug: 'healthcare-medical' },
  { name: 'Construction & Building',          desc: 'Building materials, structures & construction supply chain.',                  img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80', Icon: IndustrialIcon,  color: 'bg-amber-600',   slug: 'construction-building' },
  { name: 'Automotive',                       desc: 'Vehicles, parts, accessories and the automotive supply chain.',                img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80', Icon: IndustrialIcon,  color: 'bg-zinc-600',    slug: 'automotive' },
  { name: 'Textile & Fashion',                desc: 'Fabrics, apparel, fashion manufacturing and distribution.',                    img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80', Icon: CareIcon,        color: 'bg-pink-500',    slug: 'textile-fashion' },
  { name: 'Logistics & Supply Chain',         desc: 'Freight, warehousing, distribution and end-to-end logistics.',                 img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80', Icon: IndustrialIcon,  color: 'bg-cyan-600',    slug: 'logistics-supply-chain' },
  { name: 'Industrial & Manufacturing',       desc: 'Machinery, equipment, raw materials and industrial production.',                img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80', Icon: IndustrialIcon,  color: 'bg-indigo-600',  slug: 'industrial-manufacturing' },
  { name: 'Consulting & Services',            desc: 'Business, financial, marketing, legal, HR & training services.',               img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80', Icon: ElectronicsIcon, color: 'bg-teal-600',    slug: 'consulting-services' },
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

  const { t, messages } = await useServerTranslations()

  const supabase = createClient()
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, legal_name, trade_name, description, reliability_tier, cities(name), countries(name, iso_code)')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: true })
    .limit(3)

  const HOW_STEPS = messages.home.how_steps
  const TRUST_CARDS = messages.home.trust_cards

  const STATS_T = [
    { value: '50+',  label: t('home.stats_countries') },
    { value: '200+', label: t('home.stats_suppliers') },
    { value: '5K+',  label: t('home.stats_products') },
    { value: '99%',  label: t('home.stats_satisfaction') },
  ]

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
              <div className="animate-fade-in-up inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full pl-2 pr-4 py-1.5 text-sm font-medium text-blue-100 shadow-lg shadow-black/10">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F5A623]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-blink" />
                </span>
                {t('home.badge')}
              </div>

              {/* Headline */}
              <div className="space-y-4 animate-fade-in-up delay-150">
                <h1 className="text-4xl sm:text-5xl lg:text-[68px] font-black leading-[1.05] tracking-[-0.02em] drop-shadow-sm">
                  {t('home.hero_title_1')}<br />
                  {t('home.hero_title_2')}{' '}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-[#F5A623] via-[#ffd27a] to-[#F5A623] bg-clip-text text-transparent"
                      style={{ backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite' }}>
                      TTAI EMA
                    </span>
                  </span>
                </h1>
                <p className="text-lg text-blue-200/90 max-w-md leading-relaxed">
                  {t('home.hero_subtitle')}
                </p>
              </div>

              {/* Trust icons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up delay-300">
                {[
                  { Icon: IconGlobe,     label: t('home.trust_global') },
                  { Icon: IconShield,    label: t('home.trust_verified') },
                  { Icon: IconPackage,   label: t('home.trust_range') },
                  { Icon: IconHandshake, label: t('home.trust_trusted') },
                ].map(({ Icon, label }, i) => (
                  <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#F5A623]" />
                    </div>
                    <p className="text-xs text-blue-200 font-medium text-center leading-tight">{label}</p>
                  </div>
                ))}
              </div>

              {/* CTAs — one clear action: join the marketplace */}
              <div className="flex flex-wrap gap-3 animate-fade-in-up delay-400">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] text-[#0B1F4D] px-7 py-3.5 text-sm font-bold hover:bg-[#fbb93a] hover:shadow-lg hover:shadow-[#F5A623]/30 transition-all duration-200 hover:-translate-y-0.5"
                >
                  Register Business
                  <IconArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 text-white px-7 py-3.5 text-sm font-semibold hover:bg-white/10 transition-all duration-200"
                >
                  Explore Marketplace
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
                    <h2 className="font-bold text-white text-lg">{t('home.find_by_region')}</h2>
                  </div>
                  <p className="text-sm text-blue-200 ml-10">{t('home.find_subtitle')}</p>
                </div>

                {/* Guide label */}
                <div className="px-6 pt-3 pb-2 flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-[#F5A623] uppercase tracking-widest">
                    🇪🇸 Spain is Live — Start here
                  </span>
                  <span className="flex-1 h-px bg-gray-100" />
                </div>

                <div className="divide-y divide-gray-100">
                  {REGIONS.map((r) => {
                    const isActive = r.label === 'Europe'

                    if (!isActive) {
                      return (
                        <div key={r.label}
                          className="relative flex items-center justify-between px-6 py-4 bg-gray-50/80 select-none cursor-not-allowed">
                          <div className="flex items-center gap-4 opacity-40 grayscale">
                            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"><r.Icon /></div>
                            <div>
                              <p className="font-semibold text-sm text-gray-700">{r.label}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
                            <IconLock className="w-3.5 h-3.5" />
                            <span>Soon</span>
                          </div>
                        </div>
                      )
                    }

                    /* ── Active: Europe / Spain ── */
                    return (
                      <Link key={r.label} href={r.href}
                        className="relative flex items-center justify-between px-6 py-4 hover:bg-amber-50/80 transition-colors group border-l-[3px] border-[#F5A623] bg-amber-50/40 overflow-hidden">
                        {/* Subtle pulse bg */}
                        <div className="absolute inset-0 bg-[#F5A623]/[0.06] animate-pulse pointer-events-none" />

                        <div className="relative flex items-center gap-4">
                          {/* Icon with pulsing ring */}
                          <div className="relative flex-shrink-0">
                            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm ring-2 ring-[#F5A623] ring-offset-1">
                              <r.Icon />
                            </div>
                            {/* Live dot */}
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                              <span className="animate-ping absolute h-full w-full rounded-full bg-[#F5A623] opacity-75" />
                              <span className="relative flex h-4 w-4 rounded-full bg-[#F5A623] border-2 border-white items-center justify-center shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              </span>
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm text-[#0B1F4D]">{r.label}</p>
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-[#F5A623] text-[#0B1F4D] px-2 py-0.5 rounded-full shadow-sm">
                                <span className="w-1 h-1 rounded-full bg-[#0B1F4D] animate-pulse" />
                                LIVE · SPAIN
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">🇪🇸 Spain · Málaga · Mediterranean</p>
                          </div>
                        </div>

                        <div className="relative flex items-center gap-2 flex-shrink-0">
                          <span className="hidden sm:block text-xs font-extrabold text-[#F5A623] animate-pulse">Start here</span>
                          <div className="w-8 h-8 rounded-full bg-[#0B1F4D] group-hover:bg-[#F5A623] flex items-center justify-center transition-colors shadow-sm">
                            <IconChevronRight className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t">
                  <Link
                    href="/marketplace"
                    className="flex items-center justify-center gap-2 text-[#0B1F4D] text-sm font-semibold hover:text-blue-700 transition-colors"
                  >
                    <IconSearch className="w-4 h-4" />
                    {t('home.browse_all')}
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
            {STATS_T.map(({ value, label }, i) => (
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
          SHOP NAVIGATION — Online / B2B / Trade (industries live on region pages)
      ══════════════════════════════════════════════════════════════════ */}
      <IndustryExplorer mode="shops" />

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
              <p className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest mb-2">{t('home.region_title')}</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t('home.region_heading')}</h2>
              <p className="text-blue-300 mt-2 text-sm max-w-md">{t('home.region_subtitle')}</p>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#F5A623] hover:text-[#fbb93a] transition-colors flex-shrink-0"
            >
              {t('home.region_view_all')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Guide callout */}
          <div className="flex items-center gap-3 mb-6 bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-2xl px-5 py-3">
            <span className="flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute h-3 w-3 rounded-full bg-[#F5A623] opacity-75" />
              <span className="relative h-3 w-3 rounded-full bg-[#F5A623]" />
            </span>
            <p className="text-sm font-bold text-[#F5A623]">
              🇪🇸 Spain · Europe is now live — <span className="font-extrabold underline">Start exploring →</span>
            </p>
            <span className="ml-auto text-xs text-[#F5A623]/60 font-semibold whitespace-nowrap">More regions coming soon</span>
          </div>

          {/* Region cards grid — 2 large + 3 small */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large cards: Middle East (locked) + Europe (active) */}
            {[
              { id: 'middle-east', name: 'Middle East', tagline: 'From historic souks to gleaming skylines', img: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=900&q=80', countries: 6, active: false },
              { id: 'europe',      name: 'Europe',      tagline: '🇪🇸 Spain · Málaga · Mediterranean trade hub', img: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=900&q=80', countries: 5, active: true  },
            ].map((r) => {
              if (!r.active) {
                return (
                  <div key={r.id}
                    className="group relative rounded-2xl overflow-hidden shadow-xl bg-gray-800 cursor-not-allowed sm:col-span-1">
                    <div className="relative h-56 sm:h-64 lg:h-72">
                      <Image src={r.img} alt={r.name} fill
                        className="object-cover grayscale saturate-0 opacity-60"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                      <div className="absolute inset-0 bg-black/60" />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                        <IconLock className="w-7 h-7 text-white/80" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-extrabold text-lg">{r.name}</p>
                        <span className="inline-block mt-1 text-[11px] font-bold text-white/60 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }

              /* ── Active: Europe ── */
              return (
                <Link key={r.id} href={`/regions/${r.id}`}
                  className="group relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gray-800 sm:col-span-1 ring-2 ring-[#F5A623] ring-offset-2 ring-offset-[#0B1F4D]">
                  <div className="relative h-56 sm:h-64 lg:h-72">
                    <Image src={r.img} alt={r.name} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>
                  {/* Pulsing "Start Here" badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#F5A623] text-[#0B1F4D] text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0B1F4D] animate-ping" />
                    START HERE · SPAIN
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-white font-extrabold text-xl">{r.name}</h3>
                        <p className="text-white/70 text-xs mt-1 leading-snug max-w-[220px]">{r.tagline}</p>
                        <p className="text-[#F5A623] text-xs font-bold mt-2">{r.countries} countries · Open now</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#F5A623] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg className="w-4 h-4 text-[#0B1F4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Small cards: Asia, Africa, Americas — all locked */}
            <div className="flex flex-col gap-4">
              {[
                { id: 'asia',     name: 'Asia',     tagline: 'The engine of global manufacturing', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=700&q=80' },
                { id: 'africa',   name: 'Africa',   tagline: 'A continent of rising markets',       img: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=700&q=80' },
                { id: 'americas', name: 'Americas', tagline: 'Vast markets coast to coast',         img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=700&q=80' },
              ].map((r) => (
                <div key={r.id}
                  className="relative rounded-2xl overflow-hidden shadow-lg flex-1 cursor-not-allowed bg-gray-800">
                  <div className="relative h-32 sm:h-36">
                    <Image src={r.img} alt={r.name} fill
                      className="object-cover grayscale saturate-0 opacity-50"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    <div className="absolute inset-0 bg-black/55" />
                  </div>
                  <div className="absolute inset-0 flex items-center px-5">
                    <div className="flex-1">
                      <h3 className="text-white/70 font-extrabold text-base">{r.name}</h3>
                      <p className="text-white/40 text-[11px] mt-0.5">{r.tagline}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                      <IconLock className="w-3.5 h-3.5 text-white/60" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 text-[10px] font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                    Soon
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS — modern animated feature showcase
      ══════════════════════════════════════════════════════════════════ */}
      <HomeFeatures />

      {/* ══════════════════════════════════════════════════════════════════
          FACTORIES & ZONES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest mb-2">{t('home.factories_label')}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">{t('home.factories_title')}</h2>
            <p className="text-gray-400 mt-3 text-sm">
              {t('home.factories_subtitle')} <span className="text-[#F5A623] font-bold">TTAI EMA</span>
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
                        {t('home.factories_verified')}
                      </div>
                      {s.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{s.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {[t('common.wholesale'), t('common.export_tag'), t('common.b2b')].map((tag) => (
                          <span key={tag} className="text-[11px] bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#F5A623] group-hover:gap-2 transition-all">
                        <IconFactory className="w-3.5 h-3.5" />
                        {t('home.factories_view')}
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
              {t('home.factories_cta')}
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
                {t('home.cta_label')}
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight">
                {t('home.cta_title_1')}<br className="hidden sm:block" />
                <span className="text-[#F5A623]"> {t('home.cta_title_2')}</span>
              </h2>
              <p className="text-blue-200 max-w-xl mx-auto text-base leading-relaxed">
                {t('home.cta_subtitle')}
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
                <p className="text-base font-black">{t('home.join_supplier')}</p>
                <p className="text-xs font-normal text-[#0B1F4D]/70 mt-1">{t('home.join_supplier_sub')}</p>
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
                <p className="text-base font-black">{t('home.browse_market')}</p>
                <p className="text-xs font-normal text-blue-200 mt-1">{t('home.browse_market_sub')}</p>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-blue-300">
              {messages.home.social_proof.map((proof, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {proof}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRICING / MEMBERSHIP
      ══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 px-4 bg-white border-t border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-[#F5A623] text-xs font-black uppercase tracking-widest mb-3">Membership</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D] mb-3">Pay for the chain you reach</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Each plan unlocks a deeper link in the supply chain — from suppliers, to distributors, to factories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((p, i) => (
              <Reveal key={p.tier} delay={i * 80} from="up">
                <div className={`relative rounded-3xl bg-white p-6 h-full flex flex-col border transition-all duration-300 ${
                  p.highlight ? 'border-transparent shadow-2xl ring-2 ring-[#7c3aed]' : 'border-gray-100 shadow-md hover:shadow-xl'
                }`}>
                  {p.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7c3aed] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">
                      Most popular
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.accent }} />
                    <h3 className="text-lg font-extrabold text-[#0B1F4D]">{p.name}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-4 min-h-[32px]">{p.tagline}</p>
                  <div className="flex items-end gap-1 mb-5">
                    <span className="text-3xl font-extrabold text-[#0B1F4D]">{p.price}</span>
                    {p.period && <span className="text-gray-400 text-xs mb-1">{p.period}</span>}
                  </div>
                  <ul className="space-y-2 flex-1">
                    {p.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `${p.accent}1a`, color: p.accent }}>
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-8 py-3.5 text-sm font-bold hover:bg-[#162d6e] transition-colors">
              See full pricing &amp; what each role unlocks
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TRUST BAR
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto">
          <p className="text-center text-xs font-black uppercase tracking-widest text-[#F5A623] mb-10">{t('home.trust_label')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {([
              { Icon: IconShield, color: 'bg-blue-50 text-blue-600' },
              { Icon: IconGlobe,  color: 'bg-green-50 text-green-600' },
              { Icon: IconLock,   color: 'bg-purple-50 text-purple-600' },
              { Icon: IconPhone,  color: 'bg-orange-50 text-orange-600' },
            ] as const).map(({ Icon, color }, i) => (
              <Reveal key={i} delay={i * 90} from="up">
                <div className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 h-full">
                  <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-[#0B1F4D] text-sm mb-2">{TRUST_CARDS[i]?.label}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{TRUST_CARDS[i]?.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
