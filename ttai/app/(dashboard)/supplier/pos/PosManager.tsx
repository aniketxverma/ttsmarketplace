'use client'

import { useState } from 'react'

const POS_TYPES = [
  { value: 'shop',         label: 'Retail Shop',      color: 'bg-blue-100 text-blue-700' },
  { value: 'warehouse',    label: 'Warehouse',         color: 'bg-gray-100 text-gray-700' },
  { value: 'distributor',  label: 'Distributor',       color: 'bg-amber-100 text-amber-700' },
  { value: 'pickup_point', label: 'Pickup Point',      color: 'bg-green-100 text-green-700' },
  { value: 'franchise',    label: 'Franchise',         color: 'bg-purple-100 text-purple-700' },
  { value: 'client_store', label: 'Client Store',      color: 'bg-pink-100 text-pink-700' },
  { value: 'agent_office', label: 'Agent Office',      color: 'bg-indigo-100 text-indigo-700' },
  { value: 'export_hub',   label: 'Export Hub',        color: 'bg-teal-100 text-teal-700' },
]

const STATUS_COLORS: Record<string, string> = {
  active:              'bg-green-100 text-green-700',
  temporarily_closed:  'bg-yellow-100 text-yellow-700',
  closed:              'bg-red-100 text-red-700',
}

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS: Record<string, string> = {
  monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun'
}

