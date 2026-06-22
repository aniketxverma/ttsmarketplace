import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { HOUSE_BRAND } from '@/lib/house-brand'
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

/** 2-letter ISO country code → flag emoji. */
function isoFlag(iso?: string | null) {
  return iso && iso.length === 2
    ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : ''
}

/** One card representing a product family (several variants under one type). */
export function FamilyCard({ family, retail = false, shop, brand, sponsored, minOrderCents }: { family: Family; retail?: boolean; shop?: string; brand?: string | null; sponsored?: boolean; minOrderCents?: number }) {
  const rep = family.representative
  const supplier = rep.suppliers as { legal_name: string; trade_name: string | null; reliability_tier: ReliabilityTier; countries?: { name: string; iso_code: string } | null; cities?: { name: string } | null } | undefined
  const count = family.members.length
  // Origin tag (flag · country · city) — hidden for the b2b house brand.
  const countryIso = supplier?.countries?.iso_code ?? null
  const countryName = supplier?.countries?.name ?? null
  const cityName = supplier?.cities?.name ?? null

  const isRetail = retail || rep.marketplace_context === 'retail'
  // Trade Hub (b2b) sells under the single house brand (TTAIEMA); retail & business
  // shop show the real supplier.
  const houseBrand = shop === 'b2b'
  const displayName = houseBrand ? HOUSE_BRAND.name : (supplier?.trade_name ?? supplier?.legal_name ?? '')
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
          {/* Origin country — so buyers instantly see where it ships from */}
          {!houseBrand && (countryIso || countryName) && (
            <span className={cn(
              'absolute left-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 text-gray-800 text-[10px] font-bold px-2 py-0.5 shadow',
              sponsored ? 'top-9' : 'top-2',
            )}>
              <span className="text-[12px] leading-none">{isoFlag(countryIso)}</span>
              <span className="max-w-[120px] truncate">{countryName ?? countryIso}{cityName ? ` · ${cityName}` : ''}</span>
            </span>
          )}
          {sponsored && (
            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[10px] font-extrabold px-2 py-0.5 shadow">★ Sponsored</span>
          )}
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
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground truncate">{displayName}</p>
            {brand && <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#0B1F4D] bg-[#0B1F4D]/5 px-1.5 py-0.5 rounded flex-shrink-0">{brand}</span>}
          </div>
          <h3 className="font-medium text-sm leading-tight line-clamp-2">{family.title}</h3>

          <div className="flex items-center justify-between gap-2">
            <div>
              {price > 0 ? (
                <>
                  <span className="text-xs text-muted-foreground mr-1">from</span>
                  <span className="font-semibold text-sm">{formatPrice(price, rep.currency_code)}</span>
                </>
              ) : (
                <span className="font-semibold text-sm text-violet-700">Price on request</span>
              )}
            </div>
            <span className="text-xs font-semibold text-[#0B1F4D] group-hover:underline whitespace-nowrap">
              View range →
            </span>
          </div>

          {houseBrand ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />{HOUSE_BRAND.badge}
            </span>
          ) : supplier ? (
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', TIER_STYLES[supplier.reliability_tier])}>
              {supplier.reliability_tier}
            </span>
          ) : null}
          {!isRetail && minOrderCents ? (
            <span className="ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Min. order {formatPrice(minOrderCents, rep.currency_code)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
