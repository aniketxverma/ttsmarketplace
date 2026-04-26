'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BrokerOnboardingCompletePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'complete' | 'incomplete'>('checking')

  useEffect(() => {
    fetch('/api/brokers/connect')
      .then((r) => r.json())
      .then((data) => {
        if (data.stripe_onboarding_complete) {
          setStatus('complete')
          setTimeout(() => router.push('/broker'), 2000)
        } else {
          setStatus('incomplete')
        }
      })
      .catch(() => setStatus('incomplete'))
  }, [router])

  if (status === 'checking') {
    return <div className="text-sm text-muted-foreground">Verifying Stripe connection...</div>
  }

  if (status === 'complete') {
    return (
      <div className="max-w-md mx-auto space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Stripe Connected!</h1>
        <p className="text-muted-foreground text-sm">Your Stripe account is verified. Redirecting to your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-4 text-center">
      <h1 className="text-2xl font-bold">Onboarding Incomplete</h1>
      <p className="text-muted-foreground text-sm">
        Stripe onboarding is not yet complete. Please finish all required steps.
      </p>
      <button
        onClick={() => router.push('/broker/onboarding')}
        className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
      >
        Return to Onboarding
      </button>
    </div>
  )
}
