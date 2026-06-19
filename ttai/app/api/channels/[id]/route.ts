import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/channels/[id] — public: get channel + supplier info
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: channel } = await (supabase.from('supplier_channels') as any)
    .select('*, suppliers(trade_name, legal_name, logo_url, brand_slug)')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ channel })
}

// PATCH /api/channels/[id] — supplier: update channel settings
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.name      !== undefined) update.name        = String(body.name).trim()
  if (body.description !== undefined) update.description = body.description?.trim() || null
  if (body.whatsapp  !== undefined) update.whatsapp    = body.whatsapp?.trim()     || null
  if (body.whatsapp_channel_url !== undefined) update.whatsapp_channel_url = body.whatsapp_channel_url?.trim() || null
  if (body.is_active !== undefined) update.is_active   = Boolean(body.is_active)

  const run = (u: Record<string, unknown>) => (supabase.from('supplier_channels') as any)
    .update(u).eq('id', params.id).select().single()
  let { data: channel, error } = await run(update)
  // Defensive: whatsapp_channel_url column may not be migrated yet (0079) → retry without.
  if (error && /column|whatsapp_channel_url|does not exist/i.test(error.message)) {
    const { whatsapp_channel_url, ...rest } = update
    ;({ data: channel, error } = await run(rest))
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ channel })
}
