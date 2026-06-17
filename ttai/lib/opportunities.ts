// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS OPPORTUNITIES — poster roles, "looking for" audiences and the default
// chain-visibility map. Single source of truth for the board, post form and the
// assistant page.
//
// Chain rule (who sees a poster's opportunity):
//   Factory     → Suppliers + Distributors   (NOT retail)
//   Supplier    → Distributors + Retail shops
//   Distributor → Retail shops
//   Retail      → Clients
// The poster can still adjust the audience, but these are the sensible defaults.
// ─────────────────────────────────────────────────────────────────────────────

export type ChainRole = 'factory' | 'supplier' | 'distributor' | 'retail' | 'client'

export const POSTER_ROLES: { key: Exclude<ChainRole, 'client'>; label: string }[] = [
  { key: 'factory',     label: 'Factory' },
  { key: 'supplier',    label: 'Supplier' },
  { key: 'distributor', label: 'Distributor' },
  { key: 'retail',      label: 'Retail Shop' },
]

export const AUDIENCES: { key: ChainRole; label: string }[] = [
  { key: 'supplier',    label: 'Suppliers' },
  { key: 'distributor', label: 'Distributors' },
  { key: 'retail',      label: 'Retail shops' },
  { key: 'client',      label: 'Clients' },
]

// Default audience for each poster role (the chain rule above).
export const DEFAULT_AUDIENCE: Record<string, ChainRole[]> = {
  factory:     ['supplier', 'distributor'],
  supplier:    ['distributor', 'retail'],
  distributor: ['retail'],
  retail:      ['client'],
}

export const LOOKING_FOR: { key: string; label: string }[] = [
  { key: 'distributor', label: 'Distributors' },
  { key: 'retail',      label: 'Retail shops / Local clients' },
  { key: 'client',      label: 'Clients / Buyers' },
  { key: 'agent',       label: 'Sales agents' },
  { key: 'importer',    label: 'Importers' },
  { key: 'supplier',    label: 'Suppliers' },
]

export function lookingForLabel(key?: string | null) {
  return LOOKING_FOR.find((l) => l.key === key)?.label ?? null
}

export const POSTER_BADGE: Record<string, string> = {
  factory:     'bg-purple-100 text-purple-700',
  supplier:    'bg-blue-100 text-blue-700',
  distributor: 'bg-amber-100 text-amber-700',
  retail:      'bg-green-100 text-green-700',
}

// Map a profile's business_type / role to a chain role so we can filter the board
// to "what this viewer is allowed to see".
export function viewerRole(businessType?: string | null, role?: string | null): ChainRole {
  const t = (businessType ?? '').toLowerCase()
  if (/factor|manufact/.test(t)) return 'factory'
  if (/distribut|wholesal/.test(t)) return 'distributor'
  if (/retail|shop|store/.test(t)) return 'retail'
  if (/suppli/.test(t)) return 'supplier'
  if (role === 'business_client' || role === 'buyer') return 'client'
  return 'supplier'
}
