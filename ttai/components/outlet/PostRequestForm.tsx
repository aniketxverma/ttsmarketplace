'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Megaphone, Send, CheckCircle2 } from 'lucide-react'
import { CONDITIONS, SELLING_UNITS, OUTLET_CATEGORIES } from '@/lib/outlet'

/** Post a buying request or selling opportunity to the Outlet Zone trade board. */
export function PostRequestForm({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter()
  const [kind, setKind] = useState<'buy' | 'sell'>('buy')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSending(true); setError(null)
    const f = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/trade-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          title: f.get('title'), companyName: f.get('companyName'), category: f.get('category'),
          brand: f.get('brand'), condition: f.get('condition'), sellingUnit: f.get('sellingUnit'),
          quantity: f.get('quantity'), budget: f.get('budget'), countryName: f.get('countryName'),
          description: f.get('description'), contactEmail: f.get('contactEmail'), contactWhatsapp: f.get('contactWhatsapp'),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'failed')
      setDone(true); router.refresh()
    } catch (err: any) {
      setError(err.message === 'failed' ? 'Something went wrong. Try again.' : err.message)
    } finally { setSending(false) }
  }

  if (!loggedIn) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <p className="font-bold text-[#0B1F4D]">Post a buying request or selling opportunity</p>
        <p className="text-sm text-gray-500 mt-1">Log in to post on the trade board — brokers, suppliers and buyers welcome.</p>
        <a href="/login" className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-6 py-3 text-sm font-bold mt-4 hover:bg-[#162d6e] transition-colors">Log in to post</a>
      </div>
    )
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-100 bg-white p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <p className="mt-3 text-lg font-extrabold text-[#0B1F4D]">Posted to the trade board</p>
        <p className="text-sm text-gray-500 mt-1">Your {kind === 'buy' ? 'buying request' : 'selling opportunity'} is now live. Buyers and sellers can contact you directly.</p>
        <button onClick={() => setDone(false)} className="mt-4 text-sm font-bold text-[#0B1F4D] underline">Post another</button>
      </div>
    )
  }

  const input = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0B1F4D] focus:ring-1 focus:ring-[#0B1F4D] outline-none'
  const lbl = 'text-xs font-bold text-gray-600'

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">
      <h3 className="text-lg font-extrabold text-[#0B1F4D]">Post to the trade board</h3>
      <p className="text-sm text-gray-500 mt-0.5">Brokers, suppliers and outlet buyers — publish what you need or what you have.</p>

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {([['buy', 'Buying request', ShoppingCart], ['sell', 'Selling opportunity', Megaphone]] as const).map(([k, label, Icon]) => (
          <button key={k} type="button" onClick={() => setKind(k)}
            className={`rounded-xl border-2 p-3 flex items-center gap-2.5 transition-all ${kind === k ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.04]' : 'border-gray-200 hover:border-gray-300'}`}>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${kind === k ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-500'}`}><Icon className="w-4 h-4" /></span>
            <span className="font-bold text-sm text-[#0B1F4D]">{label}</span>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <label className="block sm:col-span-2"><span className={lbl}>Title *</span>
          <input name="title" required className={input} placeholder={kind === 'buy' ? 'e.g. Looking for 5 pallets of mixed electronics returns' : 'e.g. 2 truckloads Bosch overstock available'} /></label>
        <label className="block"><span className={lbl}>Company</span><input name="companyName" className={input} /></label>
        <label className="block"><span className={lbl}>Country</span><input name="countryName" className={input} placeholder="e.g. Spain" /></label>
        <label className="block"><span className={lbl}>Category</span>
          <input name="category" list="tb-cats" className={input} placeholder="e.g. Electronics" />
          <datalist id="tb-cats">{OUTLET_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></label>
        <label className="block"><span className={lbl}>Brand</span><input name="brand" className={input} placeholder="e.g. Samsung (or Mixed)" /></label>
        <label className="block"><span className={lbl}>Condition</span>
          <select name="condition" className={input}><option value="">Any</option>{CONDITIONS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></label>
        <label className="block"><span className={lbl}>Unit</span>
          <select name="sellingUnit" className={input}><option value="">Any</option>{SELLING_UNITS.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}</select></label>
        <label className="block"><span className={lbl}>Quantity</span><input name="quantity" className={input} placeholder="e.g. 5 pallets / 1x40ft" /></label>
        <label className="block"><span className={lbl}>Budget / Price</span><input name="budget" className={input} placeholder="e.g. €8,000 or Ask" /></label>
        <label className="block sm:col-span-2"><span className={lbl}>Details</span>
          <textarea name="description" rows={3} className={input} placeholder="Anything that helps the other side respond fast…" /></label>
        <label className="block"><span className={lbl}>Contact email</span><input name="contactEmail" type="email" className={input} placeholder="(defaults to your account email)" /></label>
        <label className="block"><span className={lbl}>WhatsApp</span><input name="contactWhatsapp" className={input} placeholder="+34…" /></label>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      <button type="submit" disabled={sending}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3 text-sm font-bold hover:bg-[#fbb93a] transition-colors disabled:opacity-60">
        <Send className="w-4 h-4" /> {sending ? 'Posting…' : 'Post to board'}
      </button>
    </form>
  )
}
