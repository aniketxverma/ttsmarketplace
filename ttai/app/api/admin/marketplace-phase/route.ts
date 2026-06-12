import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
import { clearMarketplacePhaseCache } from '@/lib/marketplace-phase'

/** Admin: open the marketplace (Opening Day) or keep it in pre-opening. */
export async function POST(req: Request) {
  await requireRole('admin')
  const body = (await req.json().catch(() => ({}))) as { open?: boolean; launchDate?: string }
  const admin = createAdminClient()

  const rows: { key: string; value: string }[] = []
  if (typeof body.open === 'boolean') rows.push({ key: 'marketplace_open', value: body.open ? 'true' : 'false' })
  if (typeof body.launchDate === 'string' && body.launchDate) {
    const iso = new Date(body.launchDate).toISOString()
    rows.push({ key: 'launch_date', value: iso })
  }
  if (rows.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { error } = await (admin.from('app_settings') as any).upsert(rows, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  clearMarketplacePhaseCache()
  return NextResponse.json({ ok: true })
}
