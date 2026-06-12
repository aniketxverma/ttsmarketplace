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
  bestFor: string      // one-line "who it's for"
  features: string[]
  highlight?: boolean  // visually featured ("Most popular")
  accent: string       // tailwind-ish hex for the accent
}

export const PLANS: Plan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '€0',
    period: 'forever',
    tagline: 'List your business and start getting found — no card needed.',
    bestFor: 'New businesses setting up',
    accent: '#64748b',
    features: [
      'Verified business profile & branded page',
      'One sales channel free (B2B or retail)',
      'Appear in regional & category discovery',
      'Receive buyer enquiries through Canales',
      'Browse the consumer Online Shop',
    ],
  },
  {
    tier: 'standard',
    name: 'Standard',
    price: '€49',
    period: '/mo',
    tagline: 'Unlock your first trading partner and real wholesale pricing.',
    bestFor: 'Shops & buyers ready to source',
    accent: '#2563eb',
    features: [
      'Everything in Free',
      'Reach the next link in your supply chain',
      'See wholesale prices, MOQ & bulk terms',
      'Message & request quotes directly',
      'Sell on both channels — B2B + retail',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '€99',
    period: '/mo',
    tagline: 'Reach deeper into the chain and get seen before everyone else.',
    bestFor: 'Growing businesses scaling sourcing',
    accent: '#7c3aed',
    highlight: true,
    features: [
      'Everything in Standard',
      'Browse the full Distributors network',
      'Priority placement in discovery',
      'Multi-region matchmaking',
      'Featured supplier badge',
    ],
  },
  {
    tier: 'full',
    name: 'Full Pack',
    price: '€199',
    period: '/mo',
    tagline: 'The whole supply chain, factory to shelf — with a manager on call.',
    bestFor: 'Importers & high-volume traders',
    accent: '#d97706',
    features: [
      'Everything in Pro',
      'Source direct from the Factories network',
      'Top placement across every region',
      'Dedicated account manager',
      'Early access to new suppliers & deals',
    ],
  },
]

/**
 * Flagship program — TTAI ON · Business Growth.
 * Annual membership (€350/yr) delivering up to €8,500 in program value:
 * an international business-development program with hands-on support.
 * High-touch (subject to availability) → "Talk to our team" CTA.
 */
export interface Flagship {
  name: string
  subtitle: string
  fee: string          // membership fee customer pays
  feePeriod: string    // e.g. '/year'
  valueNote: string    // value anchor
  tagline: string
  included: string[]   // Included Services
  support: string[]    // Business Support
  disclaimer: string
  accent: string
}

export const FLAGSHIP: Flagship = {
  name: 'TTAI ON',
  subtitle: 'Business Growth · International Business Development Program',
  fee: '€350',
  feePeriod: '/year',
  valueNote: 'Up to €8,500 in program value',
  tagline: 'For startups, retailers, wholesalers and entrepreneurs ready to grow — with professional support, networking and real international trade opportunities.',
  accent: '#F5A623',
  included: [
    'Company registration support',
    'Marketplace access',
    'Business profile creation',
    'Logistics hub access',
    'Supplier & buyer connections',
    'Sales team support',
    'Business networking opportunities',
    'Marketplace marketing support',
    'International trade opportunities',
    'Import & export guidance',
    'Access to selected TTAIEMA projects',
  ],
  support: [
    'Business development guidance',
    'Market expansion support',
    'International partner search',
    'Product & service promotion',
    'Distribution opportunities',
    'Business matching services',
  ],
  disclaimer: 'Participation, consulting services, business opportunities and project access are subject to availability, project scope and agreed business objectives.',
}

/** What each *role* is presented at a paid tier — the directional model. */
export const PRESENTED_BY_ROLE: { role: string; presented: string }[] = [
  { role: 'Shop / Retailer',          presented: 'Suppliers → Distributors → Factories (by plan)' },
  { role: 'Supplier / Distributor',   presented: 'Factories (their counterpart)' },
  { role: 'Factory / Manufacturer',   presented: 'Suppliers & Distributors (their counterpart)' },
  { role: 'End customer',             presented: 'Online Shop only (dropship)' },
]
