import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { clearPricingConfigCache } from '@/lib/pricing-config'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return me?.role === 'admin' ? user : null
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json().catch(() => ({})) as any
  const admin = createAdminClient()

  const rows: { key: string; value: string }[] = []
  if (body.minMarginPct !== undefined) rows.push({ key: 'pricing_min_margin_pct', value: String(Math.max(0, parseFloat(body.minMarginPct) || 0)) })
  if (body.vatPct       !== undefined) rows.push({ key: 'pricing_vat_pct',        value: String(Math.max(0, parseFloat(body.vatPct) || 0)) })
  if (body.vatEnabled   !== undefined) rows.push({ key: 'pricing_vat_enabled',    value: body.vatEnabled ? 'true' : 'false' })
  // Tax rules
  if (body.euReverseCharge !== undefined) rows.push({ key: 'tax_eu_reverse_charge', value: body.euReverseCharge ? 'true' : 'false' })
  if (body.reverseChargeCategories !== undefined) rows.push({ key: 'tax_reverse_charge_categories', value: String(body.reverseChargeCategories ?? '') })

  if (rows.length) {
    const { error } = await (admin.from('app_settings') as any)
      .upsert(rows.map(r => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: 'key' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  clearPricingConfigCache()
  return NextResponse.json({ ok: true })
}
