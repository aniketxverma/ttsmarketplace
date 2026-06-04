'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'

/**
 * Pricing CTA. Behaviour depends on the viewer:
 *  - not logged in        → send to login, returning to /pricing
 *  - free tier            → start Stripe checkout for this plan
 *  - already this/any paid → open the billing portal to manage/switch
 */
export function SubscribeButton({
  tier, label, loggedIn, isCurrent, hasPlan, className,
}: {
  tier: 'free' | 'standard' | 'pro' | 'full'
  label: string
  loggedIn: boolean
  isCurrent: boolean
  hasPlan: boolean
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function go() {
    setLoading(true)
    try {
      if (!loggedIn) {
        router.push(`/login?next=${encodeURIComponent('/pricing')}`)
        return
      }
      // Free plan, or managing an existing subscription → billing portal.
      const endpoint = tier === 'free' || hasPlan ? '/api/membership/portal' : '/api/membership/checkout'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json().catch(() => ({}))
      if (data?.url) { window.location.href = data.url; return }
      alert(data?.error ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const text = isCurrent ? 'Manage plan' : hasPlan ? 'Switch to this plan' : label

  return (
    <button onClick={go} disabled={loading || isCurrent}
      className={`inline-flex items-center justify-center gap-2 disabled:opacity-60 ${className ?? ''}`}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{text}<ArrowRight className="w-4 h-4" /></>}
    </button>
  )
}
