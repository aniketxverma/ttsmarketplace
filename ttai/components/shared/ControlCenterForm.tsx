'use client'

import { useState } from 'react'
import { Store, Truck, Briefcase, Send, CheckCircle2 } from 'lucide-react'
import { DEPARTMENTS, type Department } from '@/lib/control-center'

const ICON: Record<Department, React.ReactNode> = {
  marketplace: <Store className="w-5 h-5" />,
  logistics:   <Truck className="w-5 h-5" />,
  consulting:  <Briefcase className="w-5 h-5" />,
}

/**
 * Public "send us a request" form that routes into the TTAIEMA Control Center.
 * The client picks a department; the ticket is auto-assigned to that manager and
 * lands in /admin/control-center. Drop it on any page (defaults to a contact box).
 */
export function ControlCenterForm({ defaultDepartment = 'marketplace' as Department, sourceForm = 'contact' }: {
  defaultDepartment?: Department
  sourceForm?: string
}) {
  const [department, setDepartment] = useState<Department>(defaultDepartment)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<null | { ticketNo: number | null; assignedTo: string }>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSending(true); setError(null)
    const f = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department,
          clientName: f.get('clientName'),
          companyName: f.get('companyName'),
          email: f.get('email'),
          phone: f.get('phone'),
          countryName: f.get('countryName'),
          subject: f.get('subject'),
          message: f.get('message'),
          attachmentUrl: f.get('attachmentUrl'),
          sourceForm,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error('failed')
      setDone({ ticketNo: data.ticketNo ?? null, assignedTo: data.assignedTo ?? '' })
    } catch {
      setError('Something went wrong. Please email info@ttaiema.com.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <h3 className="mt-3 text-xl font-extrabold text-[#0B1F4D]">Request received{done.ticketNo ? ` — ticket #${done.ticketNo}` : ''}</h3>
        <p className="text-gray-600 text-sm mt-2 max-w-md mx-auto">
          Thank you! Your request has been routed to <strong>{done.assignedTo}</strong> in our{' '}
          {DEPARTMENTS.find((d) => d.key === department)?.label}. We&rsquo;ll reply to your email shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
      <h3 className="text-xl font-extrabold text-[#0B1F4D]">Send us a request</h3>
      <p className="text-sm text-gray-500 mt-1">Choose the department and we&rsquo;ll route you to the right manager.</p>

      {/* Department selector */}
      <div className="grid sm:grid-cols-3 gap-2.5 mt-5">
        {DEPARTMENTS.map((d) => {
          const active = department === d.key
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setDepartment(d.key)}
              className={`text-left rounded-xl border p-3 transition-all ${active ? 'border-[#0B1F4D] bg-[#0B1F4D]/5 ring-1 ring-[#0B1F4D]' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${active ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-500'}`}>
                {ICON[d.key]}
              </span>
              <p className="mt-2 font-bold text-sm text-[#0B1F4D] leading-tight">{d.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{d.blurb}</p>
            </button>
          )
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        <Field name="clientName" label="Your name" required />
        <Field name="companyName" label="Company name" />
        <Field name="email" label="Email" type="email" required />
        <Field name="phone" label="Phone / WhatsApp" />
        <Field name="countryName" label="Country" />
        <Field name="subject" label="Subject" />
      </div>

      <label className="block mt-3">
        <span className="text-xs font-bold text-gray-600">Message</span>
        <textarea name="message" rows={4} required
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0B1F4D] focus:ring-1 focus:ring-[#0B1F4D] outline-none"
          placeholder="Tell us what you need…" />
      </label>

      <Field name="attachmentUrl" label="Attachment link (optional — Drive / Dropbox / WeTransfer)" />

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <button type="submit" disabled={sending}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3 text-sm font-bold hover:bg-[#fbb93a] transition-colors disabled:opacity-60">
        <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send request'}
      </button>
    </form>
  )
}

function Field({ name, label, type = 'text', required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">{label}{required && <span className="text-red-500"> *</span>}</span>
      <input name={name} type={type} required={required}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0B1F4D] focus:ring-1 focus:ring-[#0B1F4D] outline-none" />
    </label>
  )
}
