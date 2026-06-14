import 'server-only'
import { dedupeByMaster, type Seller } from './offers'

// EU member-state ISO codes — used to flag "No customs" vs "Customs may apply".
const EU_ISO = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'])
const TIER_META: Record<string, { label: string; premium: boolean }> = {
  GOLD:   { label: 'Premium',  premium: true },
  SILVER: { label: 'Verified', premium: false },
  BRONZE: { label: 'Verified', premium: false },
}
function isoToFlag(iso?: string | null) {
  if (!iso || iso.length !== 2) return '🌐'
  const A = 0x1f1e6
  return String.fromCodePoint(...iso.toUpperCase().split('').map((c) => A + c.charCodeAt(0) - 65))
}
const sameC = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Build the ranked "Available Sellers" list for a master product (all published
 * offers from ACTIVE suppliers), sorted best-total first. Reads via the supplied
 * admin client so RLS never blanks it. Returns [] if the master has no offers.
 */
export async function getMasterSellers(
  admin: any,
  masterId: string,
  opts: { retail?: boolean; buyerCountry?: string | null; region?: string | null } = {},
): Promise<Seller[]> {
  const { retail = false, buyerCountry = null, region = null } = opts
  const shopQ = retail ? '?shop=online' : ''

  const { data: rows } = await (admin.from('products') as any)
    .select(`
      id, slug, price_cents, retail_price_cents, vat_rate, currency_code, stock_qty, condition,
      delivery_days, lead_time,
      suppliers!supplier_id!inner(id, legal_name, trade_name, reliability_tier, status, whatsapp, brand_slug, cities(name), countries(name, iso_code))
    `)
    .eq('master_product_id', masterId)
    .eq('is_published', true)
    .eq('suppliers.status', 'ACTIVE')

  // Per-offer shipping (defensive — column may not be migrated yet).
  const shipMap = new Map<string, number>()
  try {
    const ids = ((rows ?? []) as any[]).map((p) => p.id)
    if (ids.length) {
      const { data } = await (admin.from('products') as any).select('id, shipping_cents').in('id', ids)
      for (const r of (data ?? []) as any[]) if (r.shipping_cents != null) shipMap.set(r.id, r.shipping_cents)
    }
  } catch { /* not migrated */ }

  const sellers: Seller[] = ((rows ?? []) as any[]).map((p) => {
    const s = p.suppliers
    const iso = s?.countries?.iso_code ?? null
    const retailCents = p.retail_price_cents ?? (p.vat_rate ? p.price_cents + Math.round(p.price_cents * p.vat_rate / 100) : p.price_cents)
    const productPriceCents = retail ? retailCents : p.price_cents
    const shippingCents = shipMap.has(p.id) ? shipMap.get(p.id)! : null
    const euOk = iso ? EU_ISO.has(iso.toUpperCase()) : false
    const tier = TIER_META[s?.reliability_tier ?? ''] ?? { label: 'Supplier', premium: false }
    return {
      productId: p.id, slug: p.slug, href: `/product/${p.slug ?? p.id}${shopQ}`,
      productPriceCents, shippingCents, totalCents: productPriceCents + (shippingCents ?? 0),
      currency: p.currency_code,
      condition: p.condition ?? null, region,
      customsNote: euOk ? 'No customs (EU)' : 'Customs may apply', customsOk: euOk,
      deliveryDays: p.delivery_days ?? null, leadTime: p.lead_time ?? null, stock: p.stock_qty ?? 0,
      city: s?.cities?.name ?? null, country: s?.countries?.name ?? null, flag: isoToFlag(iso),
      supplierName: s?.trade_name ?? s?.legal_name ?? 'Supplier',
      verified: s?.status === 'ACTIVE', premium: tier.premium, tierLabel: tier.label,
      whatsapp: s?.whatsapp ?? null, brandSlug: s?.brand_slug ?? null,
      nearby: buyerCountry ? (sameC(s?.countries?.name, buyerCountry) || sameC(iso, buyerCountry)) : false,
    }
  })

  sellers.sort((a, b) => a.totalCents - b.totalCents)
  return sellers
}

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
      .select('id, master_product_id, delivery_days, ean')
      .in('id', ids)
    const map = new Map((data ?? []).map((r: any) => [r.id, r]))
    for (const p of rows) {
      const r: any = map.get(p.id)
      p.master_product_id = r?.master_product_id ?? null
      p.delivery_days = r?.delivery_days ?? null
      p.ean = r?.ean ?? p.ean ?? null
      p.reliability_tier = p.suppliers?.reliability_tier ?? p.reliability_tier ?? null
    }
  } catch { /* not migrated — leave rows as singles */ }
  return dedupeByMaster(rows as any) as any[]
}
