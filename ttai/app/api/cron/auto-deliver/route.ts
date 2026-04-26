import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders } = await admin
    .from('orders')
    .select('id')
    .eq('status', 'fulfilled')
    .lte('updated_at', cutoff)

  if (!orders?.length) return NextResponse.json({ ok: true, delivered: 0 })

  const ids = orders.map((o) => o.id)
  await admin
    .from('orders')
    .update({ status: 'delivered' })
    .in('id', ids)

  return NextResponse.json({ ok: true, delivered: ids.length })
}
