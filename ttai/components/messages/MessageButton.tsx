'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  supplierId?: string
  buyerId?: string
  orderId?: string
  subject?: string
  redirectBase: string  // e.g. '/buyer/messages' or '/supplier/messages'
  className?: string
  children?: React.ReactNode
}

export function MessageButton({
  supplierId,
  buyerId,
  orderId,
  subject,
  redirectBase,
  className,
  children,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierId, buyerId, orderId, subject }),
    })

    if (res.status === 401) { router.push('/login'); return }

    if (res.ok) {
      const { id } = await res.json()
      router.push(`${redirectBase}/${id}`)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        'flex items-center gap-2 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] px-5 py-2.5 text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all disabled:opacity-50'
      }
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )}
      {children ?? 'Message Supplier'}
    </button>
  )
}
