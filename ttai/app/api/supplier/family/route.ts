import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

/**
 * Find-or-create a Family (a child category) under a Main Category.
 * Suppliers can't insert categories directly (admin-only RLS), so this runs
 * with the admin client after verifying the caller owns a supplier shop.
 * Returns the family category id to store on the product.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sup } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).maybeSingle()
  if (!sup) return NextResponse.json({ error: 'No supplier profile' }, { status: 403 })

  const { rootId, name } = (await req.json().catch(() => ({}))) as { rootId?: string; name?: string }
  if (!rootId || !name?.trim()) return NextResponse.json({ error: 'rootId and name are required' }, { status: 400 })

  const admin = createAdminClient()

  // The parent must be a real MAIN category (a root with no parent).
  const { data: root } = await (admin.from('categories') as any)
    .select('id, parent_id, depth').eq('id', rootId).maybeSingle()
  if (!root || root.parent_id) return NextResponse.json({ error: 'Invalid main category' }, { status: 400 })

  const slug = slugify(name).slice(0, 80) || 'family'

  // Reuse an existing family with the same slug under this main category.
  const { data: existing } = await (admin.from('categories') as any)
    .select('id, name').eq('parent_id', rootId).eq('slug', slug).maybeSingle()
  if (existing) return NextResponse.json({ category: existing })

  const { data: created, error } = await (admin.from('categories') as any)
    .insert({ parent_id: rootId, name: name.trim(), slug, depth: (root.depth ?? 0) + 1 })
    .select('id, name').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ category: created }, { status: 201 })
}
