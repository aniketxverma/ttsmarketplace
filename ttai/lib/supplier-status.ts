// ─────────────────────────────────────────────────────────────────────────────
// Supplier trust status — single source of truth for the public status badge.
// Resolved from suppliers.status + reliability_tier + ttaiema_protected.
//   🟢 Verified Supplier   — active, identity/business verified
//   🟡 Independent Supplier — active, listed but self-operated (not yet verified)
//   🔵 TTAIEMA Protected    — active + opted into the TTAIEMA Protected Service
//   🔴 Under Review         — pending / under review
//   ⛔ Suspended            — suspended
// ─────────────────────────────────────────────────────────────────────────────

export type SupplierStatusKey = 'verified' | 'independent' | 'protected' | 'review' | 'suspended'

export type SupplierStatusInfo = {
  key: SupplierStatusKey
  emoji: string
  label: string
  /** badge background + text */
  cls: string
  /** status dot */
  dot: string
  blurb: string
}

const STATES: Record<SupplierStatusKey, SupplierStatusInfo> = {
  verified:    { key: 'verified',    emoji: '🟢', label: 'Verified Supplier',    cls: 'bg-green-100 text-green-700',   dot: 'bg-green-500',  blurb: 'Identity & business verified by TTAIEMA.' },
  independent: { key: 'independent', emoji: '🟡', label: 'Independent Supplier', cls: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500',  blurb: 'Listed on TTAIEMA and independently operated by the company.' },
  protected:   { key: 'protected',   emoji: '🔵', label: 'TTAIEMA Protected',    cls: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500',   blurb: 'TTAIEMA manages logistics, inspection & order protection for this supplier.' },
  review:      { key: 'review',      emoji: '🔴', label: 'Under Review',         cls: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-500',   blurb: 'Verification in progress — trade with standard caution.' },
  suspended:   { key: 'suspended',   emoji: '⛔', label: 'Suspended',            cls: 'bg-gray-200 text-gray-600',     dot: 'bg-gray-500',   blurb: 'Temporarily suspended on TTAIEMA.' },
}

export function resolveSupplierStatus(input: {
  status?: string | null
  reliability_tier?: string | null
  ttaiema_protected?: boolean | null
}): SupplierStatusInfo {
  const status = (input.status ?? 'ACTIVE').toUpperCase()
  if (status === 'SUSPENDED') return STATES.suspended
  if (status === 'PENDING' || status === 'UNDER_REVIEW') return STATES.review
  if (input.ttaiema_protected) return STATES.protected
  const tier = (input.reliability_tier ?? 'UNVERIFIED').toUpperCase()
  if (tier && tier !== 'UNVERIFIED') return STATES.verified
  return STATES.independent
}

export const SUPPLIER_STATES = STATES
