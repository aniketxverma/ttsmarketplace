// A mother factory's "Global Distribution Network" — official distributors per
// country + open partner opportunities ("looking for exclusive distributor"…).
// Shown as a hub-and-spoke circle on the factory's profile and click-preview.
// Seeded per supplier in app_settings (key `dist_network:<supplierId>`); a
// dashboard editor comes later.

export type NetStatus =
  // Active partners you already have
  | 'distributor' | 'importer' | 'wholesaler' | 'retailer' | 'point_of_sale' | 'agent' | 'office'
  // Open opportunities — looking for new partners
  | 'looking_distributor' | 'looking_importer' | 'looking_wholesaler' | 'looking_retailer' | 'looking_agent'
  | 'coming_soon'

export type NetNode = {
  iso: string                 // ISO-2, drives the flag (e.g. 'DE')
  country: string             // display name
  status: NetStatus
  company?: string | null     // official partner's company name
  profile?: string | null     // the distributor's TTAIZ profile (brand slug or full URL) — makes the company name a link
  verified?: boolean          // verified by TTAIEMA
  benefits?: string[]         // for open opportunities (shown in the apply card)
  sourceInviteId?: string     // sales_network invite this node was linked from (idempotency + unlink)
  autoAdded?: boolean         // node created by a sales-network invite (vs a hand-curated one)
}

export type DistNetwork = {
  center: { title: string; subtitle: string; iso: string; image?: string | null; since?: string | null }
  nodes: NetNode[]
}

export type StatusGroup = 'partner' | 'opportunity' | 'other'

export const NET_STATUS: Record<NetStatus, { label: string; color: string; opportunity: boolean; group: StatusGroup }> = {
  // ── Active partners you already have ──
  distributor:   { label: 'Official Distributor', color: '#16a34a', opportunity: false, group: 'partner' },
  importer:      { label: 'Official Importer',    color: '#0d9488', opportunity: false, group: 'partner' },
  wholesaler:    { label: 'Wholesaler',           color: '#0891b2', opportunity: false, group: 'partner' },
  retailer:      { label: 'Retailer',             color: '#4f46e5', opportunity: false, group: 'partner' },
  point_of_sale: { label: 'Point of Sale',        color: '#0ea5e9', opportunity: false, group: 'partner' },
  agent:         { label: 'Sales Agent',          color: '#64748b', opportunity: false, group: 'partner' },
  office:        { label: 'Branch Office',         color: '#2563eb', opportunity: false, group: 'partner' },
  // ── Open opportunities — looking for new partners ──
  looking_distributor: { label: 'Looking for Exclusive Distributor', color: '#f59e0b', opportunity: true, group: 'opportunity' },
  looking_importer:    { label: 'Looking for Importer',              color: '#3b82f6', opportunity: true, group: 'opportunity' },
  looking_wholesaler:  { label: 'Looking for Wholesaler',           color: '#06b6d4', opportunity: true, group: 'opportunity' },
  looking_retailer:    { label: 'Looking for Retail Partner',       color: '#a855f7', opportunity: true, group: 'opportunity' },
  looking_agent:       { label: 'Looking for Sales Agent',          color: '#ef4444', opportunity: true, group: 'opportunity' },
  // ── Other ──
  coming_soon:   { label: 'Coming Soon',           color: '#9ca3af', opportunity: false, group: 'other' },
}

/** Map a sales-network partner level → the matching map status (used on auto-link). */
export const LEVEL_TO_STATUS: Record<string, NetStatus> = {
  distributor: 'distributor', master_distributor: 'distributor',
  importer: 'importer', wholesaler: 'wholesaler', retailer: 'retailer',
  point_of_sale: 'point_of_sale', sales_point: 'point_of_sale', customer: 'retailer',
}

