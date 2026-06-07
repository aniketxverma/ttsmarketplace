import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_PRICING, type PricingConfig } from './pricing-rules'

/**
 * Admin-managed pricing rules, stored in `app_settings` (pricing_* keys).
 * Cached 30s to avoid re-querying on every render.
 */
let _c: { cfg: PricingConfig; at: number } | null = null

export async function getPricingConfig(): Promise<PricingConfig> {
  if (_c && Date.now() - _c.at < 30_000) return _c.cfg
  let m: Record<string, string> = {}
  try {
    const admin = createAdminClient()
    const { data } = await (admin.from('app_settings') as any).select('key, value').like('key', 'pricing_%')
    m = Object.fromEntries(((data ?? []) as any[]).map((r) => [r.key, r.value]))
  } catch { /* table may not exist yet — fall back to defaults */ }

  const cfg: PricingConfig = {
    minMarginPct: m.pricing_min_margin_pct ? parseFloat(m.pricing_min_margin_pct) : DEFAULT_PRICING.minMarginPct,
    vatPct:       m.pricing_vat_pct        ? parseFloat(m.pricing_vat_pct)        : DEFAULT_PRICING.vatPct,
    vatEnabled:  (m.pricing_vat_enabled ?? 'true') !== 'false',
  }
  _c = { cfg, at: Date.now() }
  return cfg
}

export function clearPricingConfigCache() { _c = null }
