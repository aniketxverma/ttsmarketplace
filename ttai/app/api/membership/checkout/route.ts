import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'
import { priceForTier } from '@/lib/stripe/membership'

/**
 * Start a membership subscription checkout.
 * POST { tier: 'standard' | 'pro' | 'full' } → { url } (Stripe Checkout).
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tier } = await req.json().catch(() => ({})) as { tier?: string }
  const priceId = tier ? priceForTier(tier) : null
  if (!priceId || !tier) {
    return NextResponse.json({ error: 'This plan is not available for online checkout yet.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('id', user.id)
    .single()

  // Ensure a Stripe customer exists and is stored on the profile.
  let customerId = (profile as any)?.stripe_customer_id as string | null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: (profile as any)?.full_name ?? undefined,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await (admin.from('profiles') as any).update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // Carry context so the webhook can map the subscription back to this user + tier.
    metadata: { kind: 'membership', user_id: user.id, tier },
    subscription_data: { metadata: { kind: 'membership', user_id: user.id, tier } },
    success_url: `${appUrl}/dashboard?membership=success`,
    cancel_url:  `${appUrl}/pricing?membership=cancelled`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
