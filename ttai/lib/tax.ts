/**
 * VAT / tax determination engine (pure, client + server safe).
 *
 * Implements the checkout tax logic:
 *   1. customer type (B2C vs B2B)   2. customer country   3. VAT number
 *   4. applicable rule              5. rate to apply
 *
 * Treatments:
 *   standard        — normal VAT (B2C, or domestic B2B)
 *   reverse_charge  — domestic special category (e.g. mobiles) B2B
 *   intra_community — EU cross-border B2B with valid VAT number (no VAT)
 *   export          — buyer outside the EU (no VAT)
 *   exempt          — VAT disabled
 */

export type TaxTreatment = 'standard' | 'reverse_charge' | 'intra_community' | 'export' | 'exempt'

/** EU member-state ISO-3166 alpha-2 codes. */
export const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
])

/** Standard VAT rates by country (fallback when no admin override). */
export const EU_VAT_RATES: Record<string, number> = {
  ES: 21, DE: 19, FR: 20, IT: 22, NL: 21, PT: 23, BE: 21, IE: 23, AT: 20,
  PL: 23, SE: 25, DK: 25, FI: 24, GR: 24, LU: 17,
}

/** Basic VAT-number format check (CC + 8–12 alphanumerics). Real VIES check is a future enhancement. */
export function isValidVatFormat(vat?: string | null): boolean {
  if (!vat) return false
  return /^[A-Z]{2}[A-Z0-9]{8,12}$/i.test(vat.replace(/[\s-]/g, ''))
}

export interface TaxInput {
  sellerCountry: string            // ISO2, e.g. 'ES'
  buyerCountry?: string | null     // ISO2 from shipping address / account
  buyerVatNumber?: string | null
  isBusiness: boolean              // B2B vs B2C
  reverseChargeCategory?: boolean  // product/category flagged special (e.g. mobiles)
  config: { vatEnabled: boolean; defaultRatePct: number; euReverseCharge: boolean }
}

export interface TaxResult {
  ratePct: number
  treatment: TaxTreatment
  reason: string
}

export function determineTax(input: TaxInput): TaxResult {
  const { config } = input
  if (!config.vatEnabled) return { ratePct: 0, treatment: 'exempt', reason: 'VAT disabled' }

  const seller = (input.sellerCountry || 'ES').toUpperCase()
  const buyer = (input.buyerCountry || seller).toUpperCase()
  const hasValidVat = isValidVatFormat(input.buyerVatNumber)
  const sellerEU = EU_COUNTRIES.has(seller)
  const buyerEU = EU_COUNTRIES.has(buyer)
  const rate = config.defaultRatePct || EU_VAT_RATES[seller] || 21

  // Domestic B2B special category (e.g. mobile phones) → reverse charge.
  if (input.reverseChargeCategory && input.isBusiness && hasValidVat && seller === buyer) {
    return { ratePct: 0, treatment: 'reverse_charge', reason: 'Domestic reverse charge (special category)' }
  }
  // Export outside the EU → no VAT.
  if (sellerEU && !buyerEU) {
    return { ratePct: 0, treatment: 'export', reason: 'Export outside the EU — no VAT' }
  }
  // EU cross-border B2B with a valid VAT number → intra-community reverse charge.
  if (config.euReverseCharge && input.isBusiness && hasValidVat && sellerEU && buyerEU && seller !== buyer) {
    return { ratePct: 0, treatment: 'intra_community', reason: 'Intra-community B2B supply — reverse charge' }
  }
  // Otherwise standard VAT (B2C, or domestic B2B).
  return { ratePct: rate, treatment: 'standard', reason: `Standard VAT ${rate}%` }
}

/** Map an internal treatment to the values allowed by the invoices.vat_treatment column. */
export function invoiceTreatment(t: TaxTreatment): 'standard' | 'reverse_charge' | 'oss' | 'export' {
  if (t === 'intra_community') return 'reverse_charge'
  if (t === 'reverse_charge') return 'reverse_charge'
  if (t === 'export') return 'export'
  return 'standard'
}
