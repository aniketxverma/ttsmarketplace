'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/* ─── Role options ────────────────────────────────────────── */
const ROLES = [
  {
    value: 'buyer',
    label: 'Buyer',
    desc: 'Looking to purchase products',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    value: 'business_client',
    label: 'Business Client',
    desc: 'B2B volume purchasing',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    value: 'supplier',
    label: 'Supplier',
    desc: 'List & sell products',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414A1 1 0 0121 11.414V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    value: 'broker',
    label: 'Broker',
    desc: 'Mediate deals & earn commissions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const STEPS = [
  { num: 1, label: 'Account' },
  { num: 2, label: 'Business' },
  { num: 3, label: 'Review' },
]

/* ─── Helper sub-components ───────────────────────────────── */
function Field({
  label, type = 'text', value, onChange, placeholder, required = true,
}: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
          focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all
          placeholder:text-gray-300"
      />
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide w-24 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-800 font-medium break-words flex-1">{value || '—'}</span>
    </div>
  )
}

/* ─── Main page ───────────────────────────────────────────── */
export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'buyer',
    companyName: '',
    countryName: '',
    bio: '',
  })

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  const step1Valid =
    form.fullName.trim() && form.email.trim() && form.phone.trim() && form.password.length >= 8

  const step2Valid = form.companyName.trim() && form.countryName.trim() && form.bio.trim().length >= 20

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name:    form.fullName,
          phone:        form.phone,
          role:         form.role,
          company_name: form.companyName,
          country_name: form.countryName,
          bio:          form.bio,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Save extended fields to profiles row
    if (data.user) {
      await supabase
        .from('profiles')
        .update({
          full_name:    form.fullName,
          phone:        form.phone,
          role:         form.role as any,
          company_name: form.companyName,
          country_name: form.countryName,
          bio:          form.bio,
        })
        .eq('id', data.user.id)
    }

    window.location.href = '/pending-approval'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">

      {/* ── Header with step progress ── */}
      <div className="bg-gradient-to-r from-[#0B1F4D] to-[#1a3580] px-6 py-5">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">
          Join TTAI Global Trade
        </p>
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300
                  ${step > s.num
                    ? 'bg-[#F5A623] text-white shadow-lg shadow-[#F5A623]/30'
                    : step === s.num
                    ? 'bg-white text-[#0B1F4D] shadow-lg'
                    : 'bg-white/15 text-white/40'}`}
                >
                  {step > s.num
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    : s.num}
                </div>
                <span className={`text-[10px] font-semibold mt-1 ${step === s.num ? 'text-white' : 'text-white/40'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all duration-500
                  ${step > s.num ? 'bg-[#F5A623]' : 'bg-white/20'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8">

        {/* ═══════════════════════════
            STEP 1 — Account details
        ═══════════════════════════ */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B1F4D]">Create your account</h2>
              <p className="text-gray-400 text-sm mt-0.5">Your personal login credentials</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Full Name *" value={form.fullName} onChange={(v) => set('fullName', v)} placeholder="John Smith" />
              </div>
              <Field label="Email *" type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="you@company.com" />
              <Field label="Phone *" type="tel" value={form.phone} onChange={(v) => set('phone', v)} placeholder="+1 555 000 0000" />
              <div className="sm:col-span-2">
                <Field label="Password * (min 8 chars)" type="password" value={form.password} onChange={(v) => set('password', v)} placeholder="Min 8 characters" />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="pt-1 space-y-3">
              <button
                type="button"
                disabled={!step1Valid}
                onClick={() => { setError(null); setStep(2) }}
                className="w-full rounded-xl bg-[#0B1F4D] text-white py-3.5 text-sm font-bold
                  hover:bg-[#162d6e] transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
              >
                Continue to Business Info →
              </button>
              <p className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-[#0B1F4D] font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════
            STEP 2 — Business details
        ═══════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B1F4D]">Your business profile</h2>
              <p className="text-gray-400 text-sm mt-0.5">Help us understand what you do</p>
            </div>

            {/* Role selector */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">I am a...</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set('role', r.value)}
                    className={`rounded-xl border-2 p-3 text-left transition-all flex gap-2.5 items-start
                      ${form.role === r.value
                        ? 'border-[#0B1F4D] bg-[#0B1F4D]/5'
                        : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                  >
                    <span className={form.role === r.value ? 'text-[#0B1F4D]' : 'text-gray-400'}>
                      {r.icon}
                    </span>
                    <div>
                      <p className={`text-sm font-bold leading-tight ${form.role === r.value ? 'text-[#0B1F4D]' : 'text-gray-700'}`}>
                        {r.label}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{r.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field
                  label="Company / Organization *"
                  value={form.companyName}
                  onChange={(v) => set('companyName', v)}
                  placeholder="Acme Trading Co."
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Country *"
                  value={form.countryName}
                  onChange={(v) => set('countryName', v)}
                  placeholder="Spain, UAE, USA, Morocco…"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                What are you looking for? *
              </label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Describe your business and what products you are interested in. The more detail you provide, the faster we can approve your account."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent
                  transition-all resize-none placeholder:text-gray-300"
              />
              <p className={`text-[11px] text-right ${form.bio.length < 20 ? 'text-gray-300' : 'text-green-500 font-medium'}`}>
                {form.bio.length < 20 ? `${20 - form.bio.length} more characters needed` : '✓ Good'}
              </p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-gray-200 text-gray-500 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!step2Valid}
                onClick={() => { setError(null); setStep(3) }}
                className="flex-[2] rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-bold
                  hover:bg-[#162d6e] transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
              >
                Review Application →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════
            STEP 3 — Review & submit
        ═══════════════════════════ */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B1F4D]">Review your application</h2>
              <p className="text-gray-400 text-sm mt-0.5">Confirm everything looks correct before submitting</p>
            </div>

            {/* Summary card */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {/* Header row */}
              <div className="bg-[#0B1F4D]/3 px-4 py-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#0B1F4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-bold text-[#0B1F4D] uppercase tracking-wide">Personal</span>
              </div>
              <ReviewRow label="Name" value={form.fullName} />
              <ReviewRow label="Email" value={form.email} />
              <ReviewRow label="Phone" value={form.phone} />

              <div className="bg-[#0B1F4D]/3 px-4 py-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#0B1F4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-xs font-bold text-[#0B1F4D] uppercase tracking-wide">Business</span>
              </div>
              <ReviewRow label="Role" value={ROLES.find((r) => r.value === form.role)?.label ?? form.role} />
              <ReviewRow label="Company" value={form.companyName} />
              <ReviewRow label="Country" value={form.countryName} />
              <ReviewRow label="About" value={form.bio} />
            </div>

            {/* What happens next */}
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-4 space-y-2">
              <p className="text-sm font-bold text-amber-800">What happens next?</p>
              <div className="space-y-2">
                {[
                  'Your application is submitted and locked in',
                  'Our team reviews your profile within 24–48 hours',
                  'You receive an email confirmation once approved',
                  'Full platform access is granted immediately',
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-amber-700">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-gray-200 text-gray-500 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                ← Edit
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex-[2] rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-bold
                  hover:bg-[#162d6e] transition-colors disabled:opacity-60"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </span>
                  : 'Submit Application ✓'}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400">
              By submitting you agree to our{' '}
              <span className="text-[#0B1F4D] font-medium cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
              <span className="text-[#0B1F4D] font-medium cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
