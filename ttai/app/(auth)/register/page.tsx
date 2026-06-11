'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

/* ─── Static data ─────────────────────────────────────────── */

const ROLES = [
  {
    value: 'buyer',
    label: 'Buyer',
    sub: 'Import & purchase products',
    color: 'from-green-500 to-emerald-600',
    disabled: true,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    perks: ['Access verified suppliers', 'Compare prices & MOQ', 'Direct factory contact'],
  },
  {
    value: 'business_client',
    label: 'Business Client',
    sub: 'B2B volume purchasing',
    color: 'from-blue-500 to-indigo-600',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    perks: ['Volume pricing', 'Dedicated account manager', 'Priority fulfilment'],
  },
  {
    value: 'supplier',
    label: 'Supplier',
    sub: 'List & sell your products',
    color: 'from-orange-500 to-amber-600',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414A1 1 0 0121 11.414V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
      </svg>
    ),
    perks: ['Global buyer reach', 'Brand profile page', 'Order management dashboard'],
  },
  {
    value: 'broker',
    label: 'Broker',
    sub: 'Mediate deals & earn commissions',
    color: 'from-purple-500 to-violet-600',
    disabled: true,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    perks: ['Commission on every deal', 'Access both buyers & suppliers', 'Deal tracking tools'],
  },
]

const BUSINESS_TYPES: Record<string, string[]> = {
  buyer:           ['Importer', 'Retailer', 'Wholesaler', 'Distributor', 'E-commerce', 'Supermarket / Chain', 'Restaurant / F&B', 'Government / Tender', 'Other'],
  business_client: ['Corporate Buyer', 'Importer', 'Distributor', 'Wholesaler', 'Project Developer', 'E-commerce', 'Retail Chain', 'Other'],
  supplier:        ['Manufacturer', 'Brand Owner', 'Distributor', 'Export Agent', 'Trader / Wholesaler', 'OEM Producer', 'Other'],
  broker:          ['Trading Company', 'Commission Agent', 'Freight Forwarder', 'Customs Broker', 'Market Consultant', 'Sourcing Agency', 'Other'],
}

const CONTINENTS  = ['Europe', 'Middle East', 'Africa', 'Americas', 'Asia Pacific', 'Oceania']
const CATEGORIES  = [
  'Electronics & Technology', 'Food & Beverages', 'Cleaning & Household',
  'Personal Care & Beauty', 'Home Appliances', 'Clothing & Textiles',
  'Agricultural Products', 'Building Materials', 'Automotive Parts',
  'Industrial Equipment', 'Pharmaceuticals & Medical', 'Furniture & Decor',
  'Sports & Leisure', 'Logistics & Freight', 'Other',
]
const TURNOVERS   = ['Under $100K','$100K – $500K','$500K – $1M','$1M – $5M','$5M – $20M','Over $20M','Prefer not to say']

const ABOUT_PROMPTS: Record<string, { bio: string; products: string }> = {
  buyer:           { bio: 'Describe your company and what you are looking to import or purchase…',                  products: 'List the specific products or brands you are sourcing…' },
  business_client: { bio: 'Describe your business, purchasing needs and target volumes…',                           products: 'List the key product categories or items you need to procure…' },
  supplier:        { bio: 'Describe your company, manufacturing capabilities and what makes you stand out…',        products: 'List your main products, brands or services you supply…' },
  broker:          { bio: 'Describe your brokerage expertise, network and how you create value for clients…',       products: 'List the sectors, product categories and regions you specialize in…' },
}

/* ─── Helpers ─────────────────────────────────────────────── */

type FormData = {
  fullName: string; email: string; phone: string; password: string
  username: string; role: string
  companyName: string; businessType: string; continent: string
  countryName: string; city: string; category: string
  annualTurnover: string; websiteUrl: string
  bio: string; productsOffered: string
}

