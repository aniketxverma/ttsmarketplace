import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/rbac'

/** Toggle a supplier as the TTAI EMA "house" seller for the Trade Hub (Phase 1). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireRole('admin')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { isHouse } = (await req.json().catch(() => ({}))) as { isHouse?: boolean }
  const admin = createAdminClient()
  const { error } = await (admin.from('suppliers') as any).update({ is_house: !!isHouse }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, is_house: !!isHouse })
}
