import type { VatTreatment } from '@/types/domain'

interface VatConditionInput {
  supplierCountry: string
  buyerCountry: string
  buyerVatNumber: string | null
  marketplaceContext: 'b2b' | 'b2c'
}

const EU_COUNTRIES = new Set([
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR',
  'HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK',
])

export function determineVatTreatment(input: VatConditionInput): VatTreatment {
  const { supplierCountry, buyerCountry, buyerVatNumber, marketplaceContext } = input

  const supplierInEU = EU_COUNTRIES.has(supplierCountry)
  const buyerInEU = EU_COUNTRIES.has(buyerCountry)
  const sameCountry = supplierCountry === buyerCountry

  if (!supplierInEU || !buyerInEU) return 'export'

  if (sameCountry) return 'standard'

  if (marketplaceContext === 'b2b' && buyerVatNumber) return 'reverse_charge'

  return 'oss'
}

export function getVatRate(countryIso: string, vatRates: Record<string, number>): number {
  return vatRates[countryIso] ?? 21
}

export function calculateVat(amountCents: number, ratePct: number, treatment: VatTreatment): number {
  if (treatment === 'reverse_charge' || treatment === 'export') return 0
  return Math.round(amountCents * (ratePct / 100))
}
