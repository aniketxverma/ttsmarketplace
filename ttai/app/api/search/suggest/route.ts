import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Intelligent search suggestions: categories, brands, products and suppliers as
// the user types. Brands are also inferred from matching products (so "iph" →
// Apple), making it feel AI-powered without a per-keystroke LLM call.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 1) return NextResponse.json({ categories: [], brands: [], products: [], suppliers: [] })

  const admin = createAdminClient()
  const like = `%${q}%`

  const [catsRes, brandRes, prodRes, supRes] = await Promise.all([
    (admin.from('categories') as any).select('name, slug, parent_id').ilike('name', like).limit(6),
    (admin.from('products') as any).select('brand_name').eq('is_published', true).ilike('brand_name', like).limit(40),
    (admin.from('products') as any)
      .select('name, slug, brand_name, price_cents, currency_code, product_images(url, sort_order)')
      .eq('is_published', true).ilike('name', like).limit(7),
    (admin.from('suppliers') as any)
      .select('id, trade_name, legal_name, logo_url').eq('status', 'ACTIVE')
      .or(`trade_name.ilike.${like},legal_name.ilike.${like}`).limit(4),
  ])

  const products = ((prodRes.data ?? []) as any[]).map((p) => ({
    name: p.name, slug: p.slug, brand: p.brand_name ?? null,
    price: p.price_cents, currency: p.currency_code ?? 'EUR',
    img: ((p.product_images ?? []) as any[]).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
  }))

  // Brands: direct brand matches + brands of matching products (so "iph" → Apple).
  const brandSet = new Set<string>()
  for (const b of (brandRes.data ?? []) as any[]) if (b.brand_name) brandSet.add(b.brand_name.trim())
  for (const p of products) if (p.brand && p.brand.toLowerCase().includes(q.toLowerCase().slice(0, 3))) brandSet.add(p.brand)
  for (const p of products) if (p.brand) brandSet.add(p.brand)
  const brands = Array.from(brandSet).slice(0, 5)

  const categories = ((catsRes.data ?? []) as any[]).map((c) => ({ name: c.name, slug: c.slug, isSub: !!c.parent_id }))
  const suppliers = ((supRes.data ?? []) as any[]).map((s) => ({ id: s.id, name: s.trade_name ?? s.legal_name, logo: s.logo_url ?? null }))

  return NextResponse.json({ categories, brands, products, suppliers })
}
