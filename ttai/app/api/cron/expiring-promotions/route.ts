import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailFireAndForget } from '@/lib/email/send'
import { BrokerPromotionExpiringEmail } from '@/lib/email/templates/BrokerPromotionExpiringEmail'
import React from 'react'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const { data: promotions } = await admin
    .from('promotions')
    .select('id, title, ends_at, broker_id, brokers(legal_name, user_id)')
    .eq('active', true)
    .gte('ends_at', now.toISOString())
    .lte('ends_at', in24h.toISOString())

  let notified = 0

  for (const promo of promotions ?? []) {
    const broker = promo.brokers as { legal_name: string; user_id: string } | null
    if (!broker) continue

    const { data: authUser } = await admin.auth.admin.getUserById(broker.user_id)
    const email = authUser?.user?.email
    if (!email) continue

    sendEmailFireAndForget({
      to: email,
      subject: `Promotion expiring soon: ${promo.title}`,
      react: React.createElement(BrokerPromotionExpiringEmail, {
        brokerName: broker.legal_name,
        promotionTitle: promo.title,
        expiresAt: new Date(promo.ends_at).toLocaleString(),
        appUrl: process.env.NEXT_PUBLIC_APP_URL!,
      }),
      idempotencyKey: `promo-expiring-${promo.id}-${now.toDateString()}`,
    })
    notified++
  }

  return NextResponse.json({ ok: true, notified })
}
