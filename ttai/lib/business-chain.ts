/**
 * Business-chain visibility model.
 *
 * The marketplace is a PRIVATE, role-based ecosystem (not Amazon/Alibaba).
 * Each participant only sees the part of the supply chain relevant to them:
 *
 *   Factory → Supplier / Distributor → Retail Shop → End Customer
 *
 * A viewer's "chain level" is derived from their role + business type, and a
 * visibility matrix decides what they can see (B2B, supplier/factory directories,
 * wholesale pricing, the consumer Online Shop, etc.).
 */

export type ChainLevel = 'consumer' | 'retail' | 'distributor' | 'factory' | 'admin'

const FACTORY_TYPES     = ['Manufacturer', 'Brand Owner', 'OEM Producer']
const DISTRIBUTOR_TYPES = ['Distributor', 'Trader / Wholesaler', 'Export Agent', 'Wholesaler', 'Importer']

/** Derive the supply-chain level of a viewer from their profile. Anonymous = consumer. */
export function chainLevel(role?: string | null, businessType?: string | null): ChainLevel {
  if (!role) return 'consumer'
  if (role === 'admin') return 'admin'

  if (role === 'supplier') {
    if (businessType && DISTRIBUTOR_TYPES.includes(businessType)) return 'distributor'
    return 'factory' // manufacturers, brand owners, OEM — top of the chain
  }
  if (role === 'broker') return 'distributor' // intermediary — sources from factories, supplies retail

  if (role === 'business_client') {
    if (businessType && (DISTRIBUTOR_TYPES.includes(businessType))) return 'distributor'
    return 'retail'
  }
  // buyer (and anything else) = retail shop buying inside the B2B ecosystem
  return 'retail'
}

interface Visibility {
  onlineShop: boolean        // consumer retail marketplace
  b2b: boolean               // wholesale B2B listings
  supplierDirectory: boolean // can browse suppliers / distributors
  factoryProfiles: boolean   // can see factory/manufacturer profiles
  wholesalePricing: boolean  // can see B2B/wholesale prices, MOQ, bulk terms
}

const MATRIX: Record<ChainLevel, Visibility> = {
  // End customer — only the consumer Online Shop
  consumer:    { onlineShop: true, b2b: false, supplierDirectory: false, factoryProfiles: false, wholesalePricing: false },
  // Retail shop — buys from suppliers/distributors/factories to stock & resell
  retail:      { onlineShop: true, b2b: true,  supplierDirectory: true,  factoryProfiles: true,  wholesalePricing: true  },
  // Supplier/Distributor — sources from factories
  distributor: { onlineShop: true, b2b: true,  supplierDirectory: true,  factoryProfiles: true,  wholesalePricing: true  },
  // Factory — sells through the ecosystem to distributors & suppliers
  factory:     { onlineShop: true, b2b: true,  supplierDirectory: true,  factoryProfiles: true,  wholesalePricing: true  },
  // Admin — full visibility
  admin:       { onlineShop: true, b2b: true,  supplierDirectory: true,  factoryProfiles: true,  wholesalePricing: true  },
}

export function visibilityFor(level: ChainLevel): Visibility {
  return MATRIX[level]
}

/** Convenience: can this viewer see B2B / wholesale content? (everyone except pure consumers) */
export function canSeeB2B(role?: string | null, businessType?: string | null): boolean {
  return visibilityFor(chainLevel(role, businessType)).b2b
}
