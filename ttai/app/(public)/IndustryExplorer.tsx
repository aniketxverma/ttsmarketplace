'use client'

import Link from 'next/link'
import {
  UtensilsCrossed, SprayCan, Sparkles, Cpu, Recycle, HeartPulse,
  Building2, Car, Shirt, Truck, Factory, Briefcase, Refrigerator, Smartphone,
  ArrowRight, Store, ShoppingBag, Globe,
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
  { name: 'Textile & Fashion', slug: 'textile-fashion', Icon: Shirt, color: '#db2777', subs: [
    { name: 'Garment Manufacturing', slug: 'garment-manufacturing' }, { name: 'Fabrics & Materials', slug: 'fabrics-materials' },
    { name: 'Fashion Accessories', slug: 'fashion-accessories' }, { name: 'Footwear', slug: 'footwear' },
    { name: 'Sportswear', slug: 'sportswear' }, { name: 'Uniforms & Workwear', slug: 'uniforms-workwear' },
    { name: 'Luxury Fashion', slug: 'luxury-fashion' }, { name: 'Textile Machinery', slug: 'textile-machinery' },
    { name: 'Home Textiles', slug: 'home-textiles' }, { name: 'Sustainable Textiles', slug: 'sustainable-textiles' },
  ]},
  { name: 'Logistics & Supply Chain', slug: 'logistics-supply-chain', Icon: Truck, color: '#0891b2', subs: [
    { name: 'Freight Forwarding', slug: 'freight-forwarding' }, { name: 'Warehousing', slug: 'warehousing' },
    { name: 'Transportation', slug: 'transportation' }, { name: 'Shipping Services', slug: 'shipping-services' },
    { name: 'Customs Clearance', slug: 'customs-clearance' }, { name: 'Cold Chain Logistics', slug: 'logistics-cold-chain' },
    { name: 'Fulfillment Services', slug: 'fulfillment-services' }, { name: 'Supply Chain Management', slug: 'supply-chain-management' },
    { name: 'Cargo Handling', slug: 'cargo-handling' }, { name: 'Last Mile Delivery', slug: 'last-mile-delivery' },
  ]},
  { name: 'Industrial & Manufacturing', slug: 'industrial-manufacturing', Icon: Factory, color: '#4f46e5', subs: [
    { name: 'Industrial Machinery', slug: 'industrial-machinery' }, { name: 'CNC & Automation', slug: 'cnc-automation' },
    { name: 'Robotics', slug: 'robotics' }, { name: 'Metal Fabrication', slug: 'metal-fabrication' },
    { name: 'Plastic Manufacturing', slug: 'plastic-manufacturing' }, { name: 'Packaging Machinery', slug: 'packaging-machinery' },
    { name: 'Production Equipment', slug: 'production-equipment' }, { name: 'Factory Solutions', slug: 'factory-solutions' },
    { name: 'Industrial Components', slug: 'industrial-components' }, { name: 'Engineering Services', slug: 'engineering-services' },
  ]},
  { name: 'Consulting & Services', slug: 'consulting-services', Icon: Briefcase, color: '#0d9488', subs: [
    { name: 'Business Consulting', slug: 'business-consulting' }, { name: 'Financial Services', slug: 'financial-services' },
    { name: 'Legal Services', slug: 'legal-services' }, { name: 'Marketing Services', slug: 'marketing-services' },
    { name: 'IT Services', slug: 'it-services' }, { name: 'HR & Recruitment', slug: 'hr-recruitment' },
    { name: 'Project Management', slug: 'project-management' }, { name: 'Training & Education', slug: 'training-education' },
    { name: 'Certification Services', slug: 'certification-services' }, { name: 'Business Development', slug: 'business-development' },
  ]},
  { name: 'Home Appliances & Consumer Goods', slug: 'home-appliances', Icon: Refrigerator, color: '#0ea5e9', subs: [
    { name: 'Major Appliances', slug: 'major-appliances' }, { name: 'Small Appliances', slug: 'small-appliances' },
    { name: 'Kitchen Appliances', slug: 'kitchen-appliances' }, { name: 'Coffee Machines', slug: 'coffee-machines' },
    { name: 'Vacuum Cleaners', slug: 'vacuum-cleaners' }, { name: 'Air Fryers', slug: 'air-fryers' },
    { name: 'Microwaves', slug: 'microwaves' }, { name: 'Refrigerators & Freezers', slug: 'refrigerators' },
    { name: 'Washing Machines', slug: 'washing-machines' }, { name: 'Dishwashers', slug: 'dishwashers' },
    { name: 'Air Conditioners', slug: 'air-conditioners' }, { name: 'Heaters', slug: 'heaters' },
    { name: 'Fans & Air Treatment', slug: 'fans-air-treatment' }, { name: 'Smart Home Appliances', slug: 'smart-home-appliances' },
    { name: 'Outlet Appliances', slug: 'outlet-appliances' }, { name: 'Refurbished Appliances', slug: 'refurbished-appliances' },
  ]},
  { name: 'Refurbished & Graded Electronics', slug: 'refurbished-electronics', Icon: Smartphone, color: '#84cc16', subs: [
    { name: 'Grade A Devices', slug: 'refurb-grade-a' }, { name: 'Grade A+', slug: 'refurb-grade-a-plus' },
    { name: 'Grade B Devices', slug: 'refurb-grade-b' }, { name: 'Grade C Devices', slug: 'refurb-grade-c' },
    { name: 'Smartphones', slug: 'refurb-smartphones' }, { name: 'Laptops', slug: 'refurb-laptops' },
    { name: 'Tablets', slug: 'refurb-tablets' }, { name: 'Desktop Computers', slug: 'refurb-desktops' },
    { name: 'Monitors', slug: 'refurb-monitors' }, { name: 'Apple Products', slug: 'refurb-apple' },
    { name: 'Samsung Products', slug: 'refurb-samsung' }, { name: 'Networking Equipment', slug: 'refurb-networking' },
    { name: 'Accessories', slug: 'refurb-accessories' }, { name: 'Open Box Electronics', slug: 'open-box-electronics' },
    { name: 'Certified Refurbished', slug: 'certified-refurbished' },
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">{INDUSTRIES.length} industries, one ecosystem</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">From production to distribution and recycling — discover suppliers, manufacturers and distributors in every sector.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {INDUSTRIES.map((ind) => (
            <Link key={ind.slug} href={catHref(ind.slug)}
              className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
              <div className="relative h-36 sm:h-44">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/categories/${ind.slug}.jpg`} alt={ind.name} loading="lazy"
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
