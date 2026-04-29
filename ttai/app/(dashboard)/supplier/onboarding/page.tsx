'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createSupplierSchema } from '@/lib/validation/schemas'

type Step = 1 | 2 | 3 | 4

interface FormState {
  legalName: string; tradeName: string; taxId: string; vatNumber: string
  countryId: string; cityId: string; addressLine1: string; addressLine2: string; postalCode: string
  marketplaceContext: 'wholesale' | 'retail' | 'both'; description: string
}

const INITIAL: FormState = {
  legalName: '', tradeName: '', taxId: '', vatNumber: '',
  countryId: '', cityId: '', addressLine1: '', addressLine2: '', postalCode: '',
  marketplaceContext: 'wholesale', description: '',
}

const STEPS = [
  { label: 'Company Info',   icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { label: 'Address',        icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Market Context', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { label: 'Description',    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

export default function SupplierOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [loaded, setLoaded] = useState(false)

  async function loadCountries() {
    if (loaded) return
    const supabase = createClient()
    const { data } = await supabase.from('countries').select('id, name').eq('is_active', true).order('name')
    setCountries(data ?? [])
    setLoaded(true)
  }

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validateStep(): boolean {
    setError(null)
    if (step === 1) {
      if (!form.legalName.trim()) { setError('Legal company name is required'); return false }
      if (!form.taxId.trim()) { setError('Tax ID is required'); return false }
    }
    if (step === 2) {
      if (!form.countryId) { setError('Please select a country'); return false }
    }
    return true
  }

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    const parsed = createSupplierSchema.safeParse({
      legalName:          form.legalName,
      tradeName:          form.tradeName || undefined,
      taxId:              form.taxId,
      vatNumber:          form.vatNumber || undefined,
      countryId:          form.countryId,
      cityId:             form.cityId || undefined,
      addressLine1:       form.addressLine1 || undefined,
      postalCode:         form.postalCode || undefined,
      marketplaceContext: form.marketplaceContext,
      description:        form.description || undefined,
    })

    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { error: insertError } = await supabase.from('suppliers').insert({
      owner_id:            user.id,
      legal_name:          parsed.data.legalName,
      trade_name:          parsed.data.tradeName,
      tax_id:              parsed.data.taxId,
      vat_number:          parsed.data.vatNumber,
      country_id:          parsed.data.countryId,
      city_id:             parsed.data.cityId,
      address_line1:       parsed.data.addressLine1,
      postal_code:         parsed.data.postalCode,
      marketplace_context: parsed.data.marketplaceContext,
      description:         parsed.data.description,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    await supabase.from('profiles').update({ role: 'supplier' }).eq('id', user.id)
    router.push('/supplier')
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all bg-white'
  const labelCls = 'text-xs font-semibold text-gray-600 uppercase tracking-wide'

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-10 pb-20 px-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#0B1F4D] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0B1F4D]">Supplier Application</h1>
          <p className="text-gray-500 text-sm mt-1">Complete your profile to start selling on TTAI EMA</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const stepNum = (i + 1) as Step
            const isActive = stepNum === step
            const isDone = stepNum < step
            return (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isDone ? 'bg-green-500 text-white' :
                    isActive ? 'bg-[#0B1F4D] text-white shadow-lg' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isDone ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : stepNum}
                  </div>
                  <p className={`text-xs mt-1 font-medium hidden sm:block ${isActive ? 'text-[#0B1F4D]' : 'text-gray-400'}`}>
                    {s.label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 rounded-full transition-colors ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          {step === 1 && (
            <>
              <h2 className="font-bold text-[#0B1F4D] text-base">Company Information</h2>
              <div className="space-y-1.5">
                <label className={labelCls}>Legal Company Name *</label>
                <input className={inputCls} value={form.legalName} onChange={(e) => update('legalName', e.target.value)} placeholder="e.g. Acme Trading SL" />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Trade Name (public name)</label>
                <input className={inputCls} placeholder="Shown on marketplace — leave blank to use legal name" value={form.tradeName} onChange={(e) => update('tradeName', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelCls}>Tax ID *</label>
                  <input className={inputCls} value={form.taxId} onChange={(e) => update('taxId', e.target.value)} placeholder="e.g. B12345678" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>VAT Number</label>
                  <input className={inputCls} placeholder="Optional" value={form.vatNumber} onChange={(e) => update('vatNumber', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-bold text-[#0B1F4D] text-base">Business Address</h2>
              <div className="space-y-1.5" onClick={loadCountries}>
                <label className={labelCls}>Country *</label>
                <select className={inputCls} value={form.countryId} onChange={(e) => update('countryId', e.target.value)} onFocus={loadCountries}>
                  <option value="">Select country...</option>
                  {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Address Line 1</label>
                <input className={inputCls} placeholder="Street, building number" value={form.addressLine1} onChange={(e) => update('addressLine1', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Address Line 2</label>
                <input className={inputCls} placeholder="Floor, unit — optional" value={form.addressLine2} onChange={(e) => update('addressLine2', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Postal Code</label>
                <input className={inputCls} value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-bold text-[#0B1F4D] text-base">Marketplace Context</h2>
              <p className="text-sm text-gray-500">Where will you sell your products?</p>
              <div className="space-y-3">
                {[
                  { value: 'wholesale', label: 'B2B Wholesale', desc: 'Sell in bulk to businesses. Minimum order quantities apply.', icon: '🏭' },
                  { value: 'retail',    label: 'B2C Retail',    desc: 'Sell directly to end consumers in your city.',             icon: '🛍️' },
                  { value: 'both',      label: 'Both Channels', desc: 'Sell wholesale and retail simultaneously.',                 icon: '🌐' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                      form.marketplaceContext === opt.value
                        ? 'border-[#0B1F4D] bg-[#0B1F4D]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ctx"
                      value={opt.value}
                      checked={form.marketplaceContext === opt.value}
                      onChange={() => update('marketplaceContext', opt.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className={`font-bold text-sm ${form.marketplaceContext === opt.value ? 'text-[#0B1F4D]' : 'text-gray-900'}`}>
                        {opt.icon} {opt.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-bold text-[#0B1F4D] text-base">Business Description</h2>
              <p className="text-sm text-gray-500">Tell buyers about your business — this appears on your public supplier profile.</p>
              <textarea
                className={`${inputCls} h-36 resize-none`}
                placeholder="e.g. We are a certified organic producer in Valencia, Spain, specialising in premium citrus fruits and olive oil. ISO 9001 certified. Cold-chain logistics available for EU delivery..."
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-800">
                <strong>What happens next?</strong> Our team will review your application within 48 hours. You'll be notified by email and can upload verification documents once your account is created.
              </div>
            </>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex justify-between pt-2">
            {step > 1 ? (
              <button
                onClick={() => { setError(null); setStep((s) => (s - 1) as Step) }}
                className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                onClick={() => { if (validateStep()) setStep((s) => (s + 1) as Step) }}
                className="flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#162d6e] transition-colors"
              >
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-2.5 text-sm font-bold hover:bg-[#fbb93a] transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
