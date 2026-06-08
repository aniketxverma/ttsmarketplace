/**
 * Multi-unit purchasing math. One product is sold by piece / box / pallet /
 * truck; pallet & truck totals are DERIVED so nothing is duplicated:
 *   units_per_pallet = units_per_carton × cartons_per_pallet
 *   units_per_truck  = units_per_pallet × pallets_per_truck
 */

export type PurchaseUnit = 'piece' | 'box' | 'pallet' | 'truck'

export interface PackagingProduct {
  price_cents: number
  retail_price_cents?: number | null
  units_per_carton?: number | null
  cartons_per_pallet?: number | null
  pallets_per_truck?: number | null
  price_per_box_cents?: number | null
  price_per_pallet_cents?: number | null
  price_per_truck_cents?: number | null
  sell_piece?: boolean | null
  sell_box?: boolean | null
  sell_pallet?: boolean | null
  sell_truck?: boolean | null
  // Minimum order quantity per tier (number of that unit).
  min_order_qty?: number | null   // End-user / piece tier
  min_box_qty?: number | null
  min_pallet_qty?: number | null
  min_truck_qty?: number | null
  // Optional per-tier volume discount (% off the wholesale base, used when no
  // explicit tier price is set).
  box_discount_pct?: number | null
  pallet_discount_pct?: number | null
  truck_discount_pct?: number | null
}

export const unitsPerPallet  = (p: PackagingProduct) => (p.units_per_carton ?? 0) * (p.cartons_per_pallet ?? 0)
export const cartonsPerTruck  = (p: PackagingProduct) => (p.cartons_per_pallet ?? 0) * (p.pallets_per_truck ?? 0)
export const unitsPerTruck    = (p: PackagingProduct) => unitsPerPallet(p) * (p.pallets_per_truck ?? 0)

/** Pieces contained in one of the given purchase unit. */
export function piecesIn(p: PackagingProduct, u: PurchaseUnit): number {
  switch (u) {
    case 'piece':  return 1
    case 'box':    return p.units_per_carton ?? 0
    case 'pallet': return unitsPerPallet(p)
    case 'truck':  return unitsPerTruck(p)
  }
}

/** Cartons contained in one of the given purchase unit. */
export function cartonsIn(p: PackagingProduct, u: PurchaseUnit): number {
  switch (u) {
    case 'piece':  return 0
    case 'box':    return 1
    case 'pallet': return p.cartons_per_pallet ?? 0
    case 'truck':  return cartonsPerTruck(p)
  }
}

/**
 * Price (cents) for ONE of the given unit.
 *   piece  → the end-user / RETAIL price (highest). A single unit is always retail.
 *   box/pallet/truck → wholesale: an explicit tier price if set, otherwise the
 *     wholesale base (price_cents) × pieces in that unit, minus any tier discount %.
 * (The `retail` arg is kept for call-site compatibility and no longer needed.)
 */
export function unitPrice(p: PackagingProduct, u: PurchaseUnit, _retail = false): number {
  const base = p.price_cents // wholesale base per piece — the volume reference
  const afterDisc = (cents: number, pct?: number | null) => Math.round(cents * (pct && pct > 0 ? 1 - pct / 100 : 1))
  switch (u) {
    case 'piece':  return p.retail_price_cents ?? base
    case 'box':    return p.price_per_box_cents    ?? afterDisc(base * piecesIn(p, 'box'),    p.box_discount_pct)
    case 'pallet': return p.price_per_pallet_cents ?? afterDisc(base * piecesIn(p, 'pallet'), p.pallet_discount_pct)
    case 'truck':  return p.price_per_truck_cents  ?? afterDisc(base * piecesIn(p, 'truck'),  p.truck_discount_pct)
  }
}

/** Minimum number of the given unit a buyer must order (per-tier minimum). */
export function minUnitsFor(p: PackagingProduct, u: PurchaseUnit): number {
  switch (u) {
    case 'piece':  return Math.max(1, p.min_order_qty  ?? 1)
    case 'box':    return Math.max(1, p.min_box_qty    ?? 1)
    case 'pallet': return Math.max(1, p.min_pallet_qty ?? 1)
    case 'truck':  return Math.max(1, p.min_truck_qty  ?? 1)
  }
}

/** Effective price per single piece when bought in the given unit/tier.
 *  Surfaces volume savings (e.g. €3.50 piece → €1.85 in a box). */
export function pricePerPiece(p: PackagingProduct, u: PurchaseUnit, retail = false): number {
  const pieces = piecesIn(p, u)
  return pieces > 0 ? Math.round(unitPrice(p, u, retail) / pieces) : unitPrice(p, u, retail)
}

/** True for the consumer / retail tier (sold by the piece). */
export const isRetailUnit = (u: PurchaseUnit) => u === 'piece'

/**
 * Cost basis used for the protected retail price: the BOX price per piece
 * (what the article costs when bought by the box) — retail = this + margin.
 * Falls back to the base wholesale price per piece when there's no box.
 */
export function retailCostBaseCents(p: PackagingProduct): number {
  const boxPieces = piecesIn(p, 'box')
  if (boxPieces > 0) return Math.round(unitPrice(p, 'box') / boxPieces)
  return p.price_cents
}

/** Which purchase units the product can actually be bought in. */
export function availableUnits(p: PackagingProduct): PurchaseUnit[] {
  const out: PurchaseUnit[] = []
  if (p.sell_piece) out.push('piece')
  if (p.sell_box    && piecesIn(p, 'box')    > 0) out.push('box')
  if (p.sell_pallet && piecesIn(p, 'pallet') > 0) out.push('pallet')
  if (p.sell_truck  && piecesIn(p, 'truck')  > 0) out.push('truck')
  return out
}

export const UNIT_LABEL: Record<PurchaseUnit, string> = {
  piece: 'Piece', box: 'Box', pallet: 'Pallet', truck: 'Truck',
}

/**
 * Which purchase units each shop sells in:
 *   online (TTAI Retail Store, end users)      → Piece + Box
 *   market (TTAIEMA Marketplace, everything)   → Piece + Box + Pallet + Truck
 *   b2b    (B2B Wholesale Hub, wholesalers)    → Box + Pallet + Truck (bulk, no single piece)
 * Role-gating still applies on top (e.g. consumers only ever see Piece), so the
 * larger units are only ever exposed to distributors/factories/admin.
 * Anything else / direct visit → undefined (all units the product offers).
 */
export function unitsForShop(shop?: string | null): PurchaseUnit[] | undefined {
  switch (shop) {
    case 'online': return ['piece', 'box']
    case 'market': return ['piece', 'box', 'pallet', 'truck']
    case 'b2b':    return ['box', 'pallet', 'truck']
    default:       return undefined
  }
}

/** Combine two unit constraints (shop ∩ role). undefined means "no constraint". */
export function intersectUnits(a?: PurchaseUnit[], b?: PurchaseUnit[]): PurchaseUnit[] | undefined {
  if (!a) return b
  if (!b) return a
  return a.filter(u => b.includes(u))
}
