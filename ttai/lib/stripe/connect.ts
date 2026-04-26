import { stripe } from './client'

export async function createConnectAccount(params: {
  email: string
  legalName: string
  taxId: string
}) {
  return stripe.accounts.create({
    type: 'express',
    country: 'ES',
    email: params.email,
    business_type: 'individual',
    business_profile: { name: params.legalName },
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    tos_acceptance: { service_agreement: 'recipient' },
  })
}

export async function createAccountOnboardingLink(accountId: string, baseUrl: string) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/broker/onboarding?refresh=true`,
    return_url:  `${baseUrl}/broker/onboarding/complete`,
    type: 'account_onboarding',
  })
}

export async function getConnectAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)
  return {
    detailsSubmitted:          account.details_submitted,
    chargesEnabled:            account.charges_enabled,
    payoutsEnabled:            account.payouts_enabled,
    requirementsCurrentlyDue:  account.requirements?.currently_due ?? [],
  }
}

export async function transferToConnectAccount(params: {
  amountCents: number
  destinationAccountId: string
  orderId: string
}) {
  return stripe.transfers.create({
    amount:      params.amountCents,
    currency:    'eur',
    destination: params.destinationAccountId,
    metadata:    { order_id: params.orderId },
  })
}
