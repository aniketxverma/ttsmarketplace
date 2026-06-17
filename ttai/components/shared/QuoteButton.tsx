'use client'

import { useState } from 'react'
import { Quote } from 'lucide-react'
import { QuoteModal } from './QuoteModal'
import { useAuthGate } from './AuthGate'

// Client wrapper so server pages (supplier shop, product page) can drop in a
// working "Request a Quote" button that opens the RFQ modal. Requesting a quote
// requires sign-in; browsing stays open.
export function QuoteButton({ company, whatsapp, email, productName, className, label = 'Request a Quote' }: {
  company: string; whatsapp?: string | null; email?: string | null; productName?: string | null; className?: string; label?: string
}) {
  const [open, setOpen] = useState(false)
  const { gate, modal } = useAuthGate({ title: 'Sign in to request a quote', subtitle: 'Create a free account to send quotation requests to suppliers.' })
  return (
    <>
      <button type="button" onClick={() => gate(() => setOpen(true))} className={className}>
        <Quote className="w-4 h-4" /> {label}
      </button>
      <QuoteModal open={open} onClose={() => setOpen(false)} company={company} whatsapp={whatsapp} email={email} productName={productName} />
      {modal}
    </>
  )
}
