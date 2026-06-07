/**
 * Marketplace pricing-protection rules (pure, client + server safe).
 *
 * To keep the market healthy and stop suppliers undercutting retailers, the
 * end-user (retail) price can never fall below the wholesale price plus a
 * minimum margin (default +30%). Tax (VAT) is applied on top for display.
 *
 *   floor = wholesale × (1 + minMargin%)
 *   final = max(retail, floor) × (1 + vat%)   (vat only when enabled)
 */

export const DEFAULT_MIN_MARGIN_PCT = 30
export const DEFAULT_VAT_PCT = 21 // Spain national VAT

export interface PricingConfig {
  minMarginPct: number
  vatPct: number
  vatEnabled: boolean
}

export const DEFAULT_PRICING: PricingConfig = {
  minMarginPct: DEFAULT_MIN_MARGIN_PCT,
  vatPct: DEFAULT_VAT_PCT,
  vatEnabled: true,
}

/** Minimum allowed retail price = wholesale + minimum margin. */
export function minRetailCents(wholesaleCents: number, marginPct = DEFAULT_MIN_MARGIN_PCT): number {
  if (!wholesaleCents || wholesaleCents <= 0) return 0
  return Math.round(wholesaleCents * (1 + marginPct / 100))
}

/** Add VAT to a price. Returns the input unchanged when vat is 0/disabled. */
export function addVatCents(cents: number, vatPct: number): number {
  if (!vatPct || vatPct <= 0) return cents
  return Math.round(cents * (1 + vatPct / 100))
}

/**
 * Protected retail price (pre-VAT): never below wholesale + min margin.
 * An empty/zero retail price falls back to the floor (auto-calculated).
 */
export function protectedRetailCents(
  retailCents: number | null | undefined,
  wholesaleCents: number,
  marginPct = DEFAULT_MIN_MARGIN_PCT,
): number {
  const floor = minRetailCents(wholesaleCents, marginPct)
  const r = retailCents && retailCents > 0 ? retailCents : floor
  return Math.max(r, floor)
}