// ── Continent grouping ──────────────────────────────────────────────────────
// The map drills Factory → Continent → Country. The continent is derived from
// each node's ISO so the factory only enters the country.
const ISO_REGION: Record<string, string> = {
  // Europe
  ES: 'Europe', DE: 'Europe', FR: 'Europe', IT: 'Europe', BE: 'Europe', NL: 'Europe', GB: 'Europe', PT: 'Europe', PL: 'Europe',
  SE: 'Europe', NO: 'Europe', DK: 'Europe', FI: 'Europe', IE: 'Europe', AT: 'Europe', CH: 'Europe', CZ: 'Europe', SK: 'Europe',
  HU: 'Europe', RO: 'Europe', BG: 'Europe', GR: 'Europe', HR: 'Europe', RS: 'Europe', SI: 'Europe', LT: 'Europe', LV: 'Europe',
  EE: 'Europe', UA: 'Europe', RU: 'Europe', LU: 'Europe',
  // Middle East
  AE: 'Middle East', SA: 'Middle East', QA: 'Middle East', KW: 'Middle East', BH: 'Middle East', OM: 'Middle East',
  JO: 'Middle East', LB: 'Middle East', IL: 'Middle East', IQ: 'Middle East', IR: 'Middle East', SY: 'Middle East',
  YE: 'Middle East', TR: 'Middle East',
  // Americas
  US: 'Americas', CA: 'Americas', MX: 'Americas', BR: 'Americas', AR: 'Americas', CL: 'Americas', CO: 'Americas',
  PE: 'Americas', EC: 'Americas', UY: 'Americas',
  // Africa
  MA: 'Africa', EG: 'Africa', NG: 'Africa', ZA: 'Africa', KE: 'Africa', GH: 'Africa', DZ: 'Africa', TN: 'Africa',
  ET: 'Africa', CI: 'Africa', SN: 'Africa',
  // Asia
  CN: 'Asia', JP: 'Asia', KR: 'Asia', IN: 'Asia', ID: 'Asia', TH: 'Asia', VN: 'Asia', MY: 'Asia', SG: 'Asia',
  PH: 'Asia', PK: 'Asia', BD: 'Asia', HK: 'Asia', TW: 'Asia', KZ: 'Asia',
  // Oceania
  AU: 'Oceania', NZ: 'Oceania',
}
export const REGION_EMOJI: Record<string, string> = {
  'Europe': '🇪🇺', 'Middle East': '🕌', 'Americas': '🌎', 'Africa': '🌍', 'Asia': '🌏', 'Oceania': '🦘', 'Other': '🌐',
}
export function regionForIso(iso?: string | null): string {
  return ISO_REGION[(iso ?? '').toUpperCase()] ?? 'Other'
}

