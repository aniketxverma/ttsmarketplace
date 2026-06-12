import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
import { clearMarketplacePhaseCache } from '@/lib/marketplace-phase'

/** Admin: open the marketplace (Opening Day) or keep it in pre-opening. */
export async function POST(req: Request) {
  await requireRole('admin')
  const { open } = (await req.json().catch(() => ({}))) as { open?: boolean }
  const admin = createAdminClient()
  const { error } = await (admin.from('app_settings') as any)
    .upsert({ key: 'marketplace_open', value: open ? 'true' : 'false' }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  clearMarketplacePhaseCache()
  return NextResponse.json({ ok: true, open: !!open })
}
