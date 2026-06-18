import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/rbac'

/** Mark/unmark a supplier as a 🟣 TTAIEMA Premium Partner (strategic partner). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireRole('admin')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { premium } = (await req.json().catch(() => ({}))) as { premium?: boolean }
  const admin = createAdminClient()
  const { error } = await (admin.from('suppliers') as any).update({ premium_partner: !!premium }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, premium_partner: !!premium })
}
