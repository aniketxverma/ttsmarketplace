'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Save, Loader, Camera, Check, AlertCircle } from 'lucide-react'

interface ProfileData {
  id: string
  full_name: string | null
  username: string | null
  phone: string | null
  bio: string | null
  company_name: string | null
  business_type: string | null
  category: string | null
  country_name: string | null
  city: string | null
  continent: string | null
  website_url: string | null
  products_offered: string | null
  avatar_url: string | null
  role: string | null
  email: string
}

const BUSINESS_TYPES = ['Company', 'SME', 'Individual / Freelancer', 'Cooperative', 'Government', 'NGO']
const CONTINENTS     = ['Europe', 'Africa', 'Asia', 'North America', 'South America', 'Oceania', 'Middle East']
const CATEGORIES     = [
  'Food & Agriculture', 'Electronics & Technology', 'Cleaning & Hygiene',
  'Fashion & Apparel', 'Health & Beauty', 'Logistics & Transport',
  'Construction & Materials', 'Automotive', 'Home & Garden',
  'Sports & Leisure', 'Chemicals & Plastics', 'Other',
]

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent bg-white transition"
const selectCls = inputCls + " appearance-none"

export function ProfileEditForm({ profile }: { profile: ProfileData }) {
  const router = useRouter()
  const imgRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    full_name:        profile.full_name        ?? '',
    username:         profile.username         ?? '',
    phone:            profile.phone            ?? '',
    bio:              profile.bio              ?? '',
    company_name:     profile.company_name     ?? '',
    business_type:    profile.business_type    ?? '',
    category:         profile.category         ?? '',
    country_name:     profile.country_name     ?? '',
    city:             profile.city             ?? '',
    continent:        profile.continent        ?? '',
    website_url:      profile.website_url      ?? '',
    products_offered: profile.products_offered ?? '',
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null)

  const [saving,  setSaving]  = useState(false)
  const [status,  setStatus]  = useState<'idle' | 'success' | 'error'>('idle')
  const [errMsg,  setErrMsg]  = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErrMsg('Photo must be under 5 MB'); setStatus('error'); return }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setStatus('idle'); setErrMsg('')

    // Upload avatar first if changed
    if (avatarFile) {
      const fd = new FormData()
      fd.append('file', avatarFile)
      const r = await fetch('/api/account/avatar', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) { setErrMsg(j.error ?? 'Avatar upload failed'); setStatus('error'); setSaving(false); return }
    }

    // Save profile fields
    const res = await fetch('/api/profile/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setErrMsg(data.error ?? 'Failed to save')
      setStatus('error')
    } else {
      setStatus('success')
      router.refresh()
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const initial = (form.full_name || profile.email)[0]?.toUpperCase() ?? '?'

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">

      {/* ── Avatar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide mb-5">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-[#0B1F4D]">
              {avatarPreview ? (
                <Image src={avatarPreview} alt="Avatar" width={80} height={80}
                  className="object-cover w-full h-full"
                  unoptimized={avatarPreview.startsWith('data:')} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white font-extrabold text-2xl">{initial}</span>
                </div>
              )}
            </div>
            <button type="button" onClick={() => imgRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#F5A623] flex items-center justify-center shadow-sm hover:bg-[#fbb93a] transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={imgRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Change your profile photo</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP — max 5 MB</p>
            <button type="button" onClick={() => imgRef.current?.click()}
              className="mt-2 text-xs font-bold text-[#0B1F4D] hover:underline">
              Upload new photo
            </button>
          </div>
        </div>
      </div>

      {/* ── Personal info ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">Personal Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name *">
            <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
              placeholder="Your full name" className={inputCls} required />
          </Field>
          <Field label="Username" hint="Used in your public profile URL">
            <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-[#0B1F4D]">
              <span className="flex items-center px-3 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 flex-shrink-0">@</span>
              <input type="text" value={form.username} onChange={e => set('username', e.target.value)}
                placeholder="yourname" className="flex-1 px-3 py-2.5 text-sm bg-white focus:outline-none" />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+34 600 000 000" className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={profile.email} disabled
              className={inputCls + " bg-gray-50 text-gray-400 cursor-not-allowed"} />
          </Field>
        </div>

        <Field label="Bio" hint="Short description visible on your public profile">
          <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
            placeholder="Tell people who you are and what you do…"
            rows={4} className={inputCls + " resize-none"} />
        </Field>
      </div>

      {/* ── Business info ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">Business Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company / Trade Name">
            <input type="text" value={form.company_name} onChange={e => set('company_name', e.target.value)}
              placeholder="Your company name" className={inputCls} />
          </Field>
          <Field label="Business Type">
            <select value={form.business_type} onChange={e => set('business_type', e.target.value)} className={selectCls}>
              <option value="">Select type…</option>
              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category / Industry">
            <select value={form.category} onChange={e => set('category', e.target.value)} className={selectCls}>
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Continent">
            <select value={form.continent} onChange={e => set('continent', e.target.value)} className={selectCls}>
              <option value="">Select continent…</option>
              {CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Country">
            <input type="text" value={form.country_name} onChange={e => set('country_name', e.target.value)}
              placeholder="e.g. Spain" className={inputCls} />
          </Field>
          <Field label="City">
            <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
              placeholder="e.g. Málaga" className={inputCls} />
          </Field>
        </div>

        <Field label="Website URL">
          <input type="url" value={form.website_url} onChange={e => set('website_url', e.target.value)}
            placeholder="https://yourwebsite.com" className={inputCls} />
        </Field>
      </div>

      {/* ── Products / Services ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
          {profile.role === 'supplier' ? 'Products & Services Offered'
           : profile.role === 'broker' ? 'Markets & Specialisations'
           : 'Products & Services Needed'}
        </h2>
        <Field label="List your products or services" hint="Separate with commas or new lines — shown as tags on your profile">
          <textarea value={form.products_offered} onChange={e => set('products_offered', e.target.value)}
            placeholder="e.g. Cleaning products, Detergents, Private label cosmetics"
            rows={3} className={inputCls + " resize-none"} />
        </Field>
      </div>

      {/* ── Status + Save ── */}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-7 py-3 bg-[#0B1F4D] hover:bg-[#162d6e] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-60 shadow-sm">
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
            <Check className="w-4 h-4" />Profile updated
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-500 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />{errMsg}
          </div>
        )}
      </div>
    </form>
  )
}
