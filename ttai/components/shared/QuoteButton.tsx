'use client'

import { useState } from 'react'
import { Quote } from 'lucide-react'
import { QuoteModal } from './QuoteModal'

// Client wrapper so server pages (supplier shop, product page) can drop in a
// working "Request a Quote" button that opens the RFQ modal.
export function QuoteButton({ company, whatsapp, email, productName, className, label = 'Request a Quote' }: {
  company: string; whatsapp?: string | null; email?: string | null; productName?: string | null; className?: string; label?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Quote className="w-4 h-4" /> {label}
      </button>
      <QuoteModal open={open} onClose={() => setOpen(false)} company={company} whatsapp={whatsapp} email={email} productName={productName} />
    </>
  )
}
