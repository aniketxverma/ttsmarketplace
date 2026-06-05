/**
 * Plan-based SELLING permissions (seller monetization).
 *
 * A supplier's plan decides which units they may sell by. Locked units stay
 * VISIBLE in the product form with an "Upgrade to …" call-to-action — we never
 * hide them, to drive plan upgrades.
 *
 *   Standard            → Box + Pallet
 *   Business Prime (pro) → Box + Pallet + Truck
 *   TTAIEMA Online Shop (full) → Piece + Box + Pallet + Truck  (direct to consumers)
 *
 * (free is the entry level: Box only.)
 */

import { tierRank } from '@/lib/business-chain'
import type { PurchaseUnit } from '@/lib/packaging'

/** Minimum tier required to sell by each unit. */
export const UNIT_MIN_TIER: Record<PurchaseUnit, string> = {
  box:    'free',      // everyone can sell by box
  pallet: 'standard',
  truck:  'pro',       // Business Prime
  piece:  'full',      // TTAIEMA Online Shop — direct to consumers
}

/** Display name of a plan in the selling context. */
export const SELL_PLAN_LABEL: Record<string, string> = {
  free:     'Starter',
  standard: 'Standard',
  pro:      'Business Prime',
  full:     'TTAIEMA Online Shop',
}

/** Can a seller on `tier` sell by `unit`? */
export function canSellUnit(tier: string | null | undefined, unit: PurchaseUnit): boolean {
  return tierRank(tier) >= tierRank(UNIT_MIN_TIER[unit])
}

/** The units a seller on `tier` may sell by. */
export function sellableUnits(tier: string | null | undefined): PurchaseUnit[] {
  return (['piece', 'box', 'pallet', 'truck'] as PurchaseUnit[]).filter(u => canSellUnit(tier, u))
}

/** Plan a seller must upgrade to in order to sell by `unit` (label for the CTA). */
export function requiredPlanLabel(unit: PurchaseUnit): string {
  return SELL_PLAN_LABEL[UNIT_MIN_TIER[unit]] ?? 'a higher plan'
}
