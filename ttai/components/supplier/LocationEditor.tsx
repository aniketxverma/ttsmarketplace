'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Loader2, Check } from 'lucide-react'

interface Opt { id: string; name: string }
interface Initial {
  country_id: string | null
  province_id: string | null
  city_id: string | null
  town_id: string | null
  neighborhood_id: string | null
  delivery_radius_km: number | null
}

/**
 * Retail seller location editor (Phase 5). Country is fixed to the rollout market.
 * Saves via /api/supplier/brand (admin-side update — ACTIVE suppliers can't self-edit
 * the suppliers row directly via RLS).
 */
export function LocationEditor({ countryId, countryName, initial }: { countryId: string | null; countryName: string; initial: Initial }) {
  const supabase = createClient()
  const [province, setProvince] = useState(initial.province_id ?? '')
  const [city, setCity] = useState(initial.city_id ?? '')
  const [town, setTown] = useState(initial.town_id ?? '')
  const [hood, setHood] = useState(initial.neighborhood_id ?? '')
  const [radius, setRadius] = useState<string>(initial.delivery_radius_km?.toString() ?? '')

  const [provinces, setProvinces] = useState<Opt[]>([])
  const [cities, setCities] = useState<Opt[]>([])
  const [towns, setTowns] = useState<Opt[]>([])
  const [hoods, setHoods] = useState<Opt[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load options for each level as the parent changes.
  useEffect(() => { if (countryId) supabase.from('provinces').select('id, name').eq('country_id', countryId).order('name').then(({ data }) => setProvinces((data ?? []) as Opt[])) }, [countryId, supabase])
  useEffect(() => { if (province) supabase.from('cities').select('id, name').eq('province_id', province).order('name').then(({ data }) => setCities((data ?? []) as Opt[])); else setCities([]) }, [province, supabase])
  useEffect(() => { if (city) supabase.from('towns').select('id, name').eq('city_id', city).order('name').then(({ data }) => setTowns((data ?? []) as Opt[])); else setTowns([]) }, [city, supabase])
  useEffect(() => { if (town) supabase.from('neighborhoods').select('id, name').eq('town_id', town).order('name').then(({ data }) => setHoods((data ?? []) as Opt[])); else setHoods([]) }, [town, supabase])

  async function save() {
    setSaving(true); setSaved(false)
    const res = await fetch('/api/supplier/brand', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country_id: countryId,
        province_id: province || null,
        city_id: city || null,
        town_id: town || null,
        neighborhood_id: hood || null,
        delivery_radius_km: radius ? parseInt(radius) : null,
      }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    else alert('Could not save location')
  }

  const Select = ({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: Opt[]; disabled?: boolean }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-gray-50 disabled:text-gray-300">
        <option value="">{disabled ? '—' : 'Select…'}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  )

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4 max-w-2xl">
      <div>
        <h2 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" /> Local Delivery Area</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Set where you sell. Your products appear in the Retail Shop for buyers in this area.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Country</label>
          <input value={countryName} disabled className="w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-gray-500" />
        </div>
        <Select label="Province" value={province} options={provinces} onChange={(v) => { setProvince(v); setCity(''); setTown(''); setHood('') }} />
        <Select label="City" value={city} options={cities} disabled={!province} onChange={(v) => { setCity(v); setTown(''); setHood('') }} />
        <Select label="Town" value={town} options={towns} disabled={!city} onChange={(v) => { setTown(v); setHood('') }} />
        <Select label="Neighborhood" value={hood} options={hoods} disabled={!town} onChange={setHood} />
        <div className="space-y-1">
          <label className="text-sm font-medium">Delivery radius (km) <span className="text-muted-foreground font-normal">optional</span></label>
          <input type="number" min={0} value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="e.g. 15"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save location'}
      </button>
    </div>
  )
}
