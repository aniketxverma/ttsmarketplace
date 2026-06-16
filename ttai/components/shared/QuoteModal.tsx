'use client'

import { useState } from 'react'
import { X, Quote, Send, Building2, CheckCircle2 } from 'lucide-react'

/**
 * Request-for-Quotation modal. Collects buyer details and sends the RFQ straight
 * to the supplier on WhatsApp (prefilled) — falls back to email when no WhatsApp.
 * No backend table needed: the buyer reaches the supplier directly.
 */
export function QuoteModal({
  open, onClose, company, whatsapp, email, productName,
}: {
  open: boolean
  onClose: () => void
  company: string
  whatsapp?: string | null
  email?: string | null
  productName?: string | null
}) {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', qty: '', target: '', message: '' })
  const [sent, setSent] = useState(false)
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))
  if (!open) return null

  const body = [
    `*Quotation Request — TTAI EMA*`,
    productName ? `Product: ${productName}` : null,
    `Supplier: ${company}`,
    '',
    `Name: ${form.name || '-'}`,
    form.company ? `Company: ${form.company}` : null,
    `Email: ${form.email || '-'}`,
    form.phone ? `Phone: ${form.phone}` : null,
    `Quantity: ${form.qty || '-'}`,
    form.target ? `Target price: ${form.target}` : null,
    form.message ? `\nMessage: ${form.message}` : null,
  ].filter(Boolean).join('\n')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = encodeURIComponent(body)
    if (whatsapp) window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${text}`, '_blank')
    else window.location.href = `mailto:${email || 'info@ttaiema.com'}?subject=${encodeURIComponent(`Quotation request — ${company}`)}&body=${text}`
    setSent(true)
  }

  const INPUT = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/30'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#0B1F4D] to-[#1a3a7a] text-white">
          <h3 className="font-extrabold flex items-center gap-2"><Quote className="w-5 h-5 text-[#F5A623]" /> Request a Quotation</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-extrabold text-gray-900">Request ready to send</p>
            <p className="text-sm text-gray-500 mt-1">We&apos;ve opened {whatsapp ? 'WhatsApp' : 'your email'} with your quotation to <strong>{company}</strong>. Just press send.</p>
            <button onClick={onClose} className="mt-5 rounded-xl bg-[#0B1F4D] text-white font-bold px-6 py-2.5 text-sm hover:bg-[#162d6e] transition-colors">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            <p className="text-xs text-gray-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> To: <strong className="text-gray-800">{company}</strong>{productName ? <> · {productName}</> : null}</p>
            <div className="grid grid-cols-2 gap-3">
              <input className={INPUT} required placeholder="Your name *" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <input className={INPUT} placeholder="Your company" value={form.company} onChange={(e) => set('company', e.target.value)} />
              <input className={INPUT} required type="email" placeholder="Email *" value={form.email} onChange={(e) => set('email', e.target.value)} />
              <input className={INPUT} placeholder="Phone / WhatsApp" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              <input className={INPUT} required placeholder="Quantity / MOQ *" value={form.qty} onChange={(e) => set('qty', e.target.value)} />
              <input className={INPUT} placeholder="Target price (optional)" value={form.target} onChange={(e) => set('target', e.target.value)} />
            </div>
            <textarea className={`${INPUT} h-20 resize-none`} placeholder="Message — specs, delivery terms, destination…" value={form.message} onChange={(e) => set('message', e.target.value)} />
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f7a3a] hover:bg-[#1a6a32] text-white font-extrabold py-3 text-sm transition-colors">
              <Send className="w-4 h-4" /> Send request {whatsapp ? 'via WhatsApp' : 'by email'}
            </button>
            <p className="text-[11px] text-gray-400 text-center">Goes directly to the supplier — no account needed.</p>
          </form>
        )}
      </div>
    </div>
  )
}
