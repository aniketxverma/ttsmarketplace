'use client'

import { useMemo, useState } from 'react'
import { UserPlus, Users, MapPin, Check, Clock, Copy, MessageCircle, Trash2, X, Link2, Network, Store, Building2, Crown } from 'lucide-react'

type Member = {
  id: string
  company_name: string
  contact_person: string | null
  email: string | null
  whatsapp: string | null
  country: string | null
  city: string | null
  address: string | null
  level: string
  status: string
  token: string
  imported_catalog: boolean
  member_supplier_id: string | null
}

const LEVELS = [
  { value: 'customer',           label: 'Customer',           hint: 'View products · place orders',                Icon: Users },
  { value: 'sales_point',        label: 'Sales Point',        hint: 'Buy & sell · appear on the map',               Icon: Store },
  { value: 'distributor',        label: 'Distributor',        hint: 'Manage local sales points · own network',      Icon: Building2 },
  { value: 'master_distributor', label: 'Master Distributor', hint: 'Manage distributors · regional control',       Icon: Crown },
]
const LEVEL_META: Record<string, { label: string; cls: string }> = {
  customer:           { label: 'Customer',           cls: 'bg-gray-100 text-gray-700' },
  sales_point:        { label: 'Sales Point',        cls: 'bg-blue-100 text-blue-700' },
  distributor:        { label: 'Distributor',        cls: 'bg-purple-100 text-purple-700' },
  master_distributor: { label: 'Master Distributor', cls: 'bg-amber-100 text-amber-800' },
}

