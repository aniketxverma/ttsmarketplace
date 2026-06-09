// One master product, many supplier offers.
// Each supplier's `products` row is an "offer"; we group by master_product_id and
// rank offers so the marketplace shows ONE listing led by the best offer.

const TIER_RANK: Record<string, number> = { GOLD: 0, SILVER: 1, BRONZE: 2, UNVERIFIED: 3 }

export interface OfferLike {
  id: string
  price_cents: number
  master_product_id?: string | null
  stock_qty?: number | null
  delivery_days?: number | null
  reliability_tier?: string | null
}

/**
 * Rank supplier offers by the marketplace priority:
 *   1. Best price          (lowest price_cents)
 *   2. Fastest delivery     (lowest delivery_days)
 *   3. Premium suppliers    (GOLD → SILVER → BRONZE → UNVERIFIED)
 *   4. In stock             (stocked offers before out-of-stock)
 * "Nearest supplier" is applied separately when the buyer's location is known.
 */
export function sortOffers<T extends OfferLike>(offers: T[]): T[] {
  return offers.slice().sort((a, b) => {
    const pa = a.price_cents ?? Number.MAX_SAFE_INTEGER
    const pb = b.price_cents ?? Number.MAX_SAFE_INTEGER
    if (pa !== pb) return pa - pb
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

export function bestOffer<T extends OfferLike>(offers: T[]): T | null {
  return offers.length ? sortOffers(offers)[0] : null
}

/**
 * Collapse a flat product list so products sharing a master_product_id become a
 * single representative (the best offer), annotated with how many suppliers offer
 * it. Products without a master pass through untouched.
 */
export function dedupeByMaster<T extends OfferLike>(
  rows: T[],
): (T & { _offerCount?: number; _masterId?: string })[] {
  const byMaster = new Map<string, T[]>()
  const out: (T & { _offerCount?: number; _masterId?: string })[] = []

  for (const r of rows) {
    const mid = r.master_product_id
    if (mid) {
      const g = byMaster.get(mid)
      if (g) g.push(r)
      else byMaster.set(mid, [r])
    } else {
      out.push(r)
    }
  }
  for (const [mid, group] of Array.from(byMaster.entries())) {
    const rep = bestOffer(group)!
    out.push({ ...(rep as any), _offerCount: group.length, _masterId: mid })
  }
  return out
}
