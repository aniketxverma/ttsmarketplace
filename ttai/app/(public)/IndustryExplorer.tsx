'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  UtensilsCrossed, SprayCan, Sparkles, Cpu, Recycle, HeartPulse,
  Building2, Car, Shirt, Truck, Factory, Briefcase,
  ChevronDown, ArrowRight, Store, ShoppingBag, Globe,
} from 'lucide-react'

type Sub = { name: string; slug: string }
type Industry = { name: string; slug: string; Icon: typeof Factory; color: string; subs: Sub[] }

const INDUSTRIES: Industry[] = [
  { name: 'Food & Beverage', slug: 'food-beverage', Icon: UtensilsCrossed, color: '#16a34a', subs: [
    { name: 'Agriculture', slug: 'agriculture' }, { name: 'Livestock', slug: 'livestock' },
    { name: 'Fisheries & Aquaculture', slug: 'fisheries-aquaculture' }, { name: 'Food Manufacturers', slug: 'food-manufacturers' },
    { name: 'Beverage Manufacturers', slug: 'beverage-manufacturers' }, { name: 'Suppliers', slug: 'food-suppliers' },
    { name: 'Distributors', slug: 'food-distributors' }, { name: 'Supermarkets', slug: 'supermarkets' },
    { name: 'Restaurants', slug: 'restaurants' }, { name: 'Hotels', slug: 'hotels' }, { name: 'Catering', slug: 'catering' },
    { name: 'Organic / Halal', slug: 'organic-food' }, { name: 'Cold Chain', slug: 'cold-chain-logistics' }, { name: 'Recycling', slug: 'food-recycling' },
  ]},
  { name: 'Cleaning & Household', slug: 'cleaning-household', Icon: SprayCan, color: '#2563eb', subs: [
    { name: 'Cleaning Products', slug: 'cleaning-products' }, { name: 'Industrial Cleaning', slug: 'industrial-cleaning' },
    { name: 'Household Cleaning', slug: 'household-cleaning' }, { name: 'Tissue & Paper', slug: 'tissue-paper-products' },
    { name: 'Disposable Products', slug: 'disposable-products' }, { name: 'Cleaning Equipment', slug: 'cleaning-equipment' },
    { name: 'Eco-Friendly', slug: 'eco-friendly-cleaning' }, { name: 'Suppliers', slug: 'cleaning-suppliers' },
    { name: 'Distributors', slug: 'cleaning-distributors' }, { name: 'Recycling', slug: 'cleaning-recycling' },
  ]},
  { name: 'Personal Care', slug: 'personal-care', Icon: Sparkles, color: '#9333ea', subs: [
    { name: 'Cosmetics', slug: 'cosmetics' }, { name: 'Perfumes', slug: 'perfumes' }, { name: 'Hair Care', slug: 'hair-care' },
    { name: 'Skin Care', slug: 'skin-care' }, { name: 'Personal Hygiene', slug: 'personal-hygiene' }, { name: 'Baby Care', slug: 'baby-care' },
    { name: 'Professional Beauty', slug: 'professional-beauty' }, { name: 'Organic Cosmetics', slug: 'organic-cosmetics' },
    { name: 'Halal Cosmetics', slug: 'halal-cosmetics' }, { name: 'Suppliers', slug: 'personalcare-suppliers' },
  ]},
  { name: 'Electronics & Tech', slug: 'electronics-tech', Icon: Cpu, color: '#475569', subs: [
    { name: 'Smartphones', slug: 'smartphones' }, { name: 'Computers', slug: 'computers' }, { name: 'Networking', slug: 'networking' },
    { name: 'Telecommunications', slug: 'telecommunications' }, { name: 'Software', slug: 'software' }, { name: 'AI Solutions', slug: 'ai-solutions' },
    { name: 'Components', slug: 'electronic-components' }, { name: 'Consumer Electronics', slug: 'consumer-electronics' },
    { name: 'Refrigerators', slug: 'refrigerators' }, { name: 'Washing Machines', slug: 'washing-machines' }, { name: 'Air Conditioners', slug: 'air-conditioners' },
  ]},
  { name: 'Recycling & Sustainability', slug: 'recycling-sustainability', Icon: Recycle, color: '#059669', subs: [
    { name: 'Plastic Recycling', slug: 'plastic-recycling' }, { name: 'Metal Recycling', slug: 'metal-recycling' }, { name: 'Glass Recycling', slug: 'glass-recycling' },
    { name: 'Paper Recycling', slug: 'paper-recycling' }, { name: 'Waste Management', slug: 'waste-management' }, { name: 'Renewable Energy', slug: 'renewable-energy' },
    { name: 'Water Treatment', slug: 'water-treatment' }, { name: 'Circular Economy', slug: 'circular-economy' },
  ]},
  { name: 'Healthcare & Medical', slug: 'healthcare-medical', Icon: HeartPulse, color: '#e11d48', subs: [
    { name: 'Clinics', slug: 'clinics' }, { name: 'Hospitals', slug: 'hospitals' }, { name: 'Laboratories', slug: 'laboratories' },
    { name: 'Medical Devices', slug: 'medical-devices' }, { name: 'Rehabilitation', slug: 'rehabilitation' }, { name: 'Telemedicine', slug: 'telemedicine' },
  ]},
  { name: 'Construction & Building', slug: 'construction-building', Icon: Building2, color: '#d97706', subs: [] },
  { name: 'Automotive', slug: 'automotive', Icon: Car, color: '#52525b', subs: [] },
  { name: 'Textile & Fashion', slug: 'textile-fashion', Icon: Shirt, color: '#db2777', subs: [] },
  { name: 'Logistics & Supply Chain', slug: 'logistics-supply-chain', Icon: Truck, color: '#0891b2', subs: [] },
  { name: 'Industrial & Manufacturing', slug: 'industrial-manufacturing', Icon: Factory, color: '#4f46e5', subs: [] },
  { name: 'Consulting & Services', slug: 'consulting-services', Icon: Briefcase, color: '#0d9488', subs: [
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

export function IndustryExplorer() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section className="py-20 sm:py-24 px-4 bg-[#F7F8FA]">
      <div className="container mx-auto max-w-6xl">

        {/* ── Shop navigation ── */}
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

        {/* ── Industries ── */}
        <div className="text-center mb-10">
          <p className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest mb-2">Explore by industry</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">12 industries, one ecosystem</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">From production to distribution and recycling — discover suppliers, manufacturers and distributors in every sector.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDUSTRIES.map((ind) => {
            const isOpen = open === ind.slug
            const hasSubs = ind.subs.length > 0
            return (
              <div key={ind.slug}
                className={`bg-white rounded-2xl border transition-all duration-300 ${isOpen ? 'border-[#0B1F4D]/20 shadow-xl sm:col-span-2 lg:col-span-3' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                {/* Header */}
                <button onClick={() => hasSubs ? setOpen(isOpen ? null : ind.slug) : undefined}
                  className="w-full flex items-center gap-4 p-4 sm:p-5 text-left">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${ind.color}, ${ind.color}cc)` }}>
                    <ind.Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-[#0B1F4D] text-base leading-tight">{ind.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{hasSubs ? `${ind.subs.length} subcategories` : 'Explore companies'}</p>
                  </div>
                  {hasSubs ? (
                    <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  ) : (
                    <Link href={`/marketplace?category=${ind.slug}`} onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 hover:bg-[#0B1F4D] flex items-center justify-center group transition-colors">
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </Link>
                  )}
                </button>

                {/* Expandable subcategories — smooth grid-rows accordion */}
                {hasSubs && (
                  <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 pt-1">
                        <div className="flex flex-wrap gap-2">
                          {ind.subs.map((sub) => (
                            <Link key={sub.slug} href={`/marketplace?category=${sub.slug}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-gray-50 text-gray-600 hover:text-white transition-colors"
                              style={{ ['--hover' as any]: ind.color }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = ind.color; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = '' }}>
                              {sub.name}
                            </Link>
                          ))}
                          <Link href={`/marketplace?category=${ind.slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-extrabold text-white"
                            style={{ background: ind.color }}>
                            View all <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
