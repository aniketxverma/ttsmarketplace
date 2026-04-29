'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewPromotionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!broker) { setError('Broker profile not found'); setLoading(false); return }

    const productId = fd.get('product_id') as string
    const slot = parseInt(fd.get('slot') as string)
    const pitch = fd.get('pitch') as string
    const startsAt = fd.get('starts_at') as string
    const endsAt = fd.get('ends_at') as string

    if (!productId || !slot || !startsAt || !endsAt) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('broker_promotions').insert({
      broker_id: broker.id,
      product_id: productId,
      promotion_slot: slot,
      custom_pitch: pitch || null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      is_active: true,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/broker/promotions')
    router.refresh()
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Promotion</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Promote a product in one of your 3 marketplace slots</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-5">
        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm px-4 py-3">{error}</div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Product ID <span className="text-destructive">*</span></label>
          <input
            name="product_id"
            required
            placeholder="Paste product UUID"
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">You can find product IDs in the marketplace URLs</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Slot <span className="text-destructive">*</span></label>
          <select
            name="slot"
            required
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select slot...</option>
            <option value="1">Slot 1 (Top)</option>
            <option value="2">Slot 2 (Middle)</option>
            <option value="3">Slot 3 (Bottom)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Custom Pitch</label>
          <textarea
            name="pitch"
            rows={3}
            placeholder="Write a compelling message for buyers..."
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Start Date <span className="text-destructive">*</span></label>
            <input
              type="date"
              name="starts_at"
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">End Date <span className="text-destructive">*</span></label>
            <input
              type="date"
              name="ends_at"
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Promotion'}
        </button>
      </form>
    </div>
  )
}
