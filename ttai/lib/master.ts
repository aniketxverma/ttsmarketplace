import 'server-only'

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

    const { data: m } = await admin.from('master_products').insert({
      name, brand_name: product.brand_name ?? null, category_id: product.category_id ?? null,
      family: product.product_line ?? null, model: product.model_name ?? null, ean: ean || null,
      description: product.description ?? null, specs: product.specs ?? {}, image_urls,
      created_by: userId,
    }).select('id').single()
    return m?.id ?? null
  } catch { return null }
}
