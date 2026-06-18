import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID = ['marketplace', 'outlet', 'logistics', 'consulting', 'trade_hub']

/**
 * Supplier self-activates a TTAIEMA module (Marketplace, Logistics, Consulting,
 * Trade Hub…). Adds the module to suppliers.modules. A company that started in
 * the Outlet Zone can expand here without a new profile.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { module, active } = await req.json().catch(() => ({})) as { module?: string; active?: boolean }
  if (!module || !VALID.includes(module)) return NextResponse.json({ error: 'Invalid module' }, { status: 400 })

  const admin = createAdminClient()
  const { data: sup } = await admin.from('suppliers').select('id, modules').eq('owner_id', user.id).maybeSingle()
  if (!sup) return NextResponse.json({ error: 'No supplier profile' }, { status: 404 })

  const current: string[] = Array.isArray((sup as any).modules) && (sup as any).modules.length
    ? (sup as any).modules
    : ['marketplace', 'outlet'] // legacy default
  let next = current
  if (active === false) next = current.filter((m) => m !== module)
  else if (!current.includes(module)) next = [...current, module]

  const { error } = await (admin.from('suppliers') as any).update({ modules: next }).eq('id', (sup as any).id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, modules: next })
}