const DEFAULT_HOURS = {
  monday:    { open: '09:00', close: '18:00', closed: false },
  tuesday:   { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday:  { open: '09:00', close: '18:00', closed: false },
  friday:    { open: '09:00', close: '18:00', closed: false },
  saturday:  { open: '10:00', close: '14:00', closed: false },
  sunday:    { open: '',      close: '',      closed: true  },
}

const SERVICES = ['Samples', 'Pickup', 'Returns', 'Walk-in Viewing', 'Export Docs', 'Bulk Orders']

interface PosItem {
  id: string
  name: string
  type: string
  status: string
  is_public: boolean
  sort_order: number
  pos_locations: { id?: string; address_line1?: string; city?: string; country?: string; latitude?: number; longitude?: number } | null
  pos_details: { id?: string; phone?: string; whatsapp?: string; email?: string; manager_name?: string; accepts_walk_ins?: boolean; accepts_orders?: boolean; services_offered?: string[]; opening_hours?: Record<string, any> } | null
}

interface Props { supplierId: string; initialPosList: PosItem[] }

const INPUT = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 focus:border-[#0B1F4D] bg-white'

function emptyForm() {
  return {
    name: '', type: 'shop', status: 'active', is_public: true,
    address_line1: '', city: '', region: '', postal_code: '', country: '',
    latitude: '', longitude: '',
    manager_name: '', phone: '', whatsapp: '', email: '',
    accepts_walk_ins: true, accepts_orders: true,
    services_offered: [] as string[],
    notes: '',
    opening_hours: DEFAULT_HOURS as Record<string, any>,
  }
}

export function PosManager({ initialPosList }: Props) {
  const [posList, setPosList] = useState<PosItem[]>(initialPosList)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  function openAdd() {
    setForm(emptyForm()); setEditId(null); setShowForm(true); setError(null)
  }

  function openEdit(pos: PosItem) {
    const loc = pos.pos_locations ?? {}
    const det = pos.pos_details ?? {}
    setForm({
      name: pos.name, type: pos.type, status: pos.status, is_public: pos.is_public,
      address_line1: (loc as any).address_line1 ?? '', city: (loc as any).city ?? '',
      region: '', postal_code: '', country: (loc as any).country ?? '',
      latitude: String((loc as any).latitude ?? ''), longitude: String((loc as any).longitude ?? ''),
      manager_name: (det as any).manager_name ?? '',
      phone: (det as any).phone ?? '', whatsapp: (det as any).whatsapp ?? '', email: (det as any).email ?? '',
      accepts_walk_ins: (det as any).accepts_walk_ins ?? true,
      accepts_orders: (det as any).accepts_orders ?? true,
      services_offered: (det as any).services_offered ?? [],
      notes: (det as any).notes ?? '',
      opening_hours: (det as any).opening_hours ?? DEFAULT_HOURS,
    })
    setEditId(pos.id); setShowForm(true); setError(null)
  }

  async function save() {
    if (!form.name.trim()) { setError('POS name is required'); return }
    setSaving(true); setError(null)

    // Persist server-side (admin client + ownership check) so RLS never drops writes.
    const res = await fetch('/api/supplier/pos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', id: editId, pos: { ...form } }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { setSaving(false); setError(json.error ?? 'Save failed'); return }

    const saved = json.pos
    setPosList((list) => editId
      ? list.map((p) => (p.id === editId ? { ...p, ...saved } : p))
      : [...list, saved])

    setSaving(false); setShowForm(false); setEditId(null)
  }

  async function deletePos(id: string) {
    if (!confirm('Delete this location? This cannot be undone.')) return
    const res = await fetch('/api/supplier/pos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error ?? 'Delete failed'); return }
    setPosList((list) => list.filter((p) => p.id !== id))
  }

  function toggleService(svc: string) {
    set('services_offered', form.services_offered.includes(svc)
      ? form.services_offered.filter((s: string) => s !== svc)
      : [...form.services_offered, svc])
  }

  function setHour(day: string, field: string, value: any) {
    setForm((f) => ({
      ...f,
      opening_hours: { ...f.opening_hours, [day]: { ...f.opening_hours[day], [field]: value } }
    }))
  }

  const typeInfo = (t: string) => POS_TYPES.find((p) => p.value === t) ?? POS_TYPES[0]

  return (
    <div className="space-y-4">
      {/* Add button */}
      {!showForm && (
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1F4D] text-white text-sm font-bold hover:bg-[#162d6e] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Location
        </button>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-2xl border-2 border-[#0B1F4D]/20 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0B1F4D]">{editId ? 'Edit Location' : 'Add New Location'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

          {/* ── Basic info ── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Basic Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location Name *</label>
                <input className={INPUT} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Madrid Showroom" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                <select className={INPUT} value={form.type} onChange={(e) => set('type', e.target.value)}>
                  {POS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select className={INPUT} value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="temporarily_closed">Temporarily Closed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
              <input type="checkbox" checked={form.is_public} onChange={(e) => set('is_public', e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Show publicly on brand profile</span>
            </label>
          </div>

          {/* ── Address ── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Street Address</label>
                <input className={INPUT} value={form.address_line1} onChange={(e) => set('address_line1', e.target.value)} placeholder="Calle Gran Vía 1, Local 5" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                <input className={INPUT} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Madrid" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
                <input className={INPUT} value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="Spain" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Latitude (optional)</label>
                <input className={INPUT} value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="40.4168" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Longitude (optional)</label>
                <input className={INPUT} value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="-3.7038" />
              </div>
            </div>
          </div>

          {/* ── Contact ── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Manager Name</label>
                <input className={INPUT} value={form.manager_name} onChange={(e) => set('manager_name', e.target.value)} placeholder="Carlos García" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                <input className={INPUT} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+34 91 000 0000" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp</label>
                <input className={INPUT} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="34910000000" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input className={INPUT} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="madrid@yourbrand.com" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
                <input type="checkbox" checked={form.accepts_walk_ins} onChange={(e) => set('accepts_walk_ins', e.target.checked)} className="rounded" />
                Accepts Walk-ins
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
                <input type="checkbox" checked={form.accepts_orders} onChange={(e) => set('accepts_orders', e.target.checked)} className="rounded" />
                Accepts Orders
              </label>
            </div>
          </div>

          {/* ── Services ── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Services Offered</p>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((svc) => (
                <button key={svc} type="button" onClick={() => toggleService(svc)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.services_offered.includes(svc)
                      ? 'bg-[#0B1F4D] text-white border-[#0B1F4D]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#0B1F4D]'
                  }`}>
                  {svc}
                </button>
              ))}
            </div>
          </div>

          {/* ── Opening hours ── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Opening Hours</p>
            <div className="space-y-2">
              {DAYS.map((day) => {
                const h = form.opening_hours[day] ?? { open: '', close: '', closed: false }
                return (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-10 text-xs font-bold text-gray-500 uppercase">{DAY_LABELS[day]}</div>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={!h.closed} onChange={(e) => setHour(day, 'closed', !e.target.checked)} className="rounded" />
                      <span className="text-xs text-gray-500">Open</span>
                    </label>
                    {!h.closed && (
                      <>
                        <input type="time" value={h.open} onChange={(e) => setHour(day, 'open', e.target.value)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B1F4D]" />
                        <span className="text-xs text-gray-400">–</span>
                        <input type="time" value={h.close} onChange={(e) => setHour(day, 'close', e.target.value)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B1F4D]" />
                      </>
                    )}
                    {h.closed && <span className="text-xs text-gray-400 italic">Closed</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button onClick={save} disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#0B1F4D] text-white text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50 flex items-center gap-2 transition-colors">
              {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Location'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* POS list */}
      {posList.length === 0 && !showForm ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-semibold">No locations yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your shops, warehouses, and pickup points</p>
          <button onClick={openAdd} className="mt-4 px-5 py-2.5 rounded-xl bg-[#0B1F4D] text-white text-sm font-bold hover:bg-[#162d6e] transition-colors">
            Add First Location
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posList.map((pos) => {
            const tInfo = typeInfo(pos.type)
            const loc = pos.pos_locations as any
            const det = pos.pos_details as any
            const isOpen = expandedId === pos.id
            return (
              <div key={pos.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                {/* Header row */}
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tInfo.color}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">{pos.name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tInfo.color}`}>{tInfo.label}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[pos.status] ?? 'bg-gray-100 text-gray-600'}`}>{pos.status.replace('_', ' ')}</span>
                      {!pos.is_public && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Hidden</span>}
                    </div>
                    {(loc?.city || loc?.country) && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {loc.address_line1 ? `${loc.address_line1}, ` : ''}{loc.city}{loc.city && loc.country ? ', ' : ''}{loc.country}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(pos)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#0B1F4D] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => deletePos(pos.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <button onClick={() => setExpandedId(isOpen ? null : pos.id)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                      <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>
                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/50 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    {det?.phone && <div><p className="text-xs text-gray-400 font-medium">Phone</p><p className="font-semibold text-gray-700">{det.phone}</p></div>}
                    {det?.email && <div><p className="text-xs text-gray-400 font-medium">Email</p><p className="font-semibold text-gray-700">{det.email}</p></div>}
                    {det?.manager_name && <div><p className="text-xs text-gray-400 font-medium">Manager</p><p className="font-semibold text-gray-700">{det.manager_name}</p></div>}
                    {det?.services_offered?.length > 0 && (
                      <div className="sm:col-span-3">
                        <p className="text-xs text-gray-400 font-medium mb-1.5">Services</p>
                        <div className="flex flex-wrap gap-1.5">
                          {det.services_offered.map((s: string) => (
                            <span key={s} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {det?.opening_hours && (
                      <div className="sm:col-span-3">
                        <p className="text-xs text-gray-400 font-medium mb-1.5">Opening Hours</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1">
                          {DAYS.map((day) => {
                            const h = det.opening_hours[day]
                            return (
                              <div key={day} className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 font-medium w-8">{DAY_LABELS[day]}</span>
                                <span className={h?.closed ? 'text-gray-400 italic' : 'text-gray-700'}>
                                  {h?.closed ? 'Closed' : `${h?.open}–${h?.close}`}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
