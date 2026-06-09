import 'server-only'

const norm = (x: any) => (x ?? '').toString().trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * Scan all products and collapse duplicates onto a single shared master product so
 * the marketplace shows one listing per product. Grouping keys (conservative — never
 * merges distinct variants):
 *   - EAN (strong, unique per variant), else
 *   - normalized name + brand_name (only when a brand is present).
 * Products with no EAN and no brand are left standalone. Idempotent & safe to re-run.
 */
export async function linkDuplicateProducts(admin: any): Promise<{ total: number; groupsMerged: number; mastersCreated: number; linked: number }> {
  let all: any[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from('products')
      .select('id, name, brand_name, ean, master_product_id, category_id, product_line, model_name, description, specs, created_by')
      .order('created_at', { ascending: true })
      .range(from, from + 999)
    if (error) throw new Error(error.message)
    all = all.concat(data ?? [])
    if (!data || data.length < 1000) break
  }

  const groups = new Map<string, any[]>()
  for (const p of all) {
    const name = norm(p.name); if (!name) continue
    const ean = norm(p.ean); const brand = norm(p.brand_name)
    const key = ean ? `ean:${ean}` : brand ? `nb:${name}|${brand}` : null
    if (!key) continue
    const g = groups.get(key); if (g) g.push(p); else groups.set(key, [p])
  }

  let mastersCreated = 0, linked = 0, groupsMerged = 0
  for (const group of Array.from(groups.values())) {
    let masterId: string | null = group.map((g) => g.master_product_id).find(Boolean) ?? null
    if (!masterId) {
      const seed = group.slice().sort((a, b) => ((b.ean ? 1 : 0) - (a.ean ? 1 : 0)) || (norm(b.description).length - norm(a.description).length))[0]
      masterId = await findOrCreateMaster(admin, { ...seed, product_line: seed.product_line, model_name: seed.model_name }, seed.created_by ?? null)
      if (masterId) mastersCreated++
    }
    if (!masterId) continue
    const toLink = group.filter((g) => g.master_product_id !== masterId).map((g) => g.id)
    if (toLink.length) {
      const upd = await admin.from('products').update({ master_product_id: masterId }).in('id', toLink)
      if (!upd.error) linked += toLink.length
    }
    if (group.length > 1) groupsMerged++
  }
  return { total: all.length, groupsMerged, mastersCreated, linked }
}

/** Find an existing master product (by EAN, else name+brand) or create one from
 *  a supplier's product. Returns the master id (or null). Best-effort / defensive. */
export async function findOrCreateMaster(admin: any, product: any, userId: string): Promise<string | null> {
  try {
    const ean = (product.ean || '').trim()
    const name = (product.name || '').trim()
    if (!name) return null

    let found: any = null
    if (ean) {
      const { data } = await admin.from('master_products').select('id').eq('ean', ean).maybeSingle()
      found = data
    }
    if (!found) {
      const { data } = await admin.from('master_products').select('id')
        .ilike('name', name).eq('brand_name', product.brand_name ?? null).maybeSingle()
      found = data
    }
    if (found?.id) return found.id

    const { data: imgs } = await admin.from('product_images').select('url, sort_order').eq('product_id', product.id)
    const image_urls = (imgs ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((i: any) => i.url)

    const specs = product.specs ?? {}
    const base: Record<string, any> = {
      name, brand_name: product.brand_name ?? null, category_id: product.category_id ?? null,
      family: product.product_line ?? null, model: product.model_name ?? null, ean: ean || null,
      description: product.description ?? null, specs, image_urls, created_by: userId,
    }
    // Structured variant columns (0044) — mirror the cascade keys; retried without them if not migrated.
    const variant = { capacity: specs.capacity ?? null, color: specs.color ?? null, region: specs.region ?? null }
    let m = await admin.from('master_products').insert({ ...base, ...variant }).select('id').single()
    if (m.error && /column|does not exist|capacity|color|region/i.test(m.error.message)) {
      m = await admin.from('master_products').insert(base).select('id').single()
    }
    return m.data?.id ?? null
  } catch { return null }
}
