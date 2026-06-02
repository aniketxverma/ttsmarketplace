import Link from 'next/link'
import Image from 'next/image'
import { Crown, ShieldCheck, Award, Store, MapPin, Package, Globe, ArrowRight, CheckCircle2 } from 'lucide-react'

export interface ShowcaseSupplier {
  id: string
  legal_name: string
  trade_name: string | null
  logo_url: string | null
  banner_image: string | null
  tagline: string | null
  reliability_tier: string | null
  brand_slug: string | null
  years_experience: number | null
  countries_served: number | null
  location?: string | null
  product_count?: number
}

const TIER: Record<string, { label: string; cls: string; dot: string; Icon: typeof Crown }> = {
  GOLD:       { label: 'Gold',     cls: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400', Icon: Crown },
  SILVER:     { label: 'Verified', cls: 'bg-slate-50 text-slate-600 border-slate-200',  dot: 'bg-slate-400', Icon: ShieldCheck },
  BRONZE:     { label: 'Bronze',   cls: 'bg-orange-50 text-orange-700 border-orange-200',dot: 'bg-orange-400',Icon: Award },
  UNVERIFIED: { label: 'Supplier', cls: 'bg-gray-50 text-gray-500 border-gray-200',     dot: 'bg-gray-300',  Icon: Store },
}

export function SupplierShowcaseCard({ supplier }: { supplier: ShowcaseSupplier }) {
  const name     = supplier.trade_name ?? supplier.legal_name
  const href     = `/brand/${supplier.brand_slug ?? supplier.id}`
  const tier     = TIER[supplier.reliability_tier ?? 'UNVERIFIED'] ?? TIER.UNVERIFIED
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] overflow-hidden">
        {supplier.banner_image && (
          <Image src={supplier.banner_image} alt="" fill className="object-cover opacity-50 group-hover:opacity-60 transition-opacity" sizes="400px" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Tier badge */}
        <span className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tier.cls}`}>
          <tier.Icon className="w-2.5 h-2.5" />{tier.label}
        </span>

        {/* Logo */}
        <div className="absolute -bottom-6 left-4">
          <div className="w-14 h-14 rounded-xl border-2 border-white shadow-md overflow-hidden bg-[#0B1F4D] flex items-center justify-center">
            {supplier.logo_url ? (
              <Image src={supplier.logo_url} alt={name} width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              <span className="text-white font-extrabold text-base">{initials}</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="pt-8 px-4 pb-4 flex-1 flex flex-col">
        <h3 className="font-extrabold text-[#0B1F4D] text-sm leading-tight truncate group-hover:text-[#162d6e]">{name}</h3>
        {supplier.tagline && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mt-0.5 flex-1">{supplier.tagline}</p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 mt-3">
          {supplier.product_count != null && (
            <span className="flex items-center gap-1"><Package className="w-3 h-3" />{supplier.product_count} products</span>
          )}
          {supplier.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{supplier.location}</span>
          )}
          {(supplier.countries_served ?? 0) > 0 && (
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{supplier.countries_served} countries</span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#0B1F4D] group-hover:gap-2 flex items-center gap-1 transition-all">
            View Store <ArrowRight className="w-3.5 h-3.5" />
          </span>
          <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />Verified
          </span>
        </div>
      </div>
    </Link>
  )
}
