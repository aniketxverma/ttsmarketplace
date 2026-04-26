'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutButtonProps {
  productId: string
  disabled?: boolean
}

export function CheckoutButton({ productId, disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)

    const idempotencyKey = `${productId}-${Date.now()}`

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity: 1, idempotency_key: idempotencyKey }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Checkout failed')
      setLoading(false)
      return
    }

    if (data.checkout_url) {
      window.location.href = data.checkout_url
      return
    }

    const stripe = await stripePromise
    if (stripe && data.session_id) {
      await stripe.redirectToCheckout({ sessionId: data.session_id })
    }

    setLoading(false)
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCheckout}
        disabled={disabled || loading}
        className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Buy Now'}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
