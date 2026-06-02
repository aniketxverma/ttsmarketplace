export type ProjectType = 'Investment' | 'Distribution' | 'Partnership'
export type ProjectStatus = 'Open' | 'Filling Fast' | 'Closed' | 'Coming Soon'

export interface Project {
  id: string
  title: string
  subtitle: string
  type: ProjectType
  category: string
  regions: string[]
  description: string
  longDescription: string
  investment_range: string
  timeline: string
  status: ProjectStatus
  slots_total: number
  slots_filled: number
  highlights: string[]
  requirements: string[]
  gradient: string
  icon: string
  wa_message: string
}

export const PROJECTS: Project[] = [
  {
    id: 'mediterranean-distribution-2026',
    title: 'Mediterranean Distribution Pack',
    subtitle: 'Co-distribution network across North Africa',
    type: 'Distribution',
    category: 'Food & Agriculture',
    regions: ['Spain', 'Morocco', 'Algeria', 'Tunisia'],
    description: 'Join a coordinated distribution network for premium Spanish food & agriculture products across North Africa. Pool logistics, reduce costs, scale faster.',
    longDescription: `TTAI EMA is coordinating a joint distribution initiative connecting verified Spanish food & agriculture exporters with established distributors across North Africa.

Participants gain exclusive regional rights, shared logistics infrastructure, and TTAI-negotiated supplier pricing — typically 15-25% better than individual sourcing.

The pack operates on a quarterly replenishment model with collective purchasing power that unlocks factory-direct pricing from Spanish producers.`,
    investment_range: '€5,000 – €50,000',
    timeline: 'Launch Q3 2026',
    status: 'Open',
    slots_total: 10,
    slots_filled: 4,
    highlights: [
      'Exclusive regional distribution rights per country',
      'Shared cold-chain & logistics infrastructure',
      'TTAI-negotiated pricing (15-25% below market)',
      'Dedicated account manager + quarterly reviews',
      'Co-marketing support included',
    ],
    requirements: [
      'Verified TTAI account (Supplier, Broker, or Business)',
      'Minimum commitment: €5,000 initial inventory',
      'Valid import/export licence for target region',
      'Existing distribution network preferred',
    ],
    gradient: 'from-blue-600 to-blue-900',
    icon: '🌍',
    wa_message: 'Hi TTAI, I\'m interested in the Mediterranean Distribution Pack project. Please send me more details.',
  },
  {
    id: 'cleaning-private-label-2026',
    title: 'Cleaning Products Private Label',
    subtitle: 'Co-invest in private label manufacturing',
    type: 'Investment',
    category: 'Cleaning & Hygiene',
    regions: ['Spain', 'France', 'UK', 'Germany'],
    description: 'Partner with verified Spanish manufacturers to create your own private label cleaning product line. Your brand, their factory, TTAI quality assurance.',
    longDescription: `Partner with TTAI EMA and verified Spanish cleaning product manufacturers to launch your own private label product line across European markets.

Your investment buys branded, CE-certified inventory ready to sell. TTAI handles supplier vetting, production oversight, quality inspection, and logistics coordination.

MOQ starts at 1,000 units per SKU. With combined investment from project partners, smaller businesses access factory-direct pricing previously only available to large retailers.`,
    investment_range: '€10,000 – €100,000',
    timeline: 'Launch Q4 2026',
    status: 'Open',
    slots_total: 5,
    slots_filled: 1,
    highlights: [
      'Your brand on CE-certified Spanish products',
      'MOQ as low as 1,000 units per SKU',
      'Quality inspection & compliance included',
      'Dedicated brand manager',
      'EU market-ready documentation',
    ],
    requirements: [
      'Verified TTAI business or supplier account',
      'Minimum investment €10,000',
      'Brand design assets (logo, packaging guidelines)',
      'EU business registration',
    ],
    gradient: 'from-orange-500 to-red-700',
    icon: '🏭',
    wa_message: 'Hi TTAI, I\'m interested in the Cleaning Products Private Label project. Please send me more details.',
  },
  {
    id: 'africa-fresh-produce-gateway',
    title: 'Africa Fresh Produce Gateway',
    subtitle: 'Supply chain partnership for West Africa',
    type: 'Partnership',
    category: 'Food & Agriculture',
    regions: ['Nigeria', 'Ghana', 'Senegal', 'Ivory Coast'],
    description: 'TTAI EMA is establishing a fresh produce supply chain from Spain & Morocco to West African markets. Seeking local partners with existing cold-chain infrastructure.',
    longDescription: `TTAI EMA is building a structured fresh produce supply chain connecting Iberian producers with West African markets — one of the fastest-growing food import regions in the world.

This is a revenue-share partnership model. No upfront capital required. Partners contribute existing cold-chain capability and local distribution networks; TTAI provides the supply chain, technology platform, and commercial coordination.

Pilot phase targets 3 countries with expansion planned across 8 markets by 2027.`,
    investment_range: 'Revenue share — no upfront capital',
    timeline: 'Pilot Q2 2026',
    status: 'Filling Fast',
    slots_total: 6,
    slots_filled: 5,
    highlights: [
      'Revenue share — zero upfront investment',
      'Exclusive territory rights per country',
      'Full supply chain support from TTAI',
      'Technology platform & tracking included',
      'Training & onboarding provided',
    ],
    requirements: [
      'Verified TTAI Broker or Business account',
      'Existing distribution network in target country',
      'Cold chain / temperature-controlled storage',
      'Import licence for food products',
    ],
    gradient: 'from-green-600 to-emerald-900',
    icon: '🌱',
    wa_message: 'Hi TTAI, I\'m interested in the Africa Fresh Produce Gateway project. Please send me more details.',
  },
  {
    id: 'electronics-group-sourcing',
    title: 'Electronics Group Sourcing',
    subtitle: 'Pool purchasing power for better pricing',
    type: 'Distribution',
    category: 'Electronics & Technology',
    regions: ['Spain', 'Portugal', 'Italy', 'Poland'],
    description: 'Pool purchasing power with other verified buyers to unlock factory-direct pricing on electronics. Combined quarterly orders achieve 40-60% better pricing.',
    longDescription: `The Electronics Group Sourcing initiative allows verified TTAI buyers to combine their orders each quarter, reaching volume thresholds that unlock factory-direct pricing from European electronics suppliers.

Individual buyers rarely hit the MOQ needed for best-tier pricing. Through group sourcing, even SMEs access pricing previously reserved for large retailers and distributors.

Orders are aggregated quarterly. Each participant specifies their product mix and quantity. TTAI consolidates, negotiates, quality-checks, and distributes to each participant.`,
    investment_range: '€2,000 – €20,000 per quarterly cycle',
    timeline: 'Quarterly cycles — next: Q3 2026',
    status: 'Open',
    slots_total: 20,
    slots_filled: 8,
    highlights: [
      'Factory-direct pricing through collective volume',
      'Quarterly order cycles — flexible commitment',
      'Quality inspection before dispatch',
      'No long-term subscription required',
      'CE & RoHS certified products only',
    ],
    requirements: [
      'Verified TTAI Buyer or Business account',
      'Minimum €2,000 per order cycle',
      'EU import capability (VAT registered)',
    ],
    gradient: 'from-purple-600 to-violet-900',
    icon: '⚡',
    wa_message: 'Hi TTAI, I\'m interested in the Electronics Group Sourcing project. Please send me more details.',
  },
  {
    id: 'ttai-broker-network-expansion',
    title: 'TTAI Broker Network Expansion',
    subtitle: 'Become a regional TTAI trade broker',
    type: 'Partnership',
    category: 'Trade & Logistics',
    regions: ['Morocco', 'Senegal', 'Egypt', 'Turkey', 'India'],
    description: 'TTAI is expanding its broker network into new regions. Become the exclusive TTAI broker for your country and earn commission on every deal you facilitate.',
    longDescription: `TTAI EMA is expanding its broker network into high-growth trade regions across Africa, the Middle East, and South Asia.

As a regional TTAI Broker, you represent TTAI's platform and supplier network in your country. You earn commission on every deal you facilitate between suppliers and local buyers.

This is a structured partner programme — not a loose affiliate scheme. TTAI provides training, supplier access, legal templates, and ongoing commercial support.`,
    investment_range: 'Commission-based — free to join',
    timeline: 'Applications open now',
    status: 'Open',
    slots_total: 15,
    slots_filled: 3,
    highlights: [
      'Exclusive country-level broker rights',
      'Commission on every deal facilitated',
      'Full TTAI platform access',
      'Training, legal templates & commercial support',
      'Co-branded marketing materials',
    ],
    requirements: [
      'Business registration in target country',
      'Existing trade or import/export experience',
      'English proficiency (Arabic/French a bonus)',
      'Commitment to 6-month onboarding programme',
    ],
    gradient: 'from-[#0B1F4D] to-[#1a3580]',
    icon: '🤝',
    wa_message: 'Hi TTAI, I\'m interested in joining the TTAI Broker Network Expansion. Please send me more details.',
  },
]

export function getProject(id: string): Project | undefined {
  return PROJECTS.find(p => p.id === id)
}

export const TYPE_STYLES: Record<ProjectType, { badge: string; bar: string }> = {
  Investment:   { badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
  Distribution: { badge: 'bg-blue-100 text-blue-700',     bar: 'bg-blue-500'   },
  Partnership:  { badge: 'bg-green-100 text-green-700',   bar: 'bg-green-500'  },
}

export const STATUS_STYLES: Record<ProjectStatus, string> = {
  'Open':         'bg-green-100 text-green-700',
  'Filling Fast': 'bg-amber-100 text-amber-700',
  'Closed':       'bg-gray-100 text-gray-500',
  'Coming Soon':  'bg-blue-100 text-blue-700',
}
