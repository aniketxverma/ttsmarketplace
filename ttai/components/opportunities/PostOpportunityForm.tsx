'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { useRouter } from 'next/navigation'
import { Send, CheckCircle2, Megaphone, Search } from 'lucide-react'
import { POSTER_ROLES, AUDIENCES, LOOKING_FOR, DEFAULT_AUDIENCE, type ChainRole } from '@/lib/opportunities'

/** Publish a business opportunity. Audience auto-fills from the chain rule for the
 *  selected poster role, and can be adjusted. */
export function PostOpportunityForm({ loggedIn }: { loggedIn: boolean }) {
  const t = useT()
  const router = useRouter()
  const [kind, setKind] = useState<'looking' | 'promotion'>('looking')
  const [posterRole, setPosterRole] = useState<'factory' | 'supplier' | 'distributor' | 'retail'>('supplier')
  const [audience, setAudience] = useState<ChainRole[]>(DEFAULT_AUDIENCE['supplier'])
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickRole(r: typeof posterRole) {
    setPosterRole(r)
    setAudience(DEFAULT_AUDIENCE[r] ?? [])
  }
  function toggleAud(a: ChainRole) {
    setAudience((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSending(true); setError(null)
    const f = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/opportunity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind, posterRole, audience,
          companyName: f.get('companyName'), lookingFor: f.get('lookingFor'),
          title: f.get('title'), description: f.get('description'), product: f.get('product'),
          category: f.get('category'), countryTarget: f.get('countryTarget'),
          contactEmail: f.get('contactEmail'), contactWhatsapp: f.get('contactWhatsapp'),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'failed')
      setDone(true); router.refresh()
    } catch (err: any) { setError(err.message === 'failed' ? 'Something went wrong.' : err.message) }
    finally { setSending(false) }
  }

  if (!loggedIn) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <p className="font-bold text-[#0B1F4D]">{t("Post a business opportunity")}</p>
        <p className="text-sm text-gray-500 mt-1">Log in to publish what you&rsquo;re looking for, or a promotion.</p>
        <a href="/login" className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-6 py-3 text-sm font-bold mt-4 hover:bg-[#162d6e]">{t("Log in")}</a>
      </div>
    )
  }
  if (done) {
    return (
      <div className="rounded-2xl border border-green-100 bg-white p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <p className="mt-3 text-lg font-extrabold text-[#0B1F4D]">{t("Opportunity published")}</p>
        <p className="text-sm text-gray-500 mt-1">It&rsquo;s now visible to {audience.join(', ') || 'the chain'}.</p>
        <button onClick={() => setDone(false)} className="mt-4 text-sm font-bold text-[#0B1F4D] underline">{t("Post another")}</button>
      </div>
    )
  }

  const input = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0B1F4D] focus:ring-1 focus:ring-[#0B1F4D] outline-none'
  const lbl = 'text-xs font-bold text-gray-600'

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-extrabold text-[#0B1F4D]">{t("Post an opportunity")}</h3>
      <p className="text-sm text-gray-500 mt-0.5">{t("Tell the network what you need — it reaches the right level of the chain.")}</p>

      {/* Kind */}
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {([['looking', 'Looking for…', Search], ['promotion', 'Promotion', Megaphone]] as const).map(([k, label, Icon]) => (
          <button key={k} type="button" onClick={() => setKind(k)}
            className={`rounded-xl border-2 p-3 flex items-center gap-2.5 transition-all ${kind === k ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.04]' : 'border-gray-200 hover:border-gray-300'}`}>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${kind === k ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-500'}`}><Icon className="w-4 h-4" /></span>
            <span className="font-bold text-sm text-[#0B1F4D]">{label}</span>
          </button>
        ))}
      </div>

      {/* Poster role */}
      <div className="mt-4">
        <span className={lbl}>{t("I am a")}</span>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {POSTER_ROLES.map((r) => (
            <button key={r.key} type="button" onClick={() => pickRole(r.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${posterRole === r.key ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* Audience (chain visibility) */}
      <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
        <span className={lbl}>{t("Who should see this?")}</span>
        <p className="text-[11px] text-gray-400 mb-2">{t("Auto-set from the chain rule for a")} {posterRole} — adjust if needed.</p>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((a) => (
            <button key={a.key} type="button" onClick={() => toggleAud(a.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${audience.includes(a.key) ? 'bg-[#F5A623] text-[#0B1F4D]' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{a.label}</button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <label className="block sm:col-span-2"><span className={lbl}>{t("Title *")}</span>
          <input name="title" required className={input} placeholder={kind === 'looking' ? 'e.g. Looking for distributors in Spain, Portugal & Africa' : 'e.g. Promo: 20% off olive oil — full pallets'} /></label>
        <label className="block"><span className={lbl}>{t("Company")}</span><input name="companyName" className={input} /></label>
        {kind === 'looking' && (
          <label className="block"><span className={lbl}>{t("Looking for")}</span>
            <select name="lookingFor" className={input}><option value="">—</option>{LOOKING_FOR.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}</select></label>
        )}
        <label className="block"><span className={lbl}>{t("Category / sector")}</span><input name="category" className={input} placeholder={t("e.g. Food & Beverage")} /></label>
        <label className="block"><span className={lbl}>{t("Target countries")}</span><input name="countryTarget" className={input} placeholder={t("e.g. Spain, Portugal, Africa")} /></label>
        <label className="block sm:col-span-2"><span className={lbl}>{t("Product / details")}</span><textarea name="description" rows={3} className={input} /></label>
        <label className="block"><span className={lbl}>{t("Contact email")}</span><input name="contactEmail" type="email" className={input} placeholder="(defaults to your account)" /></label>
        <label className="block"><span className={lbl}>{t("WhatsApp")}</span><input name="contactWhatsapp" className={input} placeholder="+34…" /></label>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      <button type="submit" disabled={sending}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3 text-sm font-bold hover:bg-[#fbb93a] transition-colors disabled:opacity-60">
        <Send className="w-4 h-4" /> {sending ? 'Publishing…' : 'Publish opportunity'}
      </button>
    </form>
  )
}
