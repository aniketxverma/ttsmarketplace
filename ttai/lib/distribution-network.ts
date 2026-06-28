// A mother factory's "Global Distribution Network" — official distributors per
// country + open partner opportunities ("looking for exclusive distributor"…).
// Shown as a hub-and-spoke circle on the factory's profile and click-preview.
// Seeded per supplier in app_settings (key `dist_network:<supplierId>`); a
// dashboard editor comes later.

export type NetStatus = 'official' | 'importer' | 'exclusive' | 'retail' | 'agent' | 'office' | 'coming_soon'

export type NetNode = {
  iso: string                 // ISO-2, drives the flag (e.g. 'DE')
  country: string             // display name
  status: NetStatus
  company?: string | null     // official partner's company name
  verified?: boolean          // verified by TTAIEMA
  benefits?: string[]         // for open opportunities (shown in the apply card)
}

export type DistNetwork = {
  center: { title: string; subtitle: string; iso: string; image?: string | null; since?: string | null }
  nodes: NetNode[]
}

export const NET_STATUS: Record<NetStatus, { label: string; color: string; opportunity: boolean }> = {
  official:    { label: 'Official Distributor',              color: '#16a34a', opportunity: false },
  importer:    { label: 'Looking for Importer',              color: '#2563eb', opportunity: true },
  exclusive:   { label: 'Looking for Exclusive Distributor', color: '#f59e0b', opportunity: true },
  retail:      { label: 'Looking for Retail Partner',        color: '#a855f7', opportunity: true },
  agent:       { label: 'Looking for Sales Agent',           color: '#ec4899', opportunity: true },
  office:      { label: 'Branch Office',                     color: '#0ea5e9', opportunity: false },
  coming_soon: { label: 'Coming Soon',                       color: '#9ca3af', opportunity: false },
}

/** Read one supplier's network config. Defensive — never throws on a public page. */
export async function getDistNetwork(admin: any, supplierId: string): Promise<DistNetwork | null> {
  try {
    const { data } = await (admin.from('app_settings') as any).select('value').eq('key', `dist_network:${supplierId}`).maybeSingle()
    if (!data?.value) return null
    return typeof data.value === 'string' ? JSON.parse(data.value) : data.value
  } catch { return null }
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
