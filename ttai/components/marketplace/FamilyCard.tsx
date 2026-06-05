import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Family } from '@/lib/product-family'
import type { ReliabilityTier } from '@/types/domain'

const TIER_STYLES: Record<string, string> = {
  UNVERIFIED: 'bg-muted text-muted-foreground',
  BRONZE:     'bg-amber-100 text-amber-800',
  SILVER:     'bg-slate-100 text-slate-700',
  GOLD:       'bg-yellow-100 text-yellow-800 shadow-sm shadow-yellow-200',
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency, minimumFractionDigits: 2 }).format(cents / 100)
}

/** One card representing a product family (several variants under one type). */
export function FamilyCard({ family, retail = false, shop }: { family: Family; retail?: boolean; shop?: string }) {
  const rep = family.representative
  const supplier = rep.suppliers as { legal_name: string; trade_name: string | null; reliability_tier: ReliabilityTier } | undefined
  const displayName = supplier?.trade_name ?? supplier?.legal_name ?? ''
  const count = family.members.length

  const isRetail = retail || rep.marketplace_context === 'retail'
  // Lowest price across the family → "from €x" (retail price in the online shop).
  const priceOf = (m: typeof rep) => isRetail ? (m.retail_price_cents ?? m.price_cents) : m.price_cents
  const minCents = Math.min(...family.members.map(priceOf))
  const price = isRetail && !rep.retail_price_cents && rep.vat_rate
    ? minCents + Math.round(minCents * rep.vat_rate / 100)
    : minCents

  const shopCtx = shop ?? (retail ? 'online' : undefined)
  const href = `${family.href}${retail ? '&retail=1' : ''}${shopCtx ? `&shop=${shopCtx}` : ''}`

  return (
    <Link href={href} className="group block">
      <div className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square relative bg-muted overflow-hidden">
          {family.imageUrl ? (
            <Image
              src={family.imageUrl}
              alt={family.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Variant-count badge */}
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-[#0B1F4D] text-white text-[11px] font-bold px-2 py-1 rounded-full shadow">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {count} options
          </span>
        </div>

        <div className="p-3 space-y-2">
          <p className="text-xs text-muted-foreground truncate">{displayName}</p>
          <h3 className="font-medium text-sm leading-tight line-clamp-2">{family.title}</h3>

          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs text-muted-foreground mr-1">from</span>
              <span className="font-semibold text-sm">{formatPrice(price, rep.currency_code)}</span>
            </div>
            <span className="text-xs font-semibold text-[#0B1F4D] group-hover:underline whitespace-nowrap">
              View range →
            </span>
          </div>

          {supplier && (
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', TIER_STYLES[supplier.reliability_tier])}>
              {supplier.reliability_tier}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