const INPUT = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 focus:border-[#0B1F4D] bg-white'
const emptyForm = () => ({ company_name: '', contact_person: '', email: '', whatsapp: '', country: '', city: '', address: '', level: 'sales_point' })

export function NetworkManager({ initialMembers, appUrl, inviterName }: { initialMembers: Member[]; appUrl: string; inviterName: string }) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justInvited, setJustInvited] = useState<{ link: string; member: Member; emailed?: boolean } | null>(null)
  const [copied, setCopied] = useState(false)

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const stats = useMemo(() => ({
    total: members.length,
    joined: members.filter((m) => m.status === 'accepted').length,
    pending: members.filter((m) => m.status === 'pending').length,
  }), [members])

  // Group by country for the network view.
  const byCountry = useMemo(() => {
    const map = new Map<string, Member[]>()
    for (const m of members) {
      const c = m.country?.trim() || 'No country set'
      if (!map.has(c)) map.set(c, [])
      map.get(c)!.push(m)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [members])

  function inviteLink(token: string) { return `${appUrl}/join/${token}` }
  function waLink(m: Member, link: string) {
    const msg = `${inviterName} has invited you to join its official sales network on TTAIEMA. Create your free store here: ${link}`
    const num = (m.whatsapp ?? '').replace(/\D/g, '')
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
  }

  async function submit() {
    if (!form.company_name.trim()) { setError('Company name is required'); return }
    setSaving(true); setError(null)
    const res = await fetch('/api/supplier/network', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invite', ...form }),
    })
    const j = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(j.error ?? 'Failed to create invite'); return }
    setMembers((list) => [j.invite, ...list])
    setJustInvited({ link: j.link, member: j.invite, emailed: j.emailed })
    setShowForm(false); setForm(emptyForm())
  }

  async function revoke(id: string) {
    if (!confirm('Remove this invitation / member?')) return
    const res = await fetch('/api/supplier/network', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoke', id }),
    })
    if (res.ok) setMembers((list) => list.filter((m) => m.id !== id))
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-6">
      {/* Stats + invite button */}
      <div className="flex flex-wrap items-center gap-3">
        <Stat Icon={Users} label="Network members" value={stats.total} />
        <Stat Icon={Check} label="Joined" value={stats.joined} accent="green" />
        <Stat Icon={Clock} label="Pending" value={stats.pending} accent="amber" />
        <button onClick={() => { setForm(emptyForm()); setShowForm(true); setError(null) }}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#162d6e]">
          <UserPlus className="w-4 h-4" /> Invite New Sales Point
        </button>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0B1F4D]/5 flex items-center justify-center mx-auto mb-3"><Network className="w-7 h-7 text-[#0B1F4D]" /></div>
          <h3 className="font-bold text-[#0B1F4D] mb-1">Build your sales network</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">Invite your shops, distributors and partners. They create a free store and can import your catalogue automatically — no manual product entry.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {byCountry.map(([country, list]) => (
            <div key={country}>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#0B1F4D]" />
                <h3 className="font-extrabold text-[#0B1F4D]">{country}</h3>
                <span className="text-xs text-gray-400">({list.length})</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-50">
                {list.map((m) => {
                  const link = inviteLink(m.token)
                  const lvl = LEVEL_META[m.level] ?? LEVEL_META.sales_point
                  const joined = m.status === 'accepted'
                  return (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1F4D] to-[#2563eb] text-white flex items-center justify-center font-extrabold flex-shrink-0">
                          {m.company_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[#0B1F4D] truncate">{m.company_name}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvl.cls}`}>{lvl.label}</span>
                            {joined
                              ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><Check className="w-2.5 h-2.5" />Joined</span>
                              : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full"><Clock className="w-2.5 h-2.5" />Invited</span>}
                            {m.imported_catalog && <span className="text-[10px] font-bold text-blue-600">· catalogue imported</span>}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{[m.contact_person, m.city, m.email].filter(Boolean).join(' · ') || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!joined && (
                          <>
                            <button onClick={() => copy(link)} title="Copy invite link" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#0B1F4D]"><Copy className="w-4 h-4" /></button>
                            {m.whatsapp && <a href={waLink(m, link)} target="_blank" rel="noreferrer" title="Send on WhatsApp" className="p-2 rounded-lg text-green-500 hover:bg-green-50"><MessageCircle className="w-4 h-4" /></a>}
                          </>
                        )}
                        <button onClick={() => revoke(m.id)} title="Remove" className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#0B1F4D]">Invite New Sales Point</h2>
                <p className="text-xs text-gray-400">They&apos;ll get a free store and can import your catalogue.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>

            {/* Level picker */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {LEVELS.map((l) => (
                <button key={l.value} type="button" onClick={() => set('level', l.value)}
                  className={`text-left rounded-xl border p-3 transition-colors ${form.level === l.value ? 'border-[#0B1F4D] bg-[#0B1F4D]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="flex items-center gap-1.5 font-bold text-sm text-[#0B1F4D]"><l.Icon className="w-4 h-4" />{l.label}</span>
                  <span className="block text-[11px] text-gray-400 mt-0.5">{l.hint}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Company name *</label><input className={INPUT} value={form.company_name} onChange={(e) => set('company_name', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Contact person</label><input className={INPUT} value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input className={INPUT} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label><input className={INPUT} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+34 6XX XXX XXX" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Country</label><input className={INPUT} value={form.country} onChange={(e) => set('country', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">City</label><input className={INPUT} value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Address</label><input className={INPUT} value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
            </div>

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            <button onClick={submit} disabled={saving} className="mt-4 w-full rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50">
              {saving ? 'Creating invite…' : 'Create invitation'}
            </button>
          </div>
        </div>
      )}

      {/* Post-invite: share link */}
      {justInvited && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setJustInvited(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3"><Link2 className="w-6 h-6 text-green-600" /></div>
            <h2 className="text-lg font-extrabold text-[#0B1F4D] text-center">Invitation ready for {justInvited.member.company_name}</h2>
            {justInvited.emailed
              ? <p className="text-xs font-bold text-green-600 text-center mt-1 mb-4">✓ We emailed the invitation to {justInvited.member.email}. You can also share the link below.</p>
              : <p className="text-xs text-gray-400 text-center mt-1 mb-4">Share this link — they create a free store and join your network.</p>}
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <input readOnly value={justInvited.link} className="flex-1 bg-transparent text-xs text-gray-600 outline-none" />
              <button onClick={() => copy(justInvited.link)} className="text-xs font-bold text-[#0B1F4D] hover:underline whitespace-nowrap">{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <div className="flex gap-2 mt-3">
              {justInvited.member.whatsapp && (
                <a href={waLink(justInvited.member, justInvited.link)} target="_blank" rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 text-white py-2.5 text-sm font-bold hover:bg-green-400">
                  <MessageCircle className="w-4 h-4" /> Send on WhatsApp
                </a>
              )}
              {justInvited.member.email && (
                <a href={`mailto:${justInvited.member.email}?subject=${encodeURIComponent(inviterName + ' invited you to its sales network')}&body=${encodeURIComponent('Join here: ' + justInvited.link)}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-[#0B1F4D] py-2.5 text-sm font-bold hover:border-[#0B1F4D]">
                  Email invite
                </a>
              )}
            </div>
            <button onClick={() => setJustInvited(null)} className="mt-3 w-full text-sm font-bold text-gray-400 hover:text-gray-700">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ Icon, label, value, accent }: { Icon: any; label: string; value: number; accent?: 'green' | 'amber' }) {
  const color = accent === 'green' ? 'text-green-600' : accent === 'amber' ? 'text-amber-600' : 'text-[#0B1F4D]'
  return (
    <div className="inline-flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-2.5">
      <Icon className={`w-4 h-4 ${color}`} />
      <div><p className="text-[10px] uppercase tracking-wide text-gray-400 leading-none">{label}</p><p className={`text-lg font-extrabold ${color} leading-tight`}>{value}</p></div>
    </div>
  )
}
