'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createSupplierSchema } from '@/lib/validation/schemas'

type Step = 1 | 2 | 3 | 4

interface FormState {
  legalName: string
  tradeName: string
  taxId: string
  vatNumber: string
  countryId: string
  cityId: string
  addressLine1: string
  addressLine2: string
  postalCode: string
  marketplaceContext: 'wholesale' | 'retail' | 'both'
  description: string
}

const INITIAL: FormState = {
  legalName: '', tradeName: '', taxId: '', vatNumber: '',
  countryId: '', cityId: '', addressLine1: '', addressLine2: '', postalCode: '',
  marketplaceContext: 'wholesale', description: '',
}

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

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    const parsed = createSupplierSchema.safeParse({
      legalName: form.legalName,
      tradeName: form.tradeName || undefined,
      taxId: form.taxId,
      vatNumber: form.vatNumber || undefined,
      countryId: form.countryId,
      cityId: form.cityId || undefined,
      addressLine1: form.addressLine1 || undefined,
      postalCode: form.postalCode || undefined,
      marketplaceContext: form.marketplaceContext,
      description: form.description || undefined,
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

  const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Supplier Onboarding</h1>
        <div className="flex gap-1 mt-3">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">Step {step} of 4</p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        {step === 1 && (
          <>
            <h2 className="font-semibold">Company Information</h2>
            <div className="space-y-1">
              <label className="text-sm font-medium">Legal Name *</label>
              <input className={inputCls} value={form.legalName} onChange={(e) => update('legalName', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Trade Name</label>
              <input className={inputCls} placeholder="Optional — shown publicly" value={form.tradeName} onChange={(e) => update('tradeName', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Tax ID *</label>
                <input className={inputCls} value={form.taxId} onChange={(e) => update('taxId', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">VAT Number</label>
                <input className={inputCls} placeholder="Optional" value={form.vatNumber} onChange={(e) => update('vatNumber', e.target.value)} />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-semibold">Address</h2>
            <div className="space-y-1" onClick={loadCountries}>
              <label className="text-sm font-medium">Country *</label>
              <select className={inputCls} value={form.countryId} onChange={(e) => update('countryId', e.target.value)} onFocus={loadCountries}>
                <option value="">Select country...</option>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Address Line 1</label>
              <input className={inputCls} value={form.addressLine1} onChange={(e) => update('addressLine1', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Address Line 2</label>
              <input className={inputCls} value={form.addressLine2} onChange={(e) => update('addressLine2', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Postal Code</label>
              <input className={inputCls} value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-semibold">Marketplace Context</h2>
            <p className="text-sm text-muted-foreground">Where will you sell your products?</p>
            {[
              { value: 'wholesale', label: 'B2B Wholesale', desc: 'Sell in bulk to businesses. Minimum order quantities apply.' },
              { value: 'retail',    label: 'B2C Retail',    desc: 'Sell directly to consumers in your city.' },
              { value: 'both',      label: 'Both',          desc: 'Sell wholesale and retail.' },
            ].map((opt) => (
              <label key={opt.value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent ${form.marketplaceContext === opt.value ? 'border-primary bg-primary/5' : ''}`}>
                <input type="radio" name="ctx" value={opt.value} checked={form.marketplaceContext === opt.value} onChange={() => update('marketplaceContext', opt.value)} className="mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="font-semibold">Description</h2>
            <p className="text-sm text-muted-foreground">Tell buyers about your business</p>
            <textarea
              className={`${inputCls} h-32 resize-none`}
              placeholder="Describe your products, capabilities, and what makes you unique..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </>
        )}

        {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}

        <div className="flex justify-between pt-2">
          {step > 1 ? (
            <button onClick={() => setStep((s) => (s - 1) as Step)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
              Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={() => {
                if (step === 1 && (!form.legalName || !form.taxId)) { setError('Legal name and Tax ID are required'); return }
                if (step === 2 && !form.countryId) { setError('Country is required'); return }
                setError(null)
                setStep((s) => (s + 1) as Step)
              }}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
