import Link from 'next/link'
import Image from 'next/image'

export interface MiniSupplier {
  id: string
  legal_name: string
  trade_name: string | null
  logo_url: string | null
  reliability_tier: string | null
  brand_slug: string | null
  tagline?: string | null
  product_count?: number
}

const TIER: Record<string, { label: string; cls: string; dot: string }> = {
  GOLD:       { label: 'Gold',     cls: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400' },
  SILVER:     { label: 'Verified', cls: 'bg-slate-50 text-slate-600 border-slate-200',  dot: 'bg-slate-400' },
  BRONZE:     { label: 'Bronze',   cls: 'bg-orange-50 text-orange-700 border-orange-200',dot: 'bg-orange-400' },
  UNVERIFIED: { label: 'Supplier', cls: 'bg-gray-50 text-gray-500 border-gray-200',     dot: 'bg-gray-300' },
}

export function SupplierMiniCard({ supplier }: { supplier: MiniSupplier }) {
  const name     = supplier.trade_name ?? supplier.legal_name
  const href     = supplier.brand_slug ? `/brand/${supplier.brand_slug}` : `/suppliers/${supplier.id}`
  const tier     = TIER[supplier.reliability_tier ?? 'UNVERIFIED'] ?? TIER.UNVERIFIED
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#0B1F4D]/20 hover:-translate-y-0.5 transition-all duration-200 p-3.5"
    >
      {/* Logo */}
      <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-[#0B1F4D] flex items-center justify-center">
        {supplier.logo_url ? (
          <Image src={supplier.logo_url} alt={name} width={56} height={56} className="object-cover w-full h-full" />
        ) : (
          <span className="text-white font-extrabold text-base">{initials}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-extrabold text-[#0B1F4D] text-sm truncate group-hover:text-[#162d6e]">{name}</h3>
          <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${tier.cls}`}>
            <span className={`w-1 h-1 rounded-full ${tier.dot}`} />
            {tier.label}
          </span>
        </div>
        {supplier.tagline && (
          <p className="text-[11px] text-gray-400 truncate leading-snug">{supplier.tagline}</p>
        )}
        <p className="text-[11px] font-semibold text-[#0B1F4D] mt-0.5 flex items-center gap-1 group-hover:gap-1.5 transition-all">
          {supplier.product_count != null ? `${supplier.product_count} product${supplier.product_count !== 1 ? 's' : ''}` : 'View profile'}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </p>
      </div>
    </Link>
  )
}
