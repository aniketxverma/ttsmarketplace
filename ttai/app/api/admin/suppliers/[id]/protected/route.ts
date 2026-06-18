import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/rbac'

/** Enroll/remove a supplier in the TTAIEMA Protected Service (🔵 status badge). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireRole('admin')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { protected: prot } = (await req.json().catch(() => ({}))) as { protected?: boolean }
  const admin = createAdminClient()
  const { error } = await (admin.from('suppliers') as any).update({ ttaiema_protected: !!prot }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, ttaiema_protected: !!prot })
}
