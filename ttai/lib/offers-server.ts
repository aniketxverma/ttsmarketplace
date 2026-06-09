import 'server-only'
import { dedupeByMaster } from './offers'

/**
 * Attach master-link fields to product rows (defensive — columns may not be migrated)
 * and collapse rows sharing a master_product_id into one best-price representative.
 * The representative carries `_offerCount` and `_masterId` for the marketplace cards.
 *
 * Rows must already include an embedded `suppliers` with `reliability_tier`.
 */
export async function dedupeProductsByMaster(supabase: any, rows: any[]): Promise<any[]> {
  if (!rows.length) return rows
  try {
    const ids = rows.map((r) => r.id)
    const { data } = await (supabase.from('products') as any)
      .select('id, master_product_id, delivery_days')
      .in('id', ids)
    const map = new Map((data ?? []).map((r: any) => [r.id, r]))
    for (const p of rows) {
      const r: any = map.get(p.id)
      p.master_product_id = r?.master_product_id ?? null
      p.delivery_days = r?.delivery_days ?? null
      p.reliability_tier = p.suppliers?.reliability_tier ?? p.reliability_tier ?? null
    }
  } catch { /* not migrated — leave rows as singles */ }
  return dedupeByMaster(rows as any) as any[]
}
