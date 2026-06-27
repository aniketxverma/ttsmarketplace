'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { X, Send, MessageCircle, Reply } from 'lucide-react'
import { useAuthGate } from '@/components/shared/AuthGate'

type Opp = { title: string; company_name?: string | null; contact_email?: string | null; contact_whatsapp?: string | null }

/** Interactive "Respond" to a business opportunity — opens a quick message modal
 *  (sign-in required) that composes an email or WhatsApp to the poster. */
export function OpportunityRespond({ o }: { o: Opp }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const { gate, modal } = useAuthGate({ title: 'Sign in to respond', subtitle: 'Create a free account to contact companies about their opportunities.' })
  const wa = o.contact_whatsapp ? o.contact_whatsapp.replace(/\D/g, '') : null

  return (
    <>
      <button onClick={() => gate(() => setOpen(true))}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F4D] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#162d6e] transition-colors">
        <Reply className="w-3.5 h-3.5" /> {t("Respond")}
      </button>
      {modal}
      {open && <RespondModal o={o} wa={wa} onClose={() => setOpen(false)} />}
    </>
  )
}

function RespondModal({ o, wa, onClose }: { o: Opp; wa: string | null; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', company: '', message: `Hi ${o.company_name ?? ''}, I'm interested in your opportunity: "${o.title}". ` })
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))
  const body = `Re: ${o.title}\n\nFrom: ${form.name || '-'}${form.company ? ` (${form.company})` : ''}\n\n${form.message}`

  const sendEmail = () => { if (o.contact_email) window.location.href = `mailto:${o.contact_email}?subject=${encodeURIComponent(`Opportunity: ${o.title}`)}&body=${encodeURIComponent(body)}`; onClose() }
  const sendWa = () => { if (wa) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(body)}`, '_blank', 'noopener'); onClose() }

  const input = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0B1F4D] focus:ring-1 focus:ring-[#0B1F4D] outline-none'

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
        <h3 className="text-lg font-extrabold text-[#0B1F4D]">Respond to opportunity</h3>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{o.title}</p>
        <div className="space-y-2.5 mt-4">
          <div className="grid grid-cols-2 gap-2.5">
            <input className={input} placeholder="Your name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <input className={input} placeholder="Company" value={form.company} onChange={(e) => set('company', e.target.value)} />
          </div>
          <textarea className={input} rows={4} value={form.message} onChange={(e) => set('message', e.target.value)} />
        </div>
        <div className="flex gap-2 mt-4">
          {o.contact_email && <button onClick={sendEmail} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-4 py-2.5 text-sm font-bold hover:bg-[#162d6e]"><Send className="w-4 h-4" /> Send email</button>}
          {wa && <button onClick={sendWa} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white px-4 py-2.5 text-sm font-bold hover:bg-[#1ea952]"><MessageCircle className="w-4 h-4" /> WhatsApp</button>}
        </div>
      </div>
    </div>
  )
}
