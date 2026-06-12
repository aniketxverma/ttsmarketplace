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
 * Flagship programs — TTAI ON.
 *   • Business Growth (€350/yr, up to €8,500 value): logistics hub + sales team.
 *   • Global Expansion (€35,000/yr, by application, bank transfer): adds a fully
 *     managed exhibitor stand at international fairs (IFA, GITEX…).
 * Both are high-touch — shown for now, enquiries by email to info@ttaiema.com.
 */
export interface Flagship {
  id: string
  name: string
  subtitle: string
  fee: string            // headline fee customer pays
  feePeriod: string      // e.g. '/year'
  feeLabel?: string      // label under the price (default 'Program fee')
  feeNote?: string       // e.g. 'By application'
  valueNote: string      // headline benefit badge
  tagline: string
  highlights: { title: string; desc: string }[]  // the "special letter" callouts
  included?: string[]    // Included Services
  fairs?: string[]       // Trade Fair Program
  support?: string[]     // Business Support / Premium Benefits
  supportLabel?: string  // section title for `support` (default 'Business support')
  includesNote?: string  // e.g. 'Includes the complete Business Growth program'
  disclaimer: string
  accent: string
}

export const FLAGSHIPS: Flagship[] = [
  {
    id: 'business-growth',
    name: 'TTAI ON — Business Growth',
    subtitle: 'International Business Development Program',
    fee: '€8,500',
    feePeriod: '',
    feeLabel: 'One-time program fee',
    feeNote: '1 year · 1 shop',
    valueNote: 'Logistics hub + sales team',
    tagline: 'For startups, retailers, wholesalers and entrepreneurs ready to grow — with professional support, networking and real international trade opportunities.',
    accent: '#F5A623',
    highlights: [
      {
        title: 'Logistics Hub — 1 full year, free',
        desc: 'Store your goods with us at no cost. Keep up to two full trucks of stock in the TTAI EMA warehouse for a whole year, ready to ship the moment orders come in — no storage fees.',
      },
      {
        title: 'Your own sales team',
        desc: 'A dedicated TTAI EMA team works for you — promoting and selling your products across our network and to international buyers, as if they were their own.',
      },
    ],
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
  },
  {
    id: 'the-fair',
    name: 'TTAI ON — The Fair',
    subtitle: 'International Business Expansion & Trade Fair Program',
    fee: '€35,000',
    feePeriod: '/year',
    feeLabel: 'Annual program fee',
    feeNote: 'By application · payment by bank transfer',
    valueNote: 'International fairs included',
    tagline: 'A premium program to expand internationally through consulting, trade fairs, logistics, networking, sales support and strategic partnerships.',
    accent: '#C9A84C',
    highlights: [
      {
        title: 'Your own stand at world fairs',
        desc: 'We design, rent and run a complete exhibitor stand for you at major international fairs such as IFA Berlin and GITEX Global. Booth, setup, logistics and shipping are handled by TTAI EMA.',
      },
      {
        title: 'Everything in Business Growth',
        desc: 'Includes the full Business Growth program — logistics hub, dedicated sales team, marketplace, networking and international trade support.',
      },
    ],
    included: [
      'International business consulting',
      'Marketplace access',
      'Logistics hub access',
      'Warehouse network access',
      'Sales team support',
      'International business networking',
      'Supplier & buyer connections',
      'Import & export support',
      'Franchise development opportunities',
      'Distribution network development',
      'Marketplace marketing support',
      'Business matchmaking services',
      'Access to selected TTAIEMA projects',
    ],
    fairs: [
      'IFA Berlin (Germany)',
      'GITEX Global (Dubai)',
      'Mobile World Congress (Barcelona)',
      'International trade fairs in Spain',
      'International trade fairs in Italy',
      'European business exhibitions',
    ],
    support: [
      'Business development support',
      'International expansion strategy',
      'Market entry consulting',
      'Partner & distributor search',
      'Access to shared exhibition stand opportunities',
      'Project evaluation & growth planning',
    ],
    supportLabel: 'Premium benefits',
    disclaimer: 'Participation, consulting services, trade fair opportunities and project access are subject to availability, project scope and agreed business objectives.',
  },
]

/** What each *role* is presented at a paid tier — the directional model. */
export const PRESENTED_BY_ROLE: { role: string; presented: string }[] = [
  { role: 'Shop / Retailer',          presented: 'Suppliers → Distributors → Factories (by plan)' },
  { role: 'Supplier / Distributor',   presented: 'Factories (their counterpart)' },
  { role: 'Factory / Manufacturer',   presented: 'Suppliers & Distributors (their counterpart)' },
  { role: 'End customer',             presented: 'Online Shop only (dropship)' },
]
