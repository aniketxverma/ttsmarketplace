'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'

interface ProductFormProps {
  supplierId: string
  mode: 'create' | 'edit'
  productId?: string
  initialData?: Partial<FormState>
}

interface FormState {
  name: string; slug: string; categoryId: string; marketplaceContext: 'wholesale' | 'retail' | 'both'
  cityId: string; description: string; sku: string
  priceDisplay: string   // shown in euros/currency units, converted to cents on save
  currencyCode: string; minOrderQty: string; stockQty: string; vatRate: string; weightGrams: string
  isPublished: boolean
}

const INITIAL: FormState = {
  name: '', slug: '', categoryId: '', marketplaceContext: 'wholesale',
  cityId: '', description: '', sku: '',
  priceDisplay: '', currencyCode: 'EUR',
  minOrderQty: '1', stockQty: '0', vatRate: '10', weightGrams: '',
  isPublished: false,
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'AED', 'SAR', 'MAD']

export function ProductForm({ supplierId, mode, productId, initialData }: ProductFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({ ...INITIAL, ...initialData })
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('categories').select('id, name, slug').order('name').then(({ data }) => setCategories(data ?? []))
    supabase.from('cities').select('id, name').eq('retail_active', true).order('name').then(({ data }) => setCities(data ?? []))
  }, [])

  function update(field: keyof FormState, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'name' && mode === 'create') next.slug = slugify(value as string)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!form.name.trim()) { setError('Product name is required'); setLoading(false); return }
    if (!form.categoryId) { setError('Category is required'); setLoading(false); return }
    if (!form.slug.trim()) { setError('Slug is required'); setLoading(false); return }

    const priceFloat = parseFloat(form.priceDisplay)
    if (!form.priceDisplay || isNaN(priceFloat) || priceFloat <= 0) {
      setError('Please enter a valid price greater than 0'); setLoading(false); return
    }
    const priceCents = Math.round(priceFloat * 100)

    const payload = {
      category_id:         form.categoryId,
      marketplace_context: form.marketplaceContext,
      city_id:             form.cityId || null,
      name:                form.name.trim(),
      slug:                form.slug.trim(),
      description:         form.description.trim() || null,
      sku:                 form.sku.trim() || null,
      price_cents:         priceCents,
      currency_code:       form.currencyCode,
      min_order_qty:       parseInt(form.minOrderQty) || 1,
      stock_qty:           parseInt(form.stockQty) || 0,
      vat_rate:            form.vatRate ? parseFloat(form.vatRate) : null,
      weight_grams:        form.weightGrams ? parseInt(form.weightGrams) : null,
      is_published:        form.isPublished,
    }

    const supabase = createClient()

    if (mode === 'create') {
      const { error: insertError } = await supabase.from('products').insert({
        ...payload, supplier_id: supplierId,
      })
      if (insertError) { setError(insertError.message); setLoading(false); return }
    } else if (mode === 'edit' && productId) {
      const { error: updateError } = await supabase.from('products').update(payload).eq('id', productId)
      if (updateError) { setError(updateError.message); setLoading(false); return }
    }

    setSuccess(true)
    setTimeout(() => router.push('/supplier/products'), 800)
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all bg-white'
  const labelCls = 'text-xs font-semibold text-gray-600 uppercase tracking-wide'
  const needsCity = form.marketplaceContext === 'retail' || form.marketplaceContext === 'both'

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-gray-900">Product saved!</p>
        <p className="text-sm text-gray-500 mt-1">Redirecting to products list...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Basic Info */}
      <div>
        <h3 className="font-bold text-[#0B1F4D] text-sm mb-4 pb-2 border-b">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelCls}>Product Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="e.g. Organic Extra Virgin Olive Oil 5L" />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>URL Slug *</label>
            <input className={inputCls} value={form.slug} onChange={(e) => update('slug', e.target.value)} required pattern="[a-z0-9-]+" placeholder="auto-generated-from-name" />
            <p className="text-xs text-gray-400">Lowercase letters, numbers and hyphens only</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>SKU</label>
            <input className={inputCls} value={form.sku} onChange={(e) => update('sku', e.target.value)} placeholder="e.g. EVOO-001" />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Category *</label>
            <select className={inputCls} value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} required>
              <option value="">Select category...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Marketplace</label>
            <select className={inputCls} value={form.marketplaceContext} onChange={(e) => update('marketplaceContext', e.target.value as FormState['marketplaceContext'])}>
              <option value="wholesale">Wholesale (B2B)</option>
              <option value="retail">Retail (B2C)</option>
              <option value="both">Both</option>
            </select>
          </div>
          {needsCity && (
            <div className="space-y-1.5">
              <label className={labelCls}>City *</label>
              <select className={inputCls} value={form.cityId} onChange={(e) => update('cityId', e.target.value)} required>
                <option value="">Select city...</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} h-28 resize-none`} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe your product — specifications, certifications, packaging..." />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h3 className="font-bold text-[#0B1F4D] text-sm mb-4 pb-2 border-b">Pricing & Inventory</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Price *</label>
            <div className="flex gap-2">
              <select
                className="rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] bg-white"
                value={form.currencyCode}
                onChange={(e) => update('currencyCode', e.target.value)}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                className={`${inputCls} flex-1`}
                type="number"
                step="0.01"
                min="0.01"
                value={form.priceDisplay}
                onChange={(e) => update('priceDisplay', e.target.value)}
                required
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-400">Enter the price in {form.currencyCode} (e.g. 24.99)</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>VAT Rate %</label>
            <input className={inputCls} type="number" step="0.01" min="0" max="100" value={form.vatRate} onChange={(e) => update('vatRate', e.target.value)} placeholder="e.g. 21" />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Min Order Qty</label>
            <input className={inputCls} type="number" min="1" value={form.minOrderQty} onChange={(e) => update('minOrderQty', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Stock Qty</label>
            <input className={inputCls} type="number" min="0" value={form.stockQty} onChange={(e) => update('stockQty', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Weight (grams)</label>
            <input className={inputCls} type="number" min="1" value={form.weightGrams} onChange={(e) => update('weightGrams', e.target.value)} placeholder="Optional" />
          </div>
        </div>
      </div>

      {/* Publish toggle */}
      <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm text-gray-900">
            {form.isPublished ? 'Published — visible on marketplace' : 'Draft — not visible to buyers'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {form.isPublished ? 'Buyers can discover and purchase this product.' : 'Save as draft and publish when ready.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => update('isPublished', !form.isPublished)}
          className={`relative w-12 h-6 rounded-full transition-colors ${form.isPublished ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isPublished ? 'translate-x-6' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-6 py-3 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            mode === 'create' ? 'Create Product' : 'Save Changes'
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border-2 border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
