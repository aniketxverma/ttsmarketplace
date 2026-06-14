// One master product, many supplier offers.
// Each supplier's `products` row is an "offer"; we group by master_product_id and
// rank offers so the marketplace shows ONE listing led by the best offer.

const TIER_RANK: Record<string, number> = { GOLD: 0, SILVER: 1, BRONZE: 2, UNVERIFIED: 3 }

/** A supplier offer as rendered in the "Available Sellers" comparison table. */
export type Seller = {
  productId: string
  slug: string
  href: string
  productPriceCents: number
  shippingCents: number | null
  totalCents: number
  currency: string
  condition: string | null
  region: string | null
  customsNote: string
  customsOk: boolean
  deliveryDays: number | null
  leadTime: string | null
  stock: number
  city: string | null
  country: string | null
  flag: string
  supplierName: string
  verified: boolean
  premium: boolean
  tierLabel: string
  whatsapp: string | null
  brandSlug: string | null
  nearby: boolean
}

export interface OfferLike {
  id: string
  price_cents: number
  master_product_id?: string | null
  stock_qty?: number | null
  delivery_days?: number | null
  reliability_tier?: string | null
  /** Supplier country (name or ISO) — used for "nearest" ranking. */
  country?: string | null
  /** Used to auto-merge the same product from different suppliers. */
  name?: string | null
  ean?: string | null
}

export interface SortOpts {
  /** Buyer's country (name or ISO). Offers from the same country rank higher (tie of price). */
  buyerCountry?: string | null
}

function sameCountry(offer?: string | null, buyer?: string | null) {
  if (!offer || !buyer) return false
  return offer.trim().toLowerCase() === buyer.trim().toLowerCase()
}

/**
 * Rank supplier offers by the marketplace priority:
 *   1. Best price          (lowest price_cents)
 *   2. Nearest supplier     (same country as the buyer, when known)
 *   3. Fastest delivery     (lowest delivery_days)
 *   4. Premium suppliers    (GOLD → SILVER → BRONZE → UNVERIFIED)
 *   5. In stock             (stocked offers before out-of-stock)
 */
export function sortOffers<T extends OfferLike>(offers: T[], opts: SortOpts = {}): T[] {
  const buyer = opts.buyerCountry
  return offers.slice().sort((a, b) => {
    const pa = a.price_cents ?? Number.MAX_SAFE_INTEGER
    const pb = b.price_cents ?? Number.MAX_SAFE_INTEGER
    if (pa !== pb) return pa - pb
    if (buyer) {
      const na = sameCountry(a.country, buyer) ? 0 : 1
      const nb = sameCountry(b.country, buyer) ? 0 : 1
      if (na !== nb) return na - nb
    }
    const da = a.delivery_days ?? 999
    const db = b.delivery_days ?? 999
    if (da !== db) return da - db
    const ta = TIER_RANK[a.reliability_tier ?? 'UNVERIFIED'] ?? 3
    const tb = TIER_RANK[b.reliability_tier ?? 'UNVERIFIED'] ?? 3
    if (ta !== tb) return ta - tb
    const sa = (a.stock_qty ?? 0) > 0 ? 0 : 1
    const sb = (b.stock_qty ?? 0) > 0 ? 0 : 1
    return sa - sb
  })
}

export function bestOffer<T extends OfferLike>(offers: T[], opts: SortOpts = {}): T | null {
  return offers.length ? sortOffers(offers, opts)[0] : null
}

/** Grouping key: an explicit master link wins; otherwise the same barcode (EAN)
 *  or the same normalized name collapses the same product from different
 *  suppliers into ONE listing — so the shop never shows duplicates. */
function groupKey(r: OfferLike): string {
  if (r.master_product_id) return 'm:' + r.master_product_id
  const ean = (r.ean ?? '').replace(/\s/g, '')
  if (ean.length >= 8) return 'e:' + ean
  const name = (r.name ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (name) return 'n:' + name
  return 'id:' + r.id
}

/**
 * Collapse a flat product list so the same product (by master link, barcode or
 * name) becomes a single representative (the best offer), annotated with how
 * many suppliers offer it. Genuinely unique products pass through untouched.
 */
export function dedupeByMaster<T extends OfferLike>(
  rows: T[],
): (T & { _offerCount?: number; _masterId?: string })[] {
  const groups = new Map<string, T[]>()
  for (const r of rows) {
    const k = groupKey(r)
    const g = groups.get(k)
    if (g) g.push(r); else groups.set(k, [r])
  }

  const out: (T & { _offerCount?: number; _masterId?: string })[] = []
  for (const group of Array.from(groups.values())) {
    if (group.length === 1) { out.push(group[0]); continue }
    const rep = bestOffer(group)!
    out.push({ ...(rep as any), _offerCount: group.length, _masterId: rep.master_product_id ?? undefined })
  }
  return out
}
