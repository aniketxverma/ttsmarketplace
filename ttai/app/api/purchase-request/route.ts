import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailFireAndForget } from '@/lib/email/send'

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'info@ttaiema.com'

/** Buyer submits a B2B "Want to Buy" request — no payment yet; the supplier confirms first. */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to request a purchase.' }, { status: 401 })

  const b = await req.json().catch(() => ({})) as Record<string, string>
  if (!b.supplierId) return NextResponse.json({ error: 'Missing supplier' }, { status: 400 })

  const admin = createAdminClient()
  const row = {
    buyer_id: user.id, supplier_id: b.supplierId, product_id: b.productId || null,
    product_name: b.productName || null, unit: b.unit || null, quantity: b.quantity || null,
    message: b.message || null, buyer_name: b.buyerName || null, buyer_email: user.email || null,
    buyer_company: b.buyerCompany || null, buyer_phone: b.buyerPhone || null, status: 'requested',
  }
  const { error } = await (admin.from('purchase_requests') as any).insert(row)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the supplier — or route to TTAIEMA when we coordinate the deal.
  let managed = false
  try {
    const { data: sup } = await admin.from('suppliers').select('trade_name, legal_name, business_email, managed_deals').eq('id', b.supplierId).maybeSingle()
    managed = !!(sup as any)?.managed_deals
    const company = (sup as any)?.trade_name ?? (sup as any)?.legal_name ?? 'Supplier'
    const to = managed ? ADMIN_EMAIL : ((sup as any)?.business_email || ADMIN_EMAIL)
    const body = React.createElement('div', { style: { fontFamily: 'Arial, sans-serif', color: '#0B1F4D' } },
      React.createElement('h2', null, managed ? `Managed deal — purchase request (${company})` : 'New purchase request'),
      React.createElement('p', null, `${b.buyerCompany || b.buyerName || user.email} wants to buy:`),
      React.createElement('p', null, `${b.quantity || ''} ${b.unit || ''} — ${b.productName || 'product'}`),
      b.message ? React.createElement('p', null, b.message) : null,
      React.createElement('p', { style: { color: '#475569' } }, managed
        ? 'TTAIEMA coordinates this deal — confirm stock, price & delivery with the supplier, then the buyer.'
        : 'Confirm stock, quantity, price & delivery in your TTAIEMA dashboard → Purchase Requests.'),
    )
    sendEmailFireAndForget({ to, subject: `${managed ? '[Managed] ' : ''}Purchase request — ${b.productName || 'product'}`, react: body as any })

    // Managed deals also enter the Control Center (Marketplace team / Ane).
    if (managed) {
      await (admin.from('tickets') as any).insert({
        client_name: b.buyerName || null, company_name: b.buyerCompany || null,
        email: user.email || null, phone: b.buyerPhone || null,
        department: 'marketplace', assigned_to: 'Ane', status: 'new',
        subject: `Managed deal — ${b.productName || 'product'} (${company})`,
        message: `${b.buyerCompany || b.buyerName || user.email} wants ${b.quantity || ''} ${b.unit || ''} of "${b.productName || 'product'}" from ${company}.${b.message ? `\n\n${b.message}` : ''}`,
        source_platform: 'TTAI EMA', source_form: 'purchase-request-managed',
      }).catch(() => {})
    }
  } catch { /* notification best-effort */ }

  return NextResponse.json({ ok: true, managed })
}
