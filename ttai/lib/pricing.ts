/**
 * Membership plans — the paid matchmaking tiers.
 *
 * These map 1:1 to `profiles.tier` (free | standard | pro | full) and to the
 * access rules in lib/business-chain.ts. Plans are activated MANUALLY by an
 * admin after onboarding/payment (no self-serve billing yet).
 */

export interface Plan {
  tier: 'free' | 'standard' | 'pro' | 'full'
  name: string
  price: string        // display price
  period: string       // e.g. '/mo'
  tagline: string
  features: string[]
  highlight?: boolean  // visually featured ("Most popular")
  accent: string       // tailwind-ish hex for the accent
}

export const PLANS: Plan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '€0',
    period: '',
    tagline: 'Get listed and explore the ecosystem.',
    accent: '#64748b',
    features: [
      'Business profile & brand page',
      'Browse the Online Shop',
      'Appear in regional discovery',
      'Receive enquiries via Canales',
    ],
  },
  {
    tier: 'standard',
    name: 'Standard',
    price: '€49',
    period: '/mo',
    tagline: 'Reach the first link in your chain.',
    accent: '#2563eb',
    features: [
      'Everything in Free',
      'Browse the Suppliers network',
      'Wholesale pricing & MOQ access',
      'Direct contact with suppliers',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '€99',
    period: '/mo',
    tagline: 'Go deeper — add distributors.',
    accent: '#7c3aed',
    highlight: true,
    features: [
      'Everything in Standard',
      'Browse the Distributors network',
      'Priority placement in discovery',
      'Multi-region matchmaking',
    ],
  },
  {
    tier: 'full',
    name: 'Full pack',
    price: '€199',
    period: '/mo',
    tagline: 'The complete supply chain, end to end.',
    accent: '#d97706',
    features: [
      'Everything in Pro',
      'Browse the Factories network',
      'Source direct from manufacturers',
      'Dedicated account manager',
    ],
  },
]

/** What each *role* is presented at a paid tier — the directional model. */
export const PRESENTED_BY_ROLE: { role: string; presented: string }[] = [
  { role: 'Shop / Retailer',          presented: 'Suppliers → Distributors → Factories (by plan)' },
  { role: 'Supplier / Distributor',   presented: 'Factories (their counterpart)' },
  { role: 'Factory / Manufacturer',   presented: 'Suppliers & Distributors (their counterpart)' },
  { role: 'End customer',             presented: 'Online Shop only (dropship)' },
]
