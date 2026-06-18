import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/rbac'

/** Toggle the "Powered by TTAIEMA catalogue" paid service for a supplier. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireRole('admin')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { active } = (await req.json().catch(() => ({}))) as { active?: boolean }
  const admin = createAdminClient()
  const { error } = await (admin.from('suppliers') as any).update({ catalogue_service: !!active }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, catalogue_service: !!active })
}