/** Resolve a node's `profile` (a TTAIZ brand slug or a full URL) to a link. */
export function profileHref(profile?: string | null): string | null {
  const p = (profile ?? '').trim()
  if (!p) return null
  if (/^https?:\/\//i.test(p)) return p
  return `/brand/${p.replace(/^\/?(brand\/)?/i, '')}`
}

/** Read one supplier's network config. Defensive — never throws on a public page. */
export async function getDistNetwork(admin: any, supplierId: string): Promise<DistNetwork | null> {
  try {
    const { data } = await (admin.from('app_settings') as any).select('value').eq('key', `dist_network:${supplierId}`).maybeSingle()
    if (!data?.value) return null
    return typeof data.value === 'string' ? JSON.parse(data.value) : data.value
  } catch { return null }
}

/**
 * Reflect a sales-network member on the inviter's distribution-network map.
 * Called twice in a member's lifecycle, keyed by the invite id (idempotent):
 *   • on invite  — adds a pending node (verified:false, no profile link yet);
 *   • on accept  — upgrades it (verified:true, links to the member's brand slug).
 * Links/verifies a matching hand-curated node (by company or country) when one
 * exists, otherwise adds a new node. Centre image = inviter's banner when the
 * map doesn't exist yet.
 */
export async function linkMemberToNetwork(
  admin: any,
  inviterSupplierId: string,
  member: {
    inviteId?: string
    supplierId?: string | null
    brandSlug?: string | null       // resolvable brand slug → makes the card a link (set on accept)
    company: string
    countryName?: string | null
    level?: string | null
    verified?: boolean              // true once the member has accepted
  },
): Promise<void> {
  const partnerStatus: NetStatus = LEVEL_TO_STATUS[member.level ?? ''] ?? 'distributor'
  // Resolve an ISO-2 from the free-text country (for the flag).
  let iso = ''
  if (member.countryName) {
    try {
      const { data: c } = await (admin.from('countries') as any).select('iso_code').ilike('name', member.countryName.trim()).maybeSingle()
      iso = (c?.iso_code ?? '').toUpperCase()
    } catch { /* countries lookup best-effort */ }
  }

  let net = await getDistNetwork(admin, inviterSupplierId)
  if (!net) {
    let center: DistNetwork['center'] = { title: 'Head Office / Factory', subtitle: '', iso: '', since: null, image: null }
    try {
      const { data: sup } = await (admin.from('suppliers') as any)
        .select('banner_image, countries(iso_code, name)').eq('id', inviterSupplierId).maybeSingle()
      center = { title: 'Head Office / Factory', subtitle: (sup?.countries as any)?.name ?? '', iso: ((sup?.countries as any)?.iso_code ?? '').toUpperCase(), since: null, image: sup?.banner_image ?? null }
    } catch { /* best-effort */ }
    net = { center, nodes: [] }
  }

  const nodes = net.nodes ?? []
  // Already linked from this invite? (idempotent — the invite→accept upgrade)
  let node = member.inviteId ? nodes.find((n) => n.sourceInviteId === member.inviteId) : undefined
  // Legacy: previously linked by supplier id stored in `profile`.
  if (!node && member.supplierId) node = nodes.find((n) => n.profile === member.supplierId)
  if (!node) {
    // Link an existing un-linked node that matches by company name or country
    // (an "official" / "looking for …" placeholder the factory pre-created).
    node = nodes.find((n) => !n.sourceInviteId && !n.profile && (
      (!!n.company && n.company.toLowerCase() === member.company.toLowerCase()) ||
      (!!iso && (n.iso ?? '').toUpperCase() === iso)
    ))
  }
  if (node) {
    if (member.inviteId) node.sourceInviteId = member.inviteId
    if (member.brandSlug) node.profile = member.brandSlug
    if (member.verified) node.verified = true
    // Promote a "looking for …" opportunity to the matching active partner type.
    if (NET_STATUS[node.status]?.opportunity || node.status === 'coming_soon') node.status = partnerStatus
    if (!node.company) node.company = member.company
    if (iso && !node.iso) node.iso = iso
  } else {
    nodes.push({
      iso, country: member.countryName || member.company, status: partnerStatus,
      company: member.company, profile: member.brandSlug ?? null, verified: !!member.verified,
      sourceInviteId: member.inviteId, autoAdded: true,
    })
  }
  net.nodes = nodes

  try {
    await (admin.from('app_settings') as any).upsert({ key: `dist_network:${inviterSupplierId}`, value: JSON.stringify(net) }, { onConflict: 'key' })
  } catch { /* never block the invite/accept flow */ }
}

/**
 * Remove (or revert) the map node created from a revoked sales-network invite.
 * Auto-added nodes are dropped; a hand-curated node that we linked is reverted
 * to an un-linked placeholder so the factory keeps its curated entry.
 */
export async function unlinkInviteFromNetwork(admin: any, inviterSupplierId: string, inviteId: string): Promise<void> {
  if (!inviteId) return
  const net = await getDistNetwork(admin, inviterSupplierId)
  if (!net?.nodes?.length) return
  let changed = false
  net.nodes = net.nodes.filter((n) => {
    if (n.sourceInviteId !== inviteId) return true
    changed = true
    if (n.autoAdded) return false            // drop nodes we created
    delete n.sourceInviteId; n.profile = null; n.verified = false  // revert curated ones
    return true
  })
  if (!changed) return
  try {
    await (admin.from('app_settings') as any).upsert({ key: `dist_network:${inviterSupplierId}`, value: JSON.stringify(net) }, { onConflict: 'key' })
  } catch { /* never block revoke */ }
}

/** Map of supplierId → network for a batch (for directory cards / previews). */
export async function getDistNetworkMap(admin: any, supplierIds: string[]): Promise<Map<string, DistNetwork>> {
  const out = new Map<string, DistNetwork>()
  const ids = Array.from(new Set(supplierIds.filter(Boolean)))
  if (!ids.length) return out
  try {
    const keys = ids.map((id) => `dist_network:${id}`)
    const { data } = await (admin.from('app_settings') as any).select('key, value').in('key', keys)
    for (const r of (data ?? []) as any[]) {
      const id = r.key.replace('dist_network:', '')
      try { out.set(id, typeof r.value === 'string' ? JSON.parse(r.value) : r.value) } catch { /* skip bad json */ }
    }
  } catch { /* app_settings unreadable */ }
  return out
}
