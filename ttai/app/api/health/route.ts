import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {
    database: 'fail',
    stripe: 'fail',
    resend: 'fail',
  }

  try {
    const admin = createAdminClient()
    await admin.from('countries').select('iso_code').limit(1)
    checks.database = 'ok'
  } catch {}

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })
    await stripe.balance.retrieve()
    checks.stripe = 'ok'
  } catch {}

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      })
      if (res.ok) checks.resend = 'ok'
    } catch {}
  } else {
    checks.resend = 'ok'
  }

  const allOk = Object.values(checks).every((v) => v === 'ok')
  const status = allOk ? 'ok' : Object.values(checks).some((v) => v === 'ok') ? 'degraded' : 'down'

  return NextResponse.json({
    status,
    checks,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
  }, { status: allOk ? 200 : 503 })
}
