import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, BadgeCheck } from 'lucide-react'

export interface ShopCardData {
  id: string
  legal_name: string
  trade_name: string | null
  logo_url: string | null
  brand_slug: string | null
  reliability_tier: string | null
  tagline?: string | null
  country_name?: string | null
  business_type?: string | null
  categories?: string[]
  product_count?: number
}

const TIER: Record<string, { label: string; cls: string }> = {
  GOLD:       { label: 'Gold Verified',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  SILVER:     { label: 'Verified',          cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  BRONZE:     { label: 'Bronze Verified',   cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  UNVERIFIED: { label: 'Supplier',          cls: 'bg-gray-50 text-gray-500 border-gray-200' },
}

const BIZ_LABEL: Record<string, string> = {
  factory: 'Factory', manufacturer: 'Manufacturer', supplier: 'Supplier',
  distributor: 'Distributor', retail: 'Retail Shop', retailer: 'Retail Shop',
  service: 'Service Provider', service_provider: 'Service Provider',
}

export function ShopCard({ shop }: { shop: ShopCardData }) {
  const name = shop.trade_name ?? shop.legal_name
  const href = `/brand/${shop.brand_slug ?? shop.id}`
  const tier = TIER[shop.reliability_tier ?? 'UNVERIFIED'] ?? TIER.UNVERIFIED
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const biz = shop.business_type ? (BIZ_LABEL[shop.business_type.toLowerCase()] ?? shop.business_type) : null

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#0B1F4D]/20 transition-all duration-200 p-5 flex flex-col">
      <div className="flex items-start gap-3.5">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 bg-[#0B1F4D] flex items-center justify-center">
          {shop.logo_url
            ? <Image src={shop.logo_url} alt={name} width={64} height={64} className="object-cover w-full h-full" />
            : <span className="text-white font-extrabold text-lg">{initials}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-[#0B1F4D] text-base leading-tight truncate">{name}</h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.cls}`}>
              <BadgeCheck className="w-3 h-3" /> {tier.label}
            </span>
            {biz && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0B1F4D]/5 text-[#0B1F4D]">{biz}</span>}
          </div>
        </div>
      </div>

      {shop.tagline && <p className="text-[13px] text-gray-500 mt-3 line-clamp-2 leading-snug">{shop.tagline}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-400">
        {shop.country_name && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {shop.country_name}</span>}
        {shop.product_count != null && <span>{shop.product_count} products</span>}
      </div>

      {shop.categories && shop.categories.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {shop.categories.slice(0, 3).map((c) => (
            <span key={c} className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{c}</span>
          ))}
        </div>
      )}

      <Link href={href}
        className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-[#0B1F4D] hover:bg-[#16306b] text-white py-2.5 text-sm font-bold transition-colors group-hover:gap-2.5">
        View Shop <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
