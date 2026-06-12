import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

/** Admin actions on a category (incl. supplier-requested pending ones). */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: prof } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as { id?: string; action?: string; name?: string; parentId?: string | null; targetId?: string; icon?: string }
  const { id, action } = body
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })

  const admin = createAdminClient()

  switch (action) {
    case 'approve':
      await (admin.from('categories') as any).update({ status: 'active' }).eq('id', id)
      break
    case 'reject':
      await (admin.from('categories') as any).update({ status: 'rejected' }).eq('id', id)
      break
    case 'activate':
      await (admin.from('categories') as any).update({ status: 'active' }).eq('id', id)
      break
    case 'deactivate':
      await (admin.from('categories') as any).update({ status: 'pending' }).eq('id', id)
      break
    case 'rename':
      if (!body.name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
      await (admin.from('categories') as any).update({ name: body.name.trim(), slug: slugify(body.name).slice(0, 80) }).eq('id', id)
      break
    case 'set_parent': {
      const parentId = body.parentId || null
      await (admin.from('categories') as any).update({ parent_id: parentId, depth: parentId ? 1 : 0 }).eq('id', id)
      break
    }
    case 'icon':
      await (admin.from('categories') as any).update({ icon: body.icon ?? null }).eq('id', id)
      break
    case 'merge': {
      // Move every product + child category from `id` into `targetId`, then delete `id`.
      if (!body.targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 })
      await (admin.from('products') as any).update({ category_id: body.targetId }).eq('category_id', id)
      await (admin.from('categories') as any).update({ parent_id: body.targetId }).eq('parent_id', id)
      await (admin.from('categories') as any).delete().eq('id', id)
      break
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
