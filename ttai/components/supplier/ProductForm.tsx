'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createProductSchema } from '@/lib/validation/schemas'
import { slugify } from '@/lib/utils'

interface ProductFormProps {
  supplierId: string
  mode: 'create' | 'edit'
  productId?: string
  initialData?: Partial<FormState>
}

interface FormState {
  name: string; slug: string; categoryId: string; marketplaceContext: 'wholesale' | 'retail' | 'both'
  cityId: string; description: string; sku: string; priceCents: string; currencyCode: string
  minOrderQty: string; stockQty: string; vatRate: string; weightGrams: string
}

const INITIAL: FormState = {
  name: '', slug: '', categoryId: '', marketplaceContext: 'wholesale',
  cityId: '', description: '', sku: '', priceCents: '', currencyCode: 'EUR',
  minOrderQty: '1', stockQty: '0', vatRate: '', weightGrams: '',
}

export function ProductForm({ supplierId, mode, productId, initialData }: ProductFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({ ...INITIAL, ...initialData })
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('categories').select('id, name, slug').order('name').then(({ data }) => setCategories(data ?? []))
    supabase.from('cities').select('id, name').eq('retail_active', true).order('name').then(({ data }) => setCities(data ?? []))
  }, [])

  function update(field: keyof FormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'name' && mode === 'create') next.slug = slugify(value)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const parsed = createProductSchema.safeParse({
      categoryId:         form.categoryId,
      marketplaceContext: form.marketplaceContext,
      cityId:             form.cityId || undefined,
      name:               form.name,
      slug:               form.slug,
      description:        form.description || undefined,
      sku:                form.sku || undefined,
      priceCents:         parseInt(form.priceCents) || 0,
      currencyCode:       form.currencyCode,
      minOrderQty:        parseInt(form.minOrderQty) || 1,
      stockQty:           parseInt(form.stockQty) || 0,
      vatRate:            form.vatRate ? parseFloat(form.vatRate) : undefined,
      weightGrams:        form.weightGrams ? parseInt(form.weightGrams) : undefined,
    })

    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      setLoading(false)
      return
    }

    const supabase = createClient()

    if (mode === 'create') {
      const { error: insertError } = await supabase.from('products').insert({
        supplier_id:         supplierId,
        category_id:         parsed.data.categoryId,
        marketplace_context: parsed.data.marketplaceContext,
        city_id:             parsed.data.cityId,
        name:                parsed.data.name,
        slug:                parsed.data.slug,
        description:         parsed.data.description,
        sku:                 parsed.data.sku,
        price_cents:         parsed.data.priceCents,
        currency_code:       parsed.data.currencyCode,
        min_order_qty:       parsed.data.minOrderQty,
        stock_qty:           parsed.data.stockQty,
        vat_rate:            parsed.data.vatRate,
        weight_grams:        parsed.data.weightGrams,
        is_published:        false,
      })

      if (insertError) { setError(insertError.message); setLoading(false); return }
      router.push('/supplier/products')
    } else if (mode === 'edit' && productId) {
      const { error: updateError } = await supabase.from('products').update({
        category_id:         parsed.data.categoryId,
        marketplace_context: parsed.data.marketplaceContext,
        city_id:             parsed.data.cityId,
        name:                parsed.data.name,
        description:         parsed.data.description,
        sku:                 parsed.data.sku,
        price_cents:         parsed.data.priceCents,
        min_order_qty:       parsed.data.minOrderQty,
        stock_qty:           parsed.data.stockQty,
        vat_rate:            parsed.data.vatRate,
        weight_grams:        parsed.data.weightGrams,
      }).eq('id', productId)

      if (updateError) { setError(updateError.message); setLoading(false); return }
      router.push('/supplier/products')
    }
  }

  const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  const needsCity = form.marketplaceContext === 'retail' || form.marketplaceContext === 'both'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium">Product Name *</label>
          <input className={inputCls} value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Slug *</label>
          <input className={inputCls} value={form.slug} onChange={(e) => update('slug', e.target.value)} required pattern="[a-z0-9-]+" />
          <p className="text-xs text-muted-foreground">Lowercase letters, numbers, hyphens only</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">SKU</label>
          <input className={inputCls} value={form.sku} onChange={(e) => update('sku', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Category *</label>
          <select className={inputCls} value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} required>
            <option value="">Select category...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Marketplace Context *</label>
          <select className={inputCls} value={form.marketplaceContext} onChange={(e) => update('marketplaceContext', e.target.value as FormState['marketplaceContext'])}>
            <option value="wholesale">Wholesale (B2B)</option>
            <option value="retail">Retail (B2C)</option>
            <option value="both">Both</option>
          </select>
        </div>
        {needsCity && (
          <div className="space-y-1">
            <label className="text-sm font-medium">City *</label>
            <select className={inputCls} value={form.cityId} onChange={(e) => update('cityId', e.target.value)} required>
              <option value="">Select city...</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-sm font-medium">Price (cents) *</label>
          <input className={inputCls} type="number" min="1" value={form.priceCents} onChange={(e) => update('priceCents', e.target.value)} required placeholder="e.g. 1000 = €10.00" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Currency</label>
          <input className={inputCls} value={form.currencyCode} onChange={(e) => update('currencyCode', e.target.value)} maxLength={3} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Min Order Qty</label>
          <input className={inputCls} type="number" min="1" value={form.minOrderQty} onChange={(e) => update('minOrderQty', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Stock Qty</label>
          <input className={inputCls} type="number" min="0" value={form.stockQty} onChange={(e) => update('stockQty', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">VAT Rate %</label>
          <input className={inputCls} type="number" step="0.01" min="0" max="100" value={form.vatRate} onChange={(e) => update('vatRate', e.target.value)} placeholder="e.g. 21" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Weight (grams)</label>
          <input className={inputCls} type="number" min="1" value={form.weightGrams} onChange={(e) => update('weightGrams', e.target.value)} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <textarea className={`${inputCls} h-28 resize-none`} value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
          Cancel
        </button>
      </div>
    </form>
  )
}
