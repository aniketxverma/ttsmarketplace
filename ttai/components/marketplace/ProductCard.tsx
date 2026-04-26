import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { MarketplaceContext, ReliabilityTier } from '@/types/domain'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price_cents: number
    currency_code: string
    min_order_qty: number
    marketplace_context: MarketplaceContext
    vat_rate?: number | null
  }
  supplier: {
    legal_name: string
    trade_name: string | null
    reliability_tier: ReliabilityTier
  }
  mainImageUrl?: string
  href: string
}

const TIER_STYLES: Record<ReliabilityTier, string> = {
  UNVERIFIED: 'bg-muted text-muted-foreground',
  BRONZE:     'bg-amber-100 text-amber-800',
  SILVER:     'bg-slate-100 text-slate-700',
  GOLD:       'bg-yellow-100 text-yellow-800 shadow-sm shadow-yellow-200',
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency, minimumFractionDigits: 2 }).format(cents / 100)
}

export function ProductCard({ product, supplier, mainImageUrl, href }: ProductCardProps) {
  const isRetail = product.marketplace_context === 'retail'
  const displayPrice = isRetail && product.vat_rate
    ? product.price_cents + Math.round(product.price_cents * product.vat_rate / 100)
    : product.price_cents

  const displayName = supplier.trade_name ?? supplier.legal_name

  return (
    <Link href={href} className="group block">
      <div className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square relative bg-muted overflow-hidden">
          {mainImageUrl ? (
            <Image
              src={mainImageUrl}
              alt={product.name}
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
        </div>

        <div className="p-3 space-y-2">
          <p className="text-xs text-muted-foreground truncate">{displayName}</p>
          <h3 className="font-medium text-sm leading-tight line-clamp-2">{product.name}</h3>

          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-sm">{formatPrice(displayPrice, product.currency_code)}</span>
              {isRetail ? (
                <span className="text-xs text-muted-foreground ml-1">inc. VAT</span>
              ) : (
                <span className="text-xs text-muted-foreground ml-1">ex. VAT</span>
              )}
            </div>
            {!isRetail && (
              <span className="text-xs bg-muted rounded px-1.5 py-0.5 whitespace-nowrap">
                MOQ: {product.min_order_qty}
              </span>
            )}
          </div>

          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', TIER_STYLES[supplier.reliability_tier])}>
            {supplier.reliability_tier}
          </span>
        </div>
      </div>
    </Link>
  )
}
