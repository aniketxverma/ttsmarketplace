'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { useRouter } from 'next/navigation'
import { Building2, Users, Send, CheckCircle2 } from 'lucide-react'
import { POINTS_PER_REFERRAL } from '@/lib/broker'

/** Broker registers a Supplier or Buyer reference into their protected network. */
export function ReferForm() {
  const t = useT()
  const router = useRouter()
  const [type, setType] = useState<'supplier' | 'buyer'>('supplier')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSending(true); setError(null)
    const f = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/broker/refer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyType: type, companyName: f.get('companyName'), contactName: f.get('contactName'),
          contactEmail: f.get('contactEmail'), contactPhone: f.get('contactPhone'),
          countryName: f.get('countryName'), category: f.get('category'), notes: f.get('notes'),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'failed')
      setDone(true); router.refresh()
    } catch (err: any) { setError(err.message === 'failed' ? 'Something went wrong.' : err.message) }
    finally { setSending(false) }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-100 bg-white p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
        <p className="mt-2 font-extrabold text-[#0B1F4D]">Reference registered · +{POINTS_PER_REFERRAL} {t("points")}</p>
        <p className="text-sm text-gray-500 mt-1">{t("This company is now permanently linked to your Broker ID.")}</p>
        <button onClick={() => setDone(false)} className="mt-3 text-sm font-bold text-[#0B1F4D] underline">{t("Register another")}</button>
      </div>
    )
  }

  const input = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0B1F4D] focus:ring-1 focus:ring-[#0B1F4D] outline-none'
  const lbl = 'text-xs font-bold text-gray-600'

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-extrabold text-[#0B1F4D]">{t("Register a reference")}</h3>
      <p className="text-sm text-gray-500 mt-0.5">Add a company to your protected network · +{POINTS_PER_REFERRAL} {t("connection points each.")}</p>

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {([['supplier', 'Supplier', Building2], ['buyer', 'Buyer / Client', Users]] as const).map(([k, label, Icon]) => (
          <button key={k} type="button" onClick={() => setType(k)}
            className={`rounded-xl border-2 p-3 flex items-center gap-2.5 transition-all ${type === k ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.04]' : 'border-gray-200 hover:border-gray-300'}`}>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${type === k ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-500'}`}><Icon className="w-4 h-4" /></span>
            <span className="font-bold text-sm text-[#0B1F4D]">{label}</span>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <label className="block sm:col-span-2"><span className={lbl}>{t("Company name *")}</span><input name="companyName" required className={input} /></label>
        <label className="block"><span className={lbl}>{t("Contact name")}</span><input name="contactName" className={input} /></label>
        <label className="block"><span className={lbl}>{t("Country")}</span><input name="countryName" className={input} /></label>
        <label className="block"><span className={lbl}>{t("Email")}</span><input name="contactEmail" type="email" className={input} /></label>
        <label className="block"><span className={lbl}>{t("Phone / WhatsApp")}</span><input name="contactPhone" className={input} /></label>
        <label className="block"><span className={lbl}>{t("Category / sector")}</span><input name="category" className={input} placeholder={t("e.g. Electronics")} /></label>
        <label className="block sm:col-span-2"><span className={lbl}>{t("Notes")}</span><textarea name="notes" rows={2} className={input} /></label>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      <button type="submit" disabled={sending}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3 text-sm font-bold hover:bg-[#fbb93a] transition-colors disabled:opacity-60">
        <Send className="w-4 h-4" /> {sending ? 'Saving…' : 'Register reference'}
      </button>
    </form>
  )
}
