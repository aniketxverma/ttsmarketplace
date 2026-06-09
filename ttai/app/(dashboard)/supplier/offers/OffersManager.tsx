'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Megaphone, X, Check, Copy, MessageCircle, Mail, Trash2, Tag, Users, Send } from 'lucide-react'

type Product = { id: string; name: string; price_cents: number; currency: string; image: string | null; published: boolean }
type Contact = { company_name: string; email: string | null; whatsapp: string | null; level: string; status: string }
type Offer = { id: string; token: string; title: string; message: string | null; discount_pct: number | null; product_ids: string[]; audience: string; created_at: string }

const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'end_user', label: 'End users' },
  { value: 'retail', label: 'Retail shops' },
  { value: 'b2b', label: 'B2B / wholesale' },
  { value: 'customer', label: 'Customers' },
  { value: 'sales_point', label: 'Sales points' },
  { value: 'distributor', label: 'Distributors' },
]
const LEVEL_TO_AUD: Record<string, string[]> = {
  customer: ['all', 'customer', 'end_user', 'retail'],
  sales_point: ['all', 'sales_point', 'retail', 'b2b'],
  distributor: ['all', 'distributor', 'b2b'],
  master_distributor: ['all', 'distributor', 'b2b'],
}
const INPUT = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 focus:border-[#0B1F4D] bg-white'
const empty = () => ({ title: '', message: '', discount_pct: '', audience: 'all', product_ids: [] as string[] })

export function OffersManager({ products, contacts, initialOffers, appUrl, supplierName }: {
  products: Product[]; contacts: Contact[]; initialOffers: Offer[]; appUrl: string; supplierName: string
}) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<{ offer: Offer; link: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))
  const offerLink = (token: string) => `${appUrl}/o/${token}`

  function audienceContacts(audience: string): Contact[] {
    if (audience === 'all') return contacts
    return contacts.filter((c) => (LEVEL_TO_AUD[c.level] ?? ['all']).includes(audience))
  }
  function waLink(c: Contact, link: string, title: string) {
    const msg = `${supplierName}: ${title} 👉 ${link}`
    return `https://wa.me/${(c.whatsapp ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }
  function mailLink(c: Contact, link: string, title: string, message: string | null) {
    return `mailto:${c.email}?subject=${encodeURIComponent(`${supplierName} — ${title}`)}&body=${encodeURIComponent(`${message ? message + '\n\n' : ''}View the offer: ${link}`)}`
  }

  function toggleProduct(id: string) {
    set('product_ids', form.product_ids.includes(id) ? form.product_ids.filter((p) => p !== id) : [...form.product_ids, id])
  }

  async function create() {
    if (!form.title.trim()) { setError('Give your offer a title'); return }
    setSaving(true); setError(null)
    const res = await fetch('/api/supplier/offers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...form }),
    })
    const j = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(j.error ?? 'Failed to create offer'); return }
    setOffers((o) => [j.offer, ...o])
    setShowForm(false); setForm(empty())
    setSent({ offer: j.offer, link: j.link })
  }

  async function remove(id: string) {
    if (!confirm('Delete this offer?')) return
    const res = await fetch('/api/supplier/offers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) })
    if (res.ok) setOffers((o) => o.filter((x) => x.id !== id))
  }

  function copy(text: string) { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Stat Icon={Megaphone} label="Offers sent" value={offers.length} />
        <Stat Icon={Users} label="Network contacts" value={contacts.length} />
        <button onClick={() => { setForm(empty()); setShowForm(true); setError(null) }}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#162d6e]">
          <Megaphone className="w-4 h-4" /> New Offer
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F5A623]/10 flex items-center justify-center mx-auto mb-3"><Megaphone className="w-7 h-7 text-[#F5A623]" /></div>
          <h3 className="font-bold text-[#0B1F4D] mb-1">Promote to your clients</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">Create an offer with your products + a discount, then send it to your network by WhatsApp or email.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => {
            const link = offerLink(o.token)
            const aud = AUDIENCES.find((a) => a.value === o.audience)?.label ?? 'Everyone'
            return (
              <div key={o.id} className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[#0B1F4D] truncate">{o.title}</p>
                    {o.discount_pct ? <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700">−{o.discount_pct}%</span> : null}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{aud}</span>
                    <span className="text-[10px] text-gray-400">{(o.product_ids ?? []).length} products</span>
                  </div>
                  {o.message && <p className="text-xs text-gray-400 truncate mt-0.5">{o.message}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setSent({ offer: o, link })} className="inline-flex items-center gap-1 rounded-lg bg-[#0B1F4D] text-white px-3 py-1.5 text-xs font-bold hover:bg-[#162d6e]"><Send className="w-3.5 h-3.5" /> Send</button>
                  <a href={link} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#0B1F4D]" title="Preview"><Tag className="w-4 h-4" /></a>
                  <button onClick={() => remove(o.id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Compose */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-extrabold text-[#0B1F4D]">New Offer</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Offer title *</label><input className={INPUT} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Summer cleaning deal — 20% off" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500 uppercase">Discount %</label><input className={INPUT} type="number" min="0" max="100" value={form.discount_pct} onChange={(e) => set('discount_pct', e.target.value)} placeholder="optional" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Audience</label>
                  <select className={INPUT + ' bg-white'} value={form.audience} onChange={(e) => set('audience', e.target.value)}>
                    {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label} ({audienceContacts(a.value).length})</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Message</label><textarea className={`${INPUT} h-20 resize-none`} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="A short note for your clients…" /></div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Featured products ({form.product_ids.length})</label>
                <div className="mt-1.5 grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1">
                  {products.map((p) => {
                    const on = form.product_ids.includes(p.id)
                    return (
                      <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                        className={`relative aspect-square rounded-lg border overflow-hidden ${on ? 'border-[#0B1F4D] ring-2 ring-[#0B1F4D]/30' : 'border-gray-200'}`}>
                        {p.image ? <Image src={p.image} alt="" fill className="object-contain p-0.5" sizes="60px" /> : <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-[9px] p-1 text-center">{p.name.slice(0, 18)}</span>}
                        {on && <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#0B1F4D] text-white flex items-center justify-center"><Check className="w-2.5 h-2.5" /></span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            <button onClick={create} disabled={saving} className="mt-4 w-full rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50">{saving ? 'Creating…' : 'Create &amp; send'}</button>
          </div>
        </div>
      )}

      {/* Send sheet */}
      {sent && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSent(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div><h2 className="text-lg font-extrabold text-[#0B1F4D]">Send “{sent.offer.title}”</h2><p className="text-xs text-gray-400">To {AUDIENCES.find((a) => a.value === sent.offer.audience)?.label ?? 'everyone'}</p></div>
              <button onClick={() => setSent(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 mb-3">
              <input readOnly value={sent.link} className="flex-1 bg-transparent text-xs text-gray-600 outline-none" />
              <button onClick={() => copy(sent.link)} className="text-xs font-bold text-[#0B1F4D] hover:underline">{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            {(() => {
              const list = audienceContacts(sent.offer.audience)
              if (!list.length) return <p className="text-sm text-gray-400 text-center py-4">No contacts in this audience yet. Invite some in <span className="font-semibold">Sales Network</span>, then share the link above.</p>
              return (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-500 uppercase">{list.length} recipient{list.length === 1 ? '' : 's'}</p>
                  {list.map((c, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2">
                      <span className="text-sm font-semibold text-[#0B1F4D] truncate">{c.company_name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {c.whatsapp && <a href={waLink(c, sent.link, sent.offer.title)} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-green-500 hover:bg-green-50" title="WhatsApp"><MessageCircle className="w-4 h-4" /></a>}
                        {c.email && <a href={mailLink(c, sent.link, sent.offer.title, sent.offer.message)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50" title="Email"><Mail className="w-4 h-4" /></a>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ Icon, label, value }: { Icon: any; label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-2.5">
      <Icon className="w-4 h-4 text-[#0B1F4D]" />
      <div><p className="text-[10px] uppercase tracking-wide text-gray-400 leading-none">{label}</p><p className="text-lg font-extrabold text-[#0B1F4D] leading-tight">{value}</p></div>
    </div>
  )
}
