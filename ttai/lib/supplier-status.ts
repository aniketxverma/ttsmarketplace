// ─────────────────────────────────────────────────────────────────────────────
// Supplier trust status — single source of truth for the public status badge.
// Resolved from suppliers.status + reliability_tier + ttaiema_protected +
// premium_partner.
//   🟢 Verified Supplier   — verified by TTAIEMA (docs/business checked)
//   🟡 Independent Supplier — listed & self-operated; TTAIEMA only provides tools
//   🔵 TTAIEMA Protected    — TTAIEMA actively involved in the transaction
//   🟠 Under Review         — being reviewed (limited functionality)
//   🔴 Suspended            — account suspended
//   🟣 Premium Partner      — strategic partner working closely with TTAIEMA
// ─────────────────────────────────────────────────────────────────────────────

export type SupplierStatusKey = 'verified' | 'independent' | 'protected' | 'review' | 'suspended' | 'premium_partner'

export type SupplierStatusInfo = {
  key: SupplierStatusKey
  emoji: string
  label: string
  /** badge background + text */
  cls: string
  /** status dot */
  dot: string
  /** short tooltip / one-liner */
  blurb: string
  /** full explanation for the legend page */
  description: string
  /** what it covers / conditions */
  details: string[]
}

const STATES: Record<SupplierStatusKey, SupplierStatusInfo> = {
  verified: {
    key: 'verified', emoji: '🟢', label: 'Verified Supplier',
    cls: 'bg-green-100 text-green-700', dot: 'bg-green-500',
    blurb: 'Verified by TTAIEMA — basic business information checked.',
    description: 'The company has been verified by TTAIEMA. We have checked basic business information. This means the company is verified, but TTAIEMA does not guarantee every transaction.',
    details: ['Company registration', 'Business details', 'Contact information', 'Basic verification documents'],
  },
  independent: {
    key: 'independent', emoji: '🟡', label: 'Independent Supplier',
    cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500',
    blurb: 'Operates independently — TTAIEMA provides the tools only.',
    description: 'The supplier operates independently. TTAIEMA only provides the company website, marketplace and business tools. The supplier is fully responsible for products, stock, delivery and customer service.',
    details: ['TTAIEMA provides: website, marketplace, business tools', 'Supplier is responsible for: products, stock, delivery, customer service'],
  },
  protected: {
    key: 'protected', emoji: '🔵', label: 'TTAIEMA Protected',
    cls: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500',
    blurb: 'TTAIEMA is actively involved in the transaction.',
    description: 'The highest level of transaction service — TTAIEMA is actively involved in the order, giving buyers additional confidence because TTAIEMA participates in the process.',
    details: ['Stock confirmation', 'Order verification', 'Inspection', 'Logistics', 'Dropshipping', 'Broker protection', 'Order management'],
  },
  review: {
    key: 'review', emoji: '🟠', label: 'Under Review',
    cls: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500',
    blurb: 'Currently under review — functionality may be limited.',
    description: 'The company is currently being reviewed. The supplier may have limited functionality until the review is completed.',
    details: ['Missing documentation', 'Customer complaint', 'Verification process', 'Temporary investigation'],
  },
  suspended: {
    key: 'suspended', emoji: '🔴', label: 'Suspended',
    cls: 'bg-red-100 text-red-700', dot: 'bg-red-500',
    blurb: 'Account suspended — cannot publish offers or receive orders.',
    description: 'The supplier account has been suspended. The supplier cannot publish new offers or receive new orders until the issue is resolved.',
    details: ['False information', 'Fraud', 'Repeated customer complaints', 'Serious policy violations'],
  },
  premium_partner: {
    key: 'premium_partner', emoji: '🟣', label: 'Premium Partner',
    cls: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500',
    blurb: 'Strategic partner working closely with TTAIEMA.',
    description: 'Reserved for strategic partners working closely with TTAIEMA, with priority ranking and dedicated support.',
    details: ['Priority ranking', 'Featured promotion', 'Marketing campaigns', 'Dedicated support', 'Business development assistance'],
  },
}

// Order shown on the legend page.
export const SUPPLIER_STATUS_ORDER: SupplierStatusKey[] = ['verified', 'independent', 'protected', 'review', 'suspended', 'premium_partner']

export function resolveSupplierStatus(input: {
  status?: string | null
  reliability_tier?: string | null
  ttaiema_protected?: boolean | null
  premium_partner?: boolean | null
}): SupplierStatusInfo {
  const status = (input.status ?? 'ACTIVE').toUpperCase()
  if (status === 'SUSPENDED') return STATES.suspended
  if (status === 'PENDING' || status === 'UNDER_REVIEW') return STATES.review
  if (input.premium_partner) return STATES.premium_partner
  if (input.ttaiema_protected) return STATES.protected
  const tier = (input.reliability_tier ?? 'UNVERIFIED').toUpperCase()
  if (tier && tier !== 'UNVERIFIED') return STATES.verified
  return STATES.independent
}

export const SUPPLIER_STATES = STATES
