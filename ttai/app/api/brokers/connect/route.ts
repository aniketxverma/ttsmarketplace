import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createConnectAccount, createAccountOnboardingLink, getConnectAccountStatus } from '@/lib/stripe/connect'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: broker } = await supabase.from('brokers').select('*').eq('user_id', user.id).single()
  if (!broker) return NextResponse.json({ error: 'Broker not found' }, { status: 404 })
  if (broker.stripe_onboarding_complete) return NextResponse.json({ error: 'Already onboarded' }, { status: 409 })

  let stripeAccountId = broker.stripe_account_id

  if (!stripeAccountId) {
    const account = await createConnectAccount({
      email:     user.email!,
      legalName: broker.legal_name,
      taxId:     broker.tax_id,
    })
    stripeAccountId = account.id
    await supabase.from('brokers').update({ stripe_account_id: stripeAccountId }).eq('id', broker.id)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!
  const link = await createAccountOnboardingLink(stripeAccountId, baseUrl)

  return NextResponse.json({ url: link.url })
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: broker } = await supabase.from('brokers').select('*').eq('user_id', user.id).single()
  if (!broker) return NextResponse.json({ error: 'Broker not found' }, { status: 404 })

  if (!broker.stripe_account_id) {
    return NextResponse.json({ status: 'not_started' })
  }

  const status = await getConnectAccountStatus(broker.stripe_account_id)

  if (status.detailsSubmitted && status.chargesEnabled && !broker.stripe_onboarding_complete) {
    await supabase.from('brokers').update({ stripe_onboarding_complete: true }).eq('id', broker.id)
  }

  return NextResponse.json({ status: 'onboarded', ...status })
}
