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
    period: '/mo',
    tagline: 'Perfect for new businesses starting online.',
    bestFor: 'New businesses',
    accent: '#64748b',
    features: [
      'Verified business profile',
      'Up to 10 products',
      '1 sales channel (B2B or retail)',
      'Basic company page',
      'Receive buyer enquiries',
      'Regional marketplace visibility',
      'Basic contact form',
    ],
  },
  {
    tier: 'standard',
    name: 'Business',
    price: '€79',
    period: '/mo',
    tagline: 'Designed for active businesses ready to grow.',
    bestFor: 'Growing businesses',
    accent: '#2563eb',
    highlight: true,
    features: [
      'Everything in Free',
      'Unlimited products',
      'Excel product import',
      'B2B or retail channel',
      'Marketplace messaging system',
      'WhatsApp contact button',
      'Company banner',
      'Custom company background',
      'Company video presentation',
      'Logistics hub access',
      'Buyer & supplier enquiries',
      'Product categories management',
      'Basic marketing exposure',
      'Business verification badge',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '€199',
    period: '/mo',
    tagline: 'For distributors, wholesalers and international traders.',
    bestFor: 'Distributors & traders',
    accent: '#7c3aed',
    features: [
      'Everything in Business',
      'B2B + retail channels together',
      'Full supplier network access',
      'Distributor network access',
      'Direct supplier connections',
      'Priority search ranking',
      'Featured supplier badge',
      'Premium company design',
      'Advanced branding options',
      'Warehouse network access',
      'Sales team support',
      'Multi-country visibility',
      'International matchmaking',
      'Business consulting access',
      'Premium marketing exposure',
      'WhatsApp offer notifications',
      'International trade opportunities',
      'Import & export support',
    ],
  },
]

/**
 * Flagship programs — TTAI ON.
 *   • Business Expansion Package (€8,500): Logistics (€3,500) + Business Dev (€5,000).
 *   • The Fair (up to €35,000, by application): trade-fair & expansion program.
 * Both are high-touch — enquiries by email to info@ttaiema.com.
 */
export interface Flagship {
  id: string
  name: string
  subtitle: string
  fee: string            // headline number/word in the price box
  feePeriod: string      // e.g. '/year'
  feeLabel?: string      // label under the price (default 'Program fee')
  feeNote?: string       // e.g. 'By application'
  valueNote: string      // headline badge
  tagline: string
  cta?: string           // CTA button label (default 'Talk to our team')
  highlights?: { title: string; desc: string }[]                 // optional callouts
  packages?: { title: string; value: string; items: string[] }[] // sub-packages
  included?: string[]
  includedLabel?: string
  fairs?: string[]
  support?: string[]
  supportLabel?: string
  who?: string[]         // "Who is this for"
  benefits?: string[]
  benefitsLabel?: string
  includesNote?: string
  disclaimer: string
  accent: string
}

export const FLAGSHIPS: Flagship[] = [
  {
    id: 'business-expansion',
    name: 'TTAI ON — Business Expansion Package',
    subtitle: 'International Business Growth & Market Entry Program',
    fee: '€8,500',
    feePeriod: '',
    feeLabel: 'Total package value',
    feeNote: 'In 4 installments of €2,125',
    valueNote: 'Logistics + Business Development',
    tagline: 'For companies seeking international growth, new distribution channels, strategic partnerships and market expansion through the TTAIEMA ecosystem.',
    cta: 'Request the package',
    accent: '#F5A623',
    packages: [
      {
        title: 'Logistics & Operations Package',
        value: '€3,500',
        items: [
          'Logistics hub access',
          'Warehouse network access',
          'Supplier verification support',
          'Product inspection coordination',
          'Import & export guidance',
          'Distribution planning',
          'Logistics partner connections',
          'Business documentation support',
          'Shipping & fulfilment coordination',
          'International trade support',
        ],
      },
      {
        title: 'TTAIEMA Business Development Package',
        value: '€5,000',
        items: [
          'International business consulting',
          'Marketplace premium access',
          'Distributor search',
          'Partner search',
          'Buyer & supplier matching',
          'Business networking',
          'Sales team support',
          'Market entry strategy',
          'Business development planning',
          'Marketing & promotion support',
          'Access to selected TTAIEMA projects',
          'Franchise & distribution opportunities',
        ],
      },
    ],
    who: [
      'Manufacturers', 'Importers', 'Exporters', 'Distributors', 'Wholesalers',
      'Retail chains', 'Franchise operators', 'International traders', 'Technology companies',
    ],
    benefits: [
      'Faster market entry',
      'Access to new distribution channels',
      'International partner network',
      'Reduced expansion costs',
      'Increased sales opportunities',
      'Professional business support',
      'Logistics & commercial assistance',
    ],
    benefitsLabel: 'Business benefits',
    disclaimer: 'Participation, consulting services, logistics support and business development activities are subject to project scope, availability and agreed business objectives.',
  },
  {
    id: 'the-fair',
    name: 'TTAI ON — The Fair',
    subtitle: 'International Business Expansion & Trade Fair Program',
    fee: '€35,000',
    feePeriod: '',
    feeLabel: 'Up to · program value',
    feeNote: 'By application',
    valueNote: 'International fairs & expansion',
    tagline: 'A premium international business development program to expand into new markets through consulting, trade fairs, logistics, networking, sales support and strategic partnerships.',
    cta: 'Apply for Consultation',
    accent: '#C9A84C',
    included: [
      'International business consulting',
      'Trade fair access & support',
      'Distributor & partner search',
      'Logistics & warehouse network',
      'Sales team assistance',
      'International expansion strategy',
      'Supplier & buyer connections',
      'Marketplace marketing support',
      'Access to selected TTAIEMA projects',
      'Franchise & distribution opportunities',
      'Import & export support',
    ],
    includedLabel: 'What makes it different',
    fairs: [
      'IFA Berlin (Germany)',
      'GITEX Global (Dubai)',
      'Mobile World Congress (Barcelona)',
      'International trade fairs in Spain',
      'International trade fairs in Italy',
      'European business exhibitions',
      'Selected international business events',
    ],
    support: [
      'Business development support',
      'Market entry consulting',
      'International partner search',
      'Distributor network development',
      'Product & service promotion',
      'Shared exhibition stand opportunities',
      'Business matchmaking services',
      'Project evaluation & growth planning',
    ],
    supportLabel: 'Premium benefits',
    who: [
      'Manufacturers', 'Distributors', 'Importers', 'Exporters', 'Retail chains',
      'Startups', 'Technology companies', 'International traders', 'Investors & business developers',
    ],
    disclaimer: 'Up to €35,000 depending on project scope, business objectives and participation level. Participation, consulting services, trade fair opportunities and project access are subject to availability, project scope and agreed business objectives.',
  },
]

/** What each *role* is presented at a paid tier — the directional model. */
export const PRESENTED_BY_ROLE: { role: string; presented: string }[] = [
  { role: 'Shop / Retailer',          presented: 'Suppliers → Distributors → Factories (by plan)' },
  { role: 'Supplier / Distributor',   presented: 'Factories (their counterpart)' },
  { role: 'Factory / Manufacturer',   presented: 'Suppliers & Distributors (their counterpart)' },
  { role: 'End customer',             presented: 'Online Shop only (dropship)' },
]
