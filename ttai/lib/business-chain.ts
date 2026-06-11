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

import type { PurchaseUnit } from '@/lib/packaging'

export type ChainLevel = 'consumer' | 'retail' | 'distributor' | 'supplier' | 'factory' | 'admin'

const FACTORY_TYPES     = ['Manufacturer', 'Brand Owner', 'OEM Producer']
const DISTRIBUTOR_TYPES = ['Distributor', 'Trader / Wholesaler', 'Export Agent', 'Wholesaler', 'Importer']

/** Derive the supply-chain level of a viewer from their profile. Anonymous = consumer. */
export function chainLevel(role?: string | null, businessType?: string | null): ChainLevel {
  if (!role) return 'consumer'
  if (role === 'admin') return 'admin'

  if (role === 'supplier') {
    if (businessType && FACTORY_TYPES.includes(businessType)) return 'factory'        // makes products
    if (businessType && DISTRIBUTOR_TYPES.includes(businessType)) return 'distributor' // moves at scale
    return 'supplier' // wholesalers / traders / generic suppliers
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
  // Distributor — moves products at scale, sources from suppliers/factories
  distributor: { onlineShop: true, b2b: true,  supplierDirectory: true,  factoryProfiles: true,  wholesalePricing: true  },
  // Supplier — wholesales products, sources from factories
  supplier:    { onlineShop: true, b2b: true,  supplierDirectory: true,  factoryProfiles: true,  wholesalePricing: true  },
  // Factory — sells through the ecosystem to suppliers & distributors
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

// ─────────────────────────────────────────────────────────────────────────────
// Membership tier — gates the MATCHMAKING directory (who you are presented).
//
// The marketplace presents each client its counterpart in the chain, and how
// far it can reach is decided by what it pays (admin-granted `profiles.tier`):
//
//   • Shop / retail          standard → Suppliers · pro → +Distributors · full → +Factories
//   • Supplier / Distributor any paid → Factories  (their counterpart)
//   • Factory                any paid → Suppliers & Distributors (their counterpart)
//
//   `canSeeB2B` (above) stays the consumer↔business privacy line; the tier logic
//   below governs *directory discovery* only.
// ─────────────────────────────────────────────────────────────────────────────

export type Tier = 'free' | 'standard' | 'pro' | 'full'
const TIER_RANK: Record<Tier, number> = { free: 0, standard: 1, pro: 2, full: 3 }

/** Numeric rank of a tier (free = 0 … full = 3). Unknown → 0. */
export function tierRank(tier?: string | null): number {
  return TIER_RANK[(tier as Tier)] ?? 0
}

// ── Free vs paid sales channel ───────────────────────────────────────────────
// Each business sells on ONE channel for free, decided by its type:
//   • Retail businesses (sales points / shops) → free RETAIL shop.
//   • Everyone else (factory / manufacturer / supplier / distributor) → free B2B.
// Selling on the OTHER channel (or both) requires a paid plan.
export type SalesChannel = 'wholesale' | 'retail'
const RETAIL_BUSINESS_TYPES = new Set([
  'retail', 'retailer', 'retail_shop', 'sales_point', 'salespoint', 'shop', 'store', 'point_of_sale',
])
export function freeSalesChannel(businessType?: string | null): SalesChannel {
  return businessType && RETAIL_BUSINESS_TYPES.has(businessType.toLowerCase().replace(/\s+/g, '_'))
    ? 'retail'
    : 'wholesale'
}

/** Which directory bucket a *business/listing* belongs to, for presentation. */
export type EntityKind = 'factory' | 'distributor' | 'supplier'

const DISTRIBUTOR_ONLY = ['Distributor', 'Importer', 'Export Agent']
const SUPPLIER_TYPES   = ['Wholesaler', 'Trader / Wholesaler', 'Supplier']

/** Classify a business into factory / distributor / supplier for the directory. */
export function entityKind(role?: string | null, businessType?: string | null): EntityKind {
  // Explicit business types win.
  if (businessType && FACTORY_TYPES.includes(businessType)) return 'factory'
  if (businessType && DISTRIBUTOR_ONLY.includes(businessType)) return 'distributor'
  if (businessType && SUPPLIER_TYPES.includes(businessType)) return 'supplier'
  if (role === 'broker') return 'distributor'
  // Everyone else (incl. generic "Company" suppliers) lands in the Suppliers
  // directory — the default first link of the chain. Only an explicit factory
  // or distributor business type moves a listing out of Suppliers.
  return 'supplier'
}

export interface DirectoryAccess {
  suppliers: boolean     // may browse the Suppliers directory
  distributors: boolean  // may browse the Distributors directory
  factories: boolean     // may browse the Factories directory
}

/** What counterpart directories a viewer may browse, by chain level + paid tier.
 *
 *  Client rule — each level has ONE direct (free) relationship; reaching any
 *  OTHER level requires a paid plan:
 *    • Factory  ↔ Supplier
 *    • Distributor ↔ Retail
 *    • Retail   ↔ End user
 *  Everything else is paid (r >= 1). */
export function directoryAccess(level: ChainLevel, tier?: string | null): DirectoryAccess {
  const r = tierRank(tier)
  const paid = r >= 1
  switch (level) {
    case 'admin':
      return { suppliers: true, distributors: true, factories: true }
    case 'consumer':
      return { suppliers: false, distributors: false, factories: false }
    case 'retail':
      // Direct = Distributors (free). Suppliers & Factories require payment.
      return { suppliers: paid, distributors: true, factories: paid }
    case 'distributor':
      // Direct = Retail (downstream, no directory). Source upstream → pay.
      return { suppliers: paid, distributors: false, factories: paid }
    case 'supplier':
      // Direct = Factories (free). Distributors require payment.
      return { suppliers: false, distributors: paid, factories: true }
    case 'factory':
      // Direct = Suppliers (free). Distributors require payment.
      return { suppliers: true, distributors: paid, factories: false }
  }
}

/** Convenience: directory access straight from a viewer's profile fields. */
export function accessFor(
  role?: string | null, businessType?: string | null, tier?: string | null,
): DirectoryAccess {
  return directoryAccess(chainLevel(role, businessType), tier)
}

// ─────────────────────────────────────────────────────────────────────────────
// Role-based purchase rights (access structure):
//   End user      → Piece only (retail PVP)
//   Retail shop   → Piece + Box (retail + B2B)
//   Distributor   → Box + Pallet + Truck (wholesale / bulk)
//   Supplier/Factory/Admin → all units
// ─────────────────────────────────────────────────────────────────────────────

export function unitsForRole(level: ChainLevel): PurchaseUnit[] | undefined {
  switch (level) {
    case 'consumer':    return ['piece']
    case 'retail':      return ['piece', 'box']
    case 'distributor': return ['box', 'pallet', 'truck']
    case 'factory':
    case 'admin':
    default:            return undefined // all available units
  }
}

/** The three browsable directories (excludes the `watch` meta field). */
export type DirectoryBucket = 'suppliers' | 'distributors' | 'factories'

/** Can this viewer browse a listing of the given kind, at their tier? */
export function canBrowseEntity(
  kind: EntityKind, role?: string | null, businessType?: string | null, tier?: string | null,
): boolean {
  return accessFor(role, businessType, tier)[`${kind === 'factory' ? 'factories' : kind + 's'}` as DirectoryBucket]
}
