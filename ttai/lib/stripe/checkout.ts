import { stripe } from './client'
import type Stripe from 'stripe'

export async function createCheckoutSession(params: {
  orderId: string
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
  successUrl: string
  cancelUrl: string
  brokerStripeAccountId: string | null
  transferAmountCents: number
}) {
  return stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: params.lineItems,
    payment_intent_data: params.brokerStripeAccountId
      ? {
          transfer_data: { destination: params.brokerStripeAccountId },
        }
      : undefined,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { order_id: params.orderId },
    payment_method_types: ['card'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
    billing_address_collection: 'required',
  })
}