const EMPTY: FormData = {
  fullName: '', email: '', phone: '', password: '', username: '', role: '',
  companyName: '', businessType: '', continent: '', countryName: '', city: '',
  category: '', annualTurnover: '', websiteUrl: '',
  bio: '', productsOffered: '',
}

function Label({ text }: { text: string }) {
  return <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{text}</p>
}
function Inp({ type='text', value, onChange, placeholder, required=true }: {
  type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <input type={type} value={value} required={required} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all placeholder:text-gray-300 bg-white" />
  )
}
function Sel({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all bg-white text-gray-800">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
function Err({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      {msg}
    </div>
  )
}
function ReviewRow({ label, value, priv }: { label: string; value?: string | null; priv?: boolean }) {
  if (!value) return null
  return (
    <div className="flex gap-3 px-4 py-2.5">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 flex items-start gap-1.5">
        <span className="text-sm text-gray-800 break-words">{value}</span>
        {priv && <span className="flex-shrink-0 text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full mt-0.5">Private</span>}
      </div>
    </div>
  )
}
function SectionHead({ label }: { label: string }) {
  return <div className="bg-gray-50 px-4 py-2 border-b border-gray-100"><span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{label}</span></div>
}

const STEPS = [{ num: 1, label: 'Account' }, { num: 2, label: 'Company' }, { num: 3, label: 'About' }, { num: 4, label: 'Review' }]

/* ─── Main page ───────────────────────────────────────────── */

export default function RegisterPage() {
  const [step, setStep]     = useState(0)
  const [form, setForm]     = useState<FormData>(EMPTY)
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Avatar
  const [avatarFile, setAvatarFile]       = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Username check
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle')
  const usernameTimer = useRef<ReturnType<typeof setTimeout>>()

  // Existing-email handling
  const [existingEmail, setExistingEmail] = useState(false)
  const submittingRef = useRef(false)

  // Joining a sales network via an invite link → they're becoming a seller (sales point),
  // so pre-select "Supplier" and show a banner. Read from the URL (avoids Suspense issues).
  const [fromInvite, setFromInvite] = useState(false)
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next') ?? ''
    if (next.includes('/join/')) { setFromInvite(true); setForm(p => (p.role ? p : { ...p, role: 'supplier' })) }
  }, [])

  function set(k: keyof FormData, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB'); return }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const checkUsername = useCallback((val: string) => {
    clearTimeout(usernameTimer.current)
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (clean !== val.toLowerCase()) { setUsernameStatus('invalid'); return }
    if (val.length < 3) { setUsernameStatus('idle'); return }
    setUsernameStatus('checking')
    usernameTimer.current = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase.from('profiles').select('id').eq('username', val).maybeSingle()
      setUsernameStatus(data ? 'taken' : 'ok')
    }, 500)
  }, [])

  function onUsernameChange(val: string) {
    const clean = val.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 20)
    set('username', clean)
    checkUsername(clean)
  }

  const role    = form.role
  const roleObj = ROLES.find(r => r.value === role)
  const prompts = ABOUT_PROMPTS[role] ?? ABOUT_PROMPTS.buyer
  const showTurnover = role === 'supplier' || role === 'broker'

  const step1Valid = form.fullName.trim() && form.email.includes('@') && form.phone.trim() &&
    form.password.length >= 8 && form.username.length >= 3 && usernameStatus === 'ok'
  const step2Valid = form.companyName.trim() && form.businessType && form.continent && form.countryName.trim() && form.city.trim() && form.category
  const step3Valid = form.bio.trim().length >= 30

  async function submit() {
    // Guard against double-submit (disabled prop is async — can be raced on fast clicks)
    if (submittingRef.current) return
    submittingRef.current = true

    setError(null)
    setExistingEmail(false)
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(), password: form.password,
        options: { data: { full_name: form.fullName, phone: form.phone, role: form.role, username: form.username,
          company_name: form.companyName, business_type: form.businessType, continent: form.continent,
          country_name: form.countryName, city: form.city, category: form.category,
          annual_turnover: form.annualTurnover, website_url: form.websiteUrl,
          bio: form.bio, products_offered: form.productsOffered } },
      })

      if (signUpError) {
        const m = signUpError.message.toLowerCase()
        if (m.includes('already') || m.includes('registered') || m.includes('exists')) {
          setExistingEmail(true)
          setError('An account with this email already exists.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      // Email-confirmation ON + existing email: Supabase returns an obfuscated user
      // with an empty identities array and NO error. Detect it so we don't falsely
      // redirect to pending-approval as if a new account was created.
      const identities = (data.user as any)?.identities
      if (data.user && Array.isArray(identities) && identities.length === 0) {
        setExistingEmail(true)
        setError('An account with this email already exists.')
        return
      }

      if (!data.user) { setError('Account creation failed. Please try again.'); return }

      const userId = data.user.id
      let avatarUrl: string | null = null

      // Upload avatar if provided (requires authenticated session)
      if (avatarFile && data.session) {
        try {
          const ext  = avatarFile.name.split('.').pop() ?? 'jpg'
          const path = `avatars/${userId}.${ext}`
          const { error: uploadErr } = await supabase.storage
            .from('brand-assets')
            .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path)
            avatarUrl = urlData.publicUrl
          }
        } catch { /* avatar upload is optional — silently skip */ }
      }

      const { error: profileErr } = await supabase.from('profiles').update({
        full_name: form.fullName, phone: form.phone, role: form.role as any,
        username: form.username, avatar_url: avatarUrl,
        company_name: form.companyName, business_type: form.businessType, continent: form.continent,
        country_name: form.countryName, city: form.city, category: form.category,
        annual_turnover: form.annualTurnover || null, website_url: form.websiteUrl || null,
        bio: form.bio, products_offered: form.productsOffered || null,
      }).eq('id', userId)

      // Profile update failure is non-fatal — metadata was saved in signUp options
      if (profileErr) console.warn('Profile update error (non-fatal):', profileErr.message)

      // New flow: land on the role dashboard immediately. Account stays "pending"
      // (admin reviews details + approves) — marketplace unlocks after approval.
      const dash =
        form.role === 'supplier' ? '/supplier' :
        form.role === 'broker'   ? '/broker'   :
        '/buyer'
      window.location.href = dash
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  /* ── Role picker (step 0) ─────────────────────────────── */
  if (step === 0) {
    return (
      <div className="space-y-6">
        {/* Sign-in — top right */}
        <div className="flex justify-end -mb-2 animate-fade-in">
          <span className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-[#0B1F4D] font-bold hover:underline">Sign in</Link>
          </span>
        </div>

        {/* Animated header */}
        <div className="text-center space-y-2 pb-1 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-[#0B1F4D]/5 border border-[#0B1F4D]/10 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-[#0B1F4D] uppercase tracking-widest mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-blink" />
            Free to join · 24h approval
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D] leading-tight">Join TTAI Global Trade</h1>
          <p className="text-gray-400 text-sm">Choose how you&apos;ll use the platform</p>
        </div>

        {fromInvite && (
          <div className="rounded-2xl border-2 border-[#0B1F4D]/15 bg-[#0B1F4D]/[0.03] px-4 py-3.5 text-sm text-[#0B1F4D] flex items-start gap-3">
            <span className="text-xl leading-none">🤝</span>
            <span>
              <span className="font-extrabold">You&apos;re joining a sales network.</span> Choose <span className="font-extrabold">Supplier / Brand</span> below — that gives you your own store so you can sell. (You can still buy too.)
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {ROLES.map((r, i) => {
            const disabled = (r as any).disabled as boolean | undefined
            return (
            <button key={r.value} type="button" disabled={disabled}
              onClick={() => { if (disabled) return; set('role', r.value); set('businessType', ''); setStep(1) }}
              style={{ animationDelay: `${i * 90}ms` }}
              aria-disabled={disabled}
              className={`group relative bg-white rounded-2xl border-2 p-5 text-left transition-all duration-300 overflow-hidden animate-fade-in-up ${
                disabled
                  ? 'border-gray-100 opacity-60 cursor-not-allowed'
                  : `hover:border-[#0B1F4D] hover:shadow-xl hover:-translate-y-1 ${fromInvite && r.value === 'supplier' ? 'border-[#0B1F4D] ring-2 ring-[#0B1F4D]/20' : 'border-gray-100'}`}`}>

              {/* Themed background wash + glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${r.color} opacity-[0.05] pointer-events-none`} />
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${r.color} opacity-10 blur-2xl pointer-events-none`} />
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${r.color} ${disabled ? 'opacity-30' : 'scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300'}`} />

              {disabled
                ? <span className="absolute top-2.5 right-2.5 z-10 text-[9px] font-extrabold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wide">Coming soon</span>
                : fromInvite && r.value === 'supplier' && <span className="absolute top-2 right-2 z-10 text-[9px] font-extrabold bg-[#0B1F4D] text-white px-2 py-0.5 rounded-full">Recommended</span>}

              <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white mb-3 shadow-md ${disabled ? '' : 'group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300'}`}>{r.icon}</div>
              <p className="relative font-extrabold text-[#0B1F4D] text-base">{r.label}</p>
              <p className="relative text-xs text-gray-500 mt-0.5 mb-3">{r.sub}</p>
              <div className="relative space-y-1.5">
                {r.perks.map(p => (
                  <div key={p} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {p}
                  </div>
                ))}
              </div>
              <div className={`relative mt-4 flex items-center gap-1 text-xs font-bold ${disabled ? 'text-gray-400' : 'text-[#0B1F4D] group-hover:gap-2.5 transition-all'}`}>
                {disabled ? 'Coming soon' : <>Join as {r.label}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></>}
              </div>
            </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── Steps 1–4 ────────────────────────────────────────── */
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">

      {/* Progress header */}
      <div className="bg-gradient-to-r from-[#0B1F4D] to-[#1a3580] px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-medium transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Change role
          </button>
          <span className="text-white/20">·</span>
          <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${roleObj?.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>{roleObj?.label}</div>
        </div>
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-all
                  ${step > s.num ? 'bg-[#F5A623] text-white' : step === s.num ? 'bg-white text-[#0B1F4D]' : 'bg-white/15 text-white/40'}`}>
                  {step > s.num
                    ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    : s.num}
                </div>
                <span className={`text-[10px] font-semibold mt-1 ${step === s.num ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1.5 mb-4 transition-all duration-500 ${step > s.num ? 'bg-[#F5A623]' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8" key={step}>

        {/* ════ STEP 1 — Account ════ */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in-up">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B1F4D]">Your account</h2>
              <p className="text-gray-400 text-sm mt-0.5">Login credentials and public profile identity</p>
            </div>

            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#0B1F4D] overflow-hidden flex-shrink-0 transition-colors group relative">
                {avatarPreview
                  ? <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                  : <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <svg className="w-7 h-7 text-gray-300 group-hover:text-[#0B1F4D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-[10px] text-gray-300 group-hover:text-[#0B1F4D] font-medium transition-colors">Photo</span>
                    </div>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Profile Photo</p>
                <p className="text-xs text-gray-400 mt-0.5">Optional · JPG, PNG · Max 5 MB</p>
                {avatarPreview && (
                  <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                    className="text-xs text-red-400 hover:text-red-600 mt-1 transition-colors">Remove</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label text="Full Name *" />
                <Inp value={form.fullName} onChange={v => set('fullName', v)} placeholder="John Smith" />
              </div>

              {/* Username */}
              <div className="sm:col-span-2 space-y-1.5">
                <Label text="Username *" />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => onUsernameChange(e.target.value)}
                    placeholder="yourname"
                    maxLength={20}
                    className="w-full rounded-xl border border-gray-200 pl-8 pr-10 py-3 text-sm
                      focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent
                      transition-all placeholder:text-gray-300 bg-white"
                  />
                  {/* Status indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <span className="w-4 h-4 border-2 border-gray-300 border-t-[#0B1F4D] rounded-full animate-spin block" />}
                    {usernameStatus === 'ok'       && <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                    {usernameStatus === 'taken'    && <svg className="w-5 h-5 text-red-400"   fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>}
                  </div>
                </div>
                <p className={`text-[11px] mt-1 ${
                  usernameStatus === 'ok'      ? 'text-green-500 font-semibold' :
                  usernameStatus === 'taken'   ? 'text-red-500 font-semibold'   :
                  usernameStatus === 'invalid' ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
                  {usernameStatus === 'ok'      ? `✓ @${form.username} is available — profile.ttai.es/${form.username}` :
                   usernameStatus === 'taken'   ? `✗ @${form.username} is already taken` :
                   usernameStatus === 'invalid' ? 'Only lowercase letters, numbers, and underscores' :
                   'Letters, numbers and underscores only · 3–20 characters'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label text="Email *" />
                <Inp type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label text="Phone / WhatsApp *" />
                <Inp type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="+34 600 000 000" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label text="Password * (min 8 characters)" />
                <Inp type="password" value={form.password} onChange={v => set('password', v)} placeholder="Min 8 characters" />
              </div>
            </div>

            {error && <Err msg={error} />}

            <button type="button" disabled={!step1Valid}
              onClick={() => { setError(null); setStep(2) }}
              className="w-full rounded-xl bg-[#0B1F4D] text-white py-3.5 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-35 disabled:cursor-not-allowed">
              Company Details →
            </button>
          </div>
        )}

        {/* ════ STEP 2 — Company ════ */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in-up">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B1F4D]">Company details</h2>
              <p className="text-gray-400 text-sm mt-0.5">Tell us about your organisation</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label text="Company Name *" /><Inp value={form.companyName} onChange={v => set('companyName', v)} placeholder="Acme Trading Co." /></div>
              <div className="space-y-1.5"><Label text="Business Type *" /><Sel value={form.businessType} onChange={v => set('businessType', v)} options={BUSINESS_TYPES[role] ?? BUSINESS_TYPES.buyer} placeholder="Select your business type" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label text="Continent *" /><Sel value={form.continent} onChange={v => set('continent', v)} options={CONTINENTS} placeholder="Select continent" /></div>
                <div className="space-y-1.5"><Label text="Country *" /><Inp value={form.countryName} onChange={v => set('countryName', v)} placeholder="Spain, UAE…" /></div>
              </div>
              <div className="space-y-1.5"><Label text="City *" /><Inp value={form.city} onChange={v => set('city', v)} placeholder="Madrid, Dubai…" /></div>
              <div className="space-y-1.5"><Label text="Main Category *" /><Sel value={form.category} onChange={v => set('category', v)} options={CATEGORIES} placeholder="e.g. Electronics, Food, Logistics" /></div>
              {showTurnover && (
                <div className="space-y-1.5">
                  <Label text="Annual Turnover (USD)" />
                  <Sel value={form.annualTurnover} onChange={v => set('annualTurnover', v)} options={TURNOVERS} placeholder="e.g. $1M – $5M" />
                  <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    Stored privately — never shown on your public profile
                  </p>
                </div>
              )}
              <div className="space-y-1.5"><Label text="Website URL" /><Inp type="url" value={form.websiteUrl} onChange={v => set('websiteUrl', v)} placeholder="https://yourcompany.com" required={false} /></div>
            </div>
            {error && <Err msg={error} />}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-gray-200 text-gray-500 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors">← Back</button>
              <button type="button" disabled={!step2Valid} onClick={() => { setError(null); setStep(3) }}
                className="flex-[2] rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-35 disabled:cursor-not-allowed">
                About Your Business →
              </button>
            </div>
          </div>
        )}

        {/* ════ STEP 3 — About ════ */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in-up">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B1F4D]">About your business</h2>
              <p className="text-gray-400 text-sm mt-0.5">This appears on your public profile once approved</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label text="About Your Business *" />
                <textarea rows={4} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder={prompts.bio}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all resize-none placeholder:text-gray-300" />
                <div className="flex justify-between">
                  <p className="text-[11px] text-gray-400">Min 30 characters</p>
                  <p className={`text-[11px] font-semibold ${form.bio.length >= 30 ? 'text-green-500' : 'text-gray-300'}`}>
                    {form.bio.length >= 30 ? '✓ Good' : `${30 - form.bio.length} more`}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label text={role === 'supplier' ? 'Main Products / Brands Offered' : role === 'broker' ? 'Markets & Sectors' : 'Products or Services You Need'} />
                <textarea rows={3} value={form.productsOffered} onChange={e => set('productsOffered', e.target.value)} placeholder={prompts.products}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all resize-none placeholder:text-gray-300" />
              </div>
            </div>
            {error && <Err msg={error} />}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-gray-200 text-gray-500 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors">← Back</button>
              <button type="button" disabled={!step3Valid} onClick={() => { setError(null); setStep(4) }}
                className="flex-[2] rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-35 disabled:cursor-not-allowed">
                Review Application →
              </button>
            </div>
          </div>
        )}

        {/* ════ STEP 4 — Review ════ */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in-up">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B1F4D]">Review your application</h2>
              <p className="text-gray-400 text-sm mt-0.5">Confirm everything looks correct</p>
            </div>

            {/* Avatar preview */}
            {avatarPreview && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={avatarPreview} alt="Your photo" fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Profile photo uploaded</p>
                  <p className="text-xs text-gray-400">Will appear on your public profile</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 text-sm">
              <SectionHead label="Account" />
              <ReviewRow label="Username" value={`@${form.username}`} />
              <ReviewRow label="Name"     value={form.fullName} />
              <ReviewRow label="Email"    value={form.email} />
              <ReviewRow label="Phone"    value={form.phone} />
              <ReviewRow label="Role"     value={ROLES.find(r => r.value === form.role)?.label} />
              <SectionHead label="Company" />
              <ReviewRow label="Company"  value={form.companyName} />
              <ReviewRow label="Type"     value={form.businessType} />
              <ReviewRow label="Location" value={[form.city, form.countryName, form.continent].filter(Boolean).join(', ')} />
              <ReviewRow label="Category" value={form.category} />
              <ReviewRow label="Website"  value={form.websiteUrl} />
              {showTurnover && <ReviewRow label="Turnover" value={form.annualTurnover} priv />}
              <SectionHead label="About" />
              <ReviewRow label="About"    value={form.bio} />
              <ReviewRow label="Products" value={form.productsOffered} />
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-4">
              <p className="text-sm font-bold text-amber-800 mb-2">What happens next?</p>
              {['Application submitted & profile created','Our team reviews within 24–48 hours','You receive an approval email','Full access granted — profile goes live at /profile/@' + form.username].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <p className="text-xs text-amber-700">{s}</p>
                </div>
              ))}
            </div>

            {error && <Err msg={error} />}

            {existingEmail && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 -mt-1">
                <p className="text-xs text-blue-800 font-medium w-full sm:w-auto">Already have an account with this email?</p>
                <Link href="/login" className="text-xs font-extrabold text-[#0B1F4D] underline hover:text-[#162d6e]">Log in →</Link>
                <Link href="/reset-password" className="text-xs font-extrabold text-[#0B1F4D] underline hover:text-[#162d6e]">Reset password</Link>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl border border-gray-200 text-gray-500 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors">← Edit</button>
              <button type="button" disabled={loading} onClick={submit}
                className="flex-[2] rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-60">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</span>
                  : 'Submit Application ✓'}
              </button>
            </div>
            <p className="text-center text-xs text-gray-400">
              By submitting you agree to our <span className="text-[#0B1F4D] font-semibold hover:underline cursor-pointer">Terms</span> & <span className="text-[#0B1F4D] font-semibold hover:underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
