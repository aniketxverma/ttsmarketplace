'use client'

import Link from 'next/link'
import {
  UtensilsCrossed, SprayCan, Sparkles, Cpu, Recycle, HeartPulse,
  Building2, Car, Shirt, Truck, Factory, Briefcase,
  ArrowRight, Store, ShoppingBag, Globe,
} from 'lucide-react'

type Sub = { name: string; slug: string }
type Industry = { name: string; slug: string; Icon: typeof Factory; color: string; image: string; subs: Sub[] }

const INDUSTRIES: Industry[] = [
  { name: 'Food & Beverage', slug: 'food-beverage', Icon: UtensilsCrossed, color: '#16a34a',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', subs: [
    { name: 'Agriculture', slug: 'agriculture' }, { name: 'Livestock', slug: 'livestock' },
    { name: 'Fisheries & Aquaculture', slug: 'fisheries-aquaculture' }, { name: 'Food Manufacturers', slug: 'food-manufacturers' },
    { name: 'Beverage Manufacturers', slug: 'beverage-manufacturers' }, { name: 'Suppliers', slug: 'food-suppliers' },
    { name: 'Distributors', slug: 'food-distributors' }, { name: 'Supermarkets', slug: 'supermarkets' },
    { name: 'Restaurants', slug: 'restaurants' }, { name: 'Hotels', slug: 'hotels' }, { name: 'Catering', slug: 'catering' },
    { name: 'Organic / Halal', slug: 'organic-food' }, { name: 'Cold Chain', slug: 'cold-chain-logistics' }, { name: 'Recycling', slug: 'food-recycling' },
  ]},
  { name: 'Cleaning & Household', slug: 'cleaning-household', Icon: SprayCan, color: '#2563eb',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80', subs: [
    { name: 'Cleaning Products', slug: 'cleaning-products' }, { name: 'Industrial Cleaning', slug: 'industrial-cleaning' },
    { name: 'Household Cleaning', slug: 'household-cleaning' }, { name: 'Tissue & Paper', slug: 'tissue-paper-products' },
    { name: 'Disposable Products', slug: 'disposable-products' }, { name: 'Cleaning Equipment', slug: 'cleaning-equipment' },
    { name: 'Eco-Friendly', slug: 'eco-friendly-cleaning' }, { name: 'Suppliers', slug: 'cleaning-suppliers' },
    { name: 'Distributors', slug: 'cleaning-distributors' }, { name: 'Recycling', slug: 'cleaning-recycling' },
  ]},
  { name: 'Personal Care', slug: 'personal-care', Icon: Sparkles, color: '#9333ea',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80', subs: [
    { name: 'Cosmetics', slug: 'cosmetics' }, { name: 'Perfumes', slug: 'perfumes' }, { name: 'Hair Care', slug: 'hair-care' },
    { name: 'Skin Care', slug: 'skin-care' }, { name: 'Personal Hygiene', slug: 'personal-hygiene' }, { name: 'Baby Care', slug: 'baby-care' },
    { name: 'Professional Beauty', slug: 'professional-beauty' }, { name: 'Organic Cosmetics', slug: 'organic-cosmetics' },
    { name: 'Halal Cosmetics', slug: 'halal-cosmetics' }, { name: 'Suppliers', slug: 'personalcare-suppliers' },
  ]},
  { name: 'Electronics & Tech', slug: 'electronics-tech', Icon: Cpu, color: '#475569',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80', subs: [
    { name: 'Smartphones', slug: 'smartphones' }, { name: 'Computers', slug: 'computers' }, { name: 'Networking', slug: 'networking' },
    { name: 'Telecommunications', slug: 'telecommunications' }, { name: 'Software', slug: 'software' }, { name: 'AI Solutions', slug: 'ai-solutions' },
    { name: 'Components', slug: 'electronic-components' }, { name: 'Consumer Electronics', slug: 'consumer-electronics' },
    { name: 'Refrigerators', slug: 'refrigerators' }, { name: 'Washing Machines', slug: 'washing-machines' }, { name: 'Air Conditioners', slug: 'air-conditioners' },
  ]},
  { name: 'Recycling & Sustainability', slug: 'recycling-sustainability', Icon: Recycle, color: '#059669',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80', subs: [
    { name: 'Plastic Recycling', slug: 'plastic-recycling' }, { name: 'Metal Recycling', slug: 'metal-recycling' }, { name: 'Glass Recycling', slug: 'glass-recycling' },
    { name: 'Paper Recycling', slug: 'paper-recycling' }, { name: 'Waste Management', slug: 'waste-management' }, { name: 'Renewable Energy', slug: 'renewable-energy' },
    { name: 'Water Treatment', slug: 'water-treatment' }, { name: 'Circular Economy', slug: 'circular-economy' },
  ]},
  { name: 'Healthcare & Medical', slug: 'healthcare-medical', Icon: HeartPulse, color: '#e11d48',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80', subs: [
    { name: 'Clinics', slug: 'clinics' }, { name: 'Hospitals', slug: 'hospitals' }, { name: 'Laboratories', slug: 'laboratories' },
    { name: 'Medical Devices', slug: 'medical-devices' }, { name: 'Rehabilitation', slug: 'rehabilitation' }, { name: 'Telemedicine', slug: 'telemedicine' },
  ]},
  { name: 'Construction & Building', slug: 'construction-building', Icon: Building2, color: '#d97706',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80', subs: [] },
  { name: 'Automotive', slug: 'automotive', Icon: Car, color: '#52525b',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80', subs: [] },
  { name: 'Textile & Fashion', slug: 'textile-fashion', Icon: Shirt, color: '#db2777',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80', subs: [] },
  { name: 'Logistics & Supply Chain', slug: 'logistics-supply-chain', Icon: Truck, color: '#0891b2',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80', subs: [] },
  { name: 'Industrial & Manufacturing', slug: 'industrial-manufacturing', Icon: Factory, color: '#4f46e5',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', subs: [] },
  { name: 'Consulting & Services', slug: 'consulting-services', Icon: Briefcase, color: '#0d9488',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80', subs: [
    { name: 'Business Consulting', slug: 'business-consulting' }, { name: 'Financial Consulting', slug: 'financial-consulting' },
    { name: 'Marketing', slug: 'marketing-services' }, { name: 'Legal Services', slug: 'legal-services' },
    { name: 'HR Services', slug: 'hr-services' }, { name: 'Training', slug: 'training-services' },
  ]},
]

const SHOPS = [
  { name: 'Shop Online', desc: 'Retail & direct purchases — buy by the piece, shipped to you.', href: '/store', Icon: ShoppingBag, gradient: 'from-purple-600 to-violet-800', tag: 'Retail' },
  { name: 'Shop B2B', desc: 'Manufacturers, suppliers, distributors & wholesalers.', href: '/b2b', Icon: Store, gradient: 'from-[#0B1F4D] to-[#1a3a7a]', tag: 'Wholesale' },
  { name: 'Shop Trade', desc: 'Import / export & international business opportunities.', href: '/marketplace', Icon: Globe, gradient: 'from-amber-500 to-orange-600', tag: 'Global' },
]

export function IndustryExplorer({
  mode = 'full', region = null,
}: {
  /** 'full' = shops + industries · 'shops' = shop cards only · 'industries' = industries only */
  mode?: 'full' | 'shops' | 'industries'
  /** When set, category links carry &region= so results stay scoped to the chosen region */
  region?: string | null
}) {
  const catHref = (slug: string) => `/marketplace?category=${slug}${region ? `&region=${region}` : ''}`
  const showShops = mode === 'full' || mode === 'shops'
  const showIndustries = mode === 'full' || mode === 'industries'

  return (
    <section className="py-20 sm:py-24 px-4 bg-[#F7F8FA]">
      <div className="container mx-auto max-w-6xl">

        {/* ── Shop navigation ── */}
        {showShops && (<>
        <div className="text-center mb-10">
          <p className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest mb-2">How would you like to trade?</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">Choose your marketplace</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-20">
          {SHOPS.map((s) => (
            <Link key={s.name} href={s.href}
              className={`group relative rounded-3xl overflow-hidden bg-gradient-to-br ${s.gradient} p-6 sm:p-7 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300`}>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
              <div className="relative flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                  <s.Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold bg-white/15 border border-white/20 px-2.5 py-1 rounded-full uppercase tracking-wide">{s.tag}</span>
              </div>
              <h3 className="relative text-xl font-extrabold mb-1.5">{s.name}</h3>
              <p className="relative text-sm text-white/70 leading-relaxed mb-5">{s.desc}</p>
              <span className="relative inline-flex items-center gap-1.5 text-sm font-extrabold group-hover:gap-2.5 transition-all">
                Enter <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
        </>)}

        {/* ── Industries ── */}
        {showIndustries && (<>
        <div className="text-center mb-10">
          <p className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest mb-2">Explore by industry</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">12 industries, one ecosystem</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">From production to distribution and recycling — discover suppliers, manufacturers and distributors in every sector.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {INDUSTRIES.map((ind) => (
            <Link key={ind.slug} href={catHref(ind.slug)}
              className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
              <div className="relative h-36 sm:h-44">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ind.image} alt={ind.name} loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                {/* Icon badge */}
                <div className="absolute top-2.5 left-2.5 w-9 h-9 rounded-xl flex items-center justify-center shadow-md backdrop-blur-sm"
                  style={{ background: `${ind.color}e6` }}>
                  <ind.Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-3.5">
                <h3 className="text-white font-extrabold text-sm sm:text-base leading-tight">{ind.name}</h3>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#F5A623]">
                  {ind.subs.length > 0 ? `${ind.subs.length} subcategories` : 'Explore'}
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
        </>)}
      </div>
    </section>
  )
}
