'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface BrokerStatus {
  stripe_onboarding_complete: boolean
  status: string
  legal_name: string
}

export default function BrokerOnboardingPage() {
  const router = useRouter()
  const [broker, setBroker] = useState<BrokerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/brokers/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push('/broker/register')
        } else {
          setBroker(data)
          if (data.stripe_onboarding_complete) {
            router.push('/broker')
          }
        }
      })
      .catch(() => setError('Failed to load broker data'))
      .finally(() => setLoading(false))
  }, [router])

  async function handleConnect() {
    setConnecting(true)
    setError(null)
    const res = await fetch('/api/brokers/connect', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setConnecting(false); return }
    window.location.href = data.url
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connect Stripe Account</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          You need a Stripe account to receive payouts as a broker
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="space-y-1">
          <p className="text-sm font-medium">Application Status</p>
          <p className="text-sm text-muted-foreground">
            {broker?.status === 'pending' ? 'Your broker application is pending admin review.' : `Status: ${broker?.status}`}
          </p>
        </div>

        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium">Why connect Stripe?</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Receive your broker commission payouts automatically</li>
            <li>• Full KYC/KYB compliance via Stripe Connect</li>
            <li>• Payouts released after supplier fulfillment</li>
          </ul>
        </div>

        {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}

        <button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {connecting ? 'Redirecting to Stripe...' : 'Connect with Stripe'}
        </button>
      </div>
    </div>
  )
}
