import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailFireAndForget } from '@/lib/email/send'
import { SupplierOnboardingEmail } from '@/lib/email/templates/SupplierOnboardingEmail'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ttaiz.com'
const REMINDER_DAYS = 3

/**
 * Onboarding gate. Any supplier shop with NO products is held UNDER_REVIEW (not
 * shown to buyers) and emailed: "set up your shop / add products to get
 * approved." Shops that stay empty get a reminder every few days. Our own house
 * brands are skipped. Runs daily via vercel cron (and can be hit manually).
 */
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = createAdminClient()

  // Suppliers (skip our own house brands) + product tally
  const { data: suppliers } = await (admin.from('suppliers') as any)
    .select('id, trade_name, status, business_email, owner_id, is_house')
  const { data: prodRows } = await (admin.from('products') as any).select('supplier_id')
  const counts = new Map<string, number>()
  for (const p of prodRows ?? []) counts.set(p.supplier_id, (counts.get(p.supplier_id) ?? 0) + 1)

  const emailFor = async (s: any): Promise<string | null> => {
    if (s.business_email) return s.business_email
    if (s.owner_id) { try { const { data } = await admin.auth.admin.getUserById(s.owner_id); return data?.user?.email ?? null } catch { return null } }
    return null
  }
  const remindedRecently = async (email: string): Promise<boolean> => {
    try {
      const since = new Date(Date.now() - REMINDER_DAYS * 86400000).toISOString()
      const { count } = await (admin.from('email_log') as any)
        .select('*', { count: 'exact', head: true })
        .eq('to_email', email).gte('created_at', since).ilike('subject', '%add products%')
      return (count ?? 0) > 0
    } catch { return false }
  }

  let flagged = 0, firstEmails = 0, reminders = 0
  for (const s of suppliers ?? []) {
    if (s.is_house) continue
    if ((counts.get(s.id) ?? 0) > 0) continue // has products — leave for admin approval
    const email = await emailFor(s)
    const name = s.trade_name || 'there'

    if (s.status === 'ACTIVE') {
      await (admin.from('suppliers') as any).update({ status: 'UNDER_REVIEW' }).eq('id', s.id)
      flagged++
      if (email) {
        sendEmailFireAndForget({ to: email, subject: 'Set up your shop to get approved — add your products',
          react: React.createElement(SupplierOnboardingEmail, { supplierName: name, appUrl: APP_URL }) })
        firstEmails++
      }
    } else if (s.status === 'UNDER_REVIEW' && email && !(await remindedRecently(email))) {
      sendEmailFireAndForget({ to: email, subject: 'Reminder: add products to activate your shop',
        react: React.createElement(SupplierOnboardingEmail, { supplierName: name, appUrl: APP_URL, reminder: true }) })
      reminders++
    }
  }

  return NextResponse.json({ ok: true, flaggedUnderReview: flagged, onboardingEmails: firstEmails, reminders })
}
