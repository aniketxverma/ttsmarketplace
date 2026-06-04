/**
 * Product families — collapse a supplier's related products into one card.
 *
 * Grouping key: `product_line` when set, otherwise supplier + category.
 * A family with a single member renders as a normal product; a family with
 * several renders as one card that opens a family page listing the variants.
 */

export interface FamilyProduct {
  id: string
  name: string
  slug: string
  price_cents: number
  retail_price_cents?: number | null
  currency_code: string
  min_order_qty: number
  marketplace_context: string
  vat_rate?: number | null
  supplier_id: string
  category_id: string
  product_line?: string | null
  suppliers?: any
  product_images?: { url: string; sort_order: number }[]
  categories?: { name: string; slug: string } | null
}

export interface Family<T extends FamilyProduct = FamilyProduct> {
  key: string
  title: string
  href: string
  imageUrl?: string
  members: T[]
  representative: T
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Stable identity for the family a product belongs to. */
export function familyKey(p: FamilyProduct): string {
  const line = p.product_line?.trim()
  return line ? `line:${p.supplier_id}:${slugify(line)}` : `cat:${p.supplier_id}:${p.category_id}`
}

/** Link to the family page that lists this family's variants. */
export function familyHref(p: FamilyProduct): string {
  const line = p.product_line?.trim()
  return line
    ? `/family?s=${p.supplier_id}&line=${encodeURIComponent(line)}`
    : `/family?s=${p.supplier_id}&c=${p.category_id}`
}

function firstImage(p: FamilyProduct): string | undefined {
  return (p.product_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url
}

/** Group products into families, preserving input order of first appearance. */
export function groupIntoFamilies<T extends FamilyProduct>(products: T[]): Family<T>[] {
  const map = new Map<string, Family<T>>()
  for (const p of products) {
    const key = familyKey(p)
    const existing = map.get(key)
    if (existing) {
      existing.members.push(p)
      if (!existing.imageUrl) existing.imageUrl = firstImage(p)
    } else {
      const line = p.product_line?.trim()
      map.set(key, {
        key,
        title: line || p.categories?.name || p.name,
        href: familyHref(p),
        imageUrl: firstImage(p),
        members: [p],
        representative: p,
      })
    }
  }
  return Array.from(map.values())
}
