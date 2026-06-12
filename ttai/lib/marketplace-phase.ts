import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Pre-Opening phase switch. Before Opening Day the marketplace is "not open":
 * every shop shows a Pre-Opening notice and NO supplier is shown as verified or
 * promoted. Admin flips `marketplace_open` to true on launch.
 * Stored in app_settings (key/value). Defaults to CLOSED (pre-opening).
 */
let _c: { open: boolean; at: number } | null = null

export async function getMarketplaceOpen(): Promise<boolean> {
  if (_c && Date.now() - _c.at < 30_000) return _c.open
  let open = false
  try {
    const admin = createAdminClient()
    const { data } = await (admin.from('app_settings') as any)
      .select('value').eq('key', 'marketplace_open').maybeSingle()
    open = (data?.value ?? 'false') === 'true'
  } catch { open = false }
  _c = { open, at: Date.now() }
  return open
}

export function clearMarketplacePhaseCache() { _c = null; _ld = null }

// ── Launch date (countdown target) ───────────────────────────────────────────
export const DEFAULT_LAUNCH_DATE = '2026-07-09T09:00:00Z'
let _ld: { date: string; at: number } | null = null

export async function getLaunchDate(): Promise<string> {
  if (_ld && Date.now() - _ld.at < 30_000) return _ld.date
  let date = DEFAULT_LAUNCH_DATE
  try {
    const admin = createAdminClient()
    const { data } = await (admin.from('app_settings') as any)
      .select('value').eq('key', 'launch_date').maybeSingle()
    if (data?.value) date = data.value
  } catch { /* fall back to default */ }
  _ld = { date, at: Date.now() }
  return date
}

export const PRE_OPENING_NOTICE =
  'This business is registered on TTAI EMA Marketplace. Verification, marketplace integration and promotional eligibility will be reviewed after the official marketplace opening.'
