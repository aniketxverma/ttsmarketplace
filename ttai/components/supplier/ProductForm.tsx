'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
  productLine: string
  cityId: string; description: string; sku: string
  priceDisplay: string       // wholesale / B2B price, converted to cents on save
  retailPriceDisplay: string // online-shop (retail) per-piece price
  currencyCode: string; minOrderQty: string; stockQty: string; vatRate: string; weightGrams: string
  // Packaging & multi-unit purchasing
  modelName: string; referenceNumber: string; ean: string; countryOfOrigin: string; leadTime: string
  netContent: string; unitWeightKg: string; unitDimensions: string
  unitsPerCarton: string; cartonWeightKg: string; cartonDimensions: string
  cartonsPerPallet: string; palletWeightKg: string; palletDimensions: string
  palletsPerTruck: string; truckCapacity: string
  pricePerBox: string; pricePerPallet: string; pricePerTruck: string
  sellPiece: boolean; sellBox: boolean; sellPallet: boolean; sellTruck: boolean
  isPublished: boolean
}

const INITIAL: FormState = {
  name: '', slug: '', categoryId: '', marketplaceContext: 'wholesale',
  productLine: '',
  cityId: '', description: '', sku: '',
  priceDisplay: '', retailPriceDisplay: '', currencyCode: 'EUR',
  minOrderQty: '1', stockQty: '0', vatRate: '10', weightGrams: '',
  modelName: '', referenceNumber: '', ean: '', countryOfOrigin: '', leadTime: '',
  netContent: '', unitWeightKg: '', unitDimensions: '',
  unitsPerCarton: '', cartonWeightKg: '', cartonDimensions: '',
  cartonsPerPallet: '', palletWeightKg: '', palletDimensions: '',
  palletsPerTruck: '', truckCapacity: '',
  pricePerBox: '', pricePerPallet: '', pricePerTruck: '',
  sellPiece: true, sellBox: false, sellPallet: false, sellTruck: false,
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
  // create-mode only: stage images before product exists
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

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
      product_line:        form.productLine.trim() || null,
      description:         form.description.trim() || null,
      sku:                 form.sku.trim() || null,
      price_cents:         priceCents,
      retail_price_cents:  form.retailPriceDisplay && parseFloat(form.retailPriceDisplay) > 0
                             ? Math.round(parseFloat(form.retailPriceDisplay) * 100) : null,
      currency_code:       form.currencyCode,
      min_order_qty:       form.marketplaceContext === 'retail' ? 1 : (parseInt(form.minOrderQty) || 1),
      stock_qty:           parseInt(form.stockQty) || 0,
      vat_rate:            form.vatRate ? parseFloat(form.vatRate) : null,
      weight_grams:        form.weightGrams ? parseInt(form.weightGrams) : null,
      // Packaging & multi-unit
      model_name:          form.modelName.trim() || null,
      reference_number:    form.referenceNumber.trim() || null,
      ean:                 form.ean.trim() || null,
      country_of_origin:   form.countryOfOrigin.trim() || null,
      lead_time:           form.leadTime.trim() || null,
      net_content:         form.netContent.trim() || null,
      unit_weight_kg:      form.unitWeightKg ? parseFloat(form.unitWeightKg) : null,
      unit_dimensions:     form.unitDimensions.trim() || null,
      units_per_carton:    form.unitsPerCarton ? parseInt(form.unitsPerCarton) : null,
      carton_weight_kg:    form.cartonWeightKg ? parseFloat(form.cartonWeightKg) : null,
      carton_dimensions:   form.cartonDimensions.trim() || null,
      cartons_per_pallet:  form.cartonsPerPallet ? parseInt(form.cartonsPerPallet) : null,
      pallet_weight_kg:    form.palletWeightKg ? parseFloat(form.palletWeightKg) : null,
      pallet_dimensions:   form.palletDimensions.trim() || null,
      pallets_per_truck:   form.palletsPerTruck ? parseInt(form.palletsPerTruck) : null,
      truck_capacity:      form.truckCapacity.trim() || null,
      price_per_box_cents:    form.pricePerBox && parseFloat(form.pricePerBox) > 0 ? Math.round(parseFloat(form.pricePerBox) * 100) : null,
      price_per_pallet_cents: form.pricePerPallet && parseFloat(form.pricePerPallet) > 0 ? Math.round(parseFloat(form.pricePerPallet) * 100) : null,
      price_per_truck_cents:  form.pricePerTruck && parseFloat(form.pricePerTruck) > 0 ? Math.round(parseFloat(form.pricePerTruck) * 100) : null,
      sell_piece:          form.sellPiece,
      sell_box:            form.sellBox,
      sell_pallet:         form.sellPallet,
      sell_truck:          form.sellTruck,
      is_published:        form.isPublished,
    }

    const supabase = createClient()

    if (mode === 'create') {
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert({ ...payload, supplier_id: supplierId })
        .select('id')
        .single()
      if (insertError || !newProduct) { setError(insertError?.message ?? 'Insert failed'); setLoading(false); return }

      // Upload staged images via the server endpoint (admin → brand-assets bucket)
      for (let i = 0; i < pendingFiles.length; i++) {
        const fd = new FormData()
        fd.append('file', pendingFiles[i])
        fd.append('folder', 'products')
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upJson = await upRes.json().catch(() => ({}))
        if (!upRes.ok || !upJson.url) continue
        await supabase.from('product_images').insert({ product_id: newProduct.id, url: upJson.url, sort_order: i })
      }
    } else if (mode === 'edit' && productId) {
      const { error: updateError } = await supabase.from('products').update(payload).eq('id', productId)
      if (updateError) { setError(updateError.message); setLoading(false); return }
    }

    setSuccess(true)
    setTimeout(() => router.push('/supplier/products'), 800)
  }

  function handlePendingFiles(fileList: FileList) {
    const allowed = Array.from(fileList).filter(f => f.type.startsWith('image/')).slice(0, 10)
    const previews = allowed.map(f => URL.createObjectURL(f))
    setPendingFiles(prev => [...prev, ...allowed].slice(0, 10))
    setPendingPreviews(prev => [...prev, ...previews].slice(0, 10))
  }

  function removePending(index: number) {
    URL.revokeObjectURL(pendingPreviews[index])
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
    setPendingPreviews(prev => prev.filter((_, i) => i !== index))
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
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelCls}>Product line / family</label>
            <input className={inputCls} value={form.productLine} onChange={(e) => update('productLine', e.target.value)} placeholder="e.g. Rozil Detergents" />
            <p className="text-xs text-gray-400">
              Optional. Products sharing the same line show as one card in the marketplace; buyers open it to pick a variant. Leave blank to group by category.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Sell in which shop?</label>
            <select className={inputCls} value={form.marketplaceContext} onChange={(e) => update('marketplaceContext', e.target.value as FormState['marketplaceContext'])}>
              <option value="wholesale">Shop B2B only — wholesale (box / pallet / truck)</option>
              <option value="retail">Online Shop only — retail (by piece)</option>
              <option value="both">Both shops — B2B &amp; Online</option>
            </select>
            <p className="text-[11px] text-gray-400">Controls where this product appears: your B2B (wholesale) shop, your Online (retail) shop, or both.</p>
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
            <label className={labelCls}>Wholesale price (B2B) *</label>
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
            <p className="text-xs text-gray-400">Per-unit wholesale price shown in the B2B marketplace</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Online shop price (retail)</label>
            <input
              className={inputCls}
              type="number"
              step="0.01"
              min="0.01"
              value={form.retailPriceDisplay}
              onChange={(e) => update('retailPriceDisplay', e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-400">Per-piece price in the Online Shop. Leave empty to use the wholesale price.</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>VAT Rate %</label>
            <input className={inputCls} type="number" step="0.01" min="0" max="100" value={form.vatRate} onChange={(e) => update('vatRate', e.target.value)} placeholder="e.g. 21" />
          </div>
          {form.marketplaceContext === 'retail' ? (
            <div className="space-y-1.5">
              <label className={labelCls}>Min Order Qty</label>
              <div className={`${inputCls} flex items-center text-gray-400 bg-gray-50 cursor-not-allowed`}>
                Sold by piece — no minimum
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className={labelCls}>Min Order Qty {form.marketplaceContext === 'both' && <span className="text-gray-400 normal-case font-normal">(wholesale)</span>}</label>
              <input className={inputCls} type="number" min="1" value={form.minOrderQty} onChange={(e) => update('minOrderQty', e.target.value)} />
            </div>
          )}
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

      {/* Images — create mode only (edit mode uses ProductImageManager on the page) */}
      {mode === 'create' && (
        <div>
          <h3 className="font-bold text-[#0B1F4D] text-sm mb-4 pb-2 border-b">Product Images</h3>
          {pendingPreviews.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
              {pendingPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
                  <Image src={src} alt={`Preview ${i + 1}`} fill className="object-cover" sizes="120px" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-[#F5A623] text-[#0B1F4D] text-[9px] font-black px-1.5 py-0.5 rounded-full z-10">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    ×
                  </button>
                </div>
              ))}
              {pendingPreviews.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#0B1F4D] hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#0B1F4D]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[10px] font-semibold">Add</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#0B1F4D] hover:bg-blue-50/30 transition-all p-8 flex flex-col items-center gap-2 text-gray-400 hover:text-[#0B1F4D]"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">Click to add product images</p>
                <p className="text-xs mt-0.5">JPG, PNG, WebP — up to 10 images</p>
              </div>
            </button>
          )}
          <p className="text-xs text-gray-400 mt-2">First image becomes the primary listing photo. Images upload after the product is created.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handlePendingFiles(e.target.files)}
          />
        </div>
      )}

      {/* Packaging & wholesale units */}
      <div>
        <h3 className="font-bold text-[#0B1F4D] text-sm mb-1 pb-2 border-b">Packaging &amp; wholesale units</h3>
        <p className="text-xs text-gray-400 mt-2 mb-4">
          One product, sold by piece / box / pallet / truck. Pallet &amp; truck totals are calculated automatically from these numbers — never put specs inside images.
        </p>

        {/* Sell-in toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {([
            ['sellPiece', 'Piece'], ['sellBox', 'Box'], ['sellPallet', 'Pallet'], ['sellTruck', 'Truck'],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => update(key, !form[key])}
              className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-all ${
                form[key] ? 'border-[#0B1F4D] bg-[#0B1F4D] text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              Sell by {label}
            </button>
          ))}
        </div>

        {/* Unit + commercial */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Unit (1 piece)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="space-y-1.5"><label className={labelCls}>Net content</label><input className={inputCls} value={form.netContent} onChange={(e) => update('netContent', e.target.value)} placeholder="5 L" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Unit weight (kg)</label><input className={inputCls} type="number" step="0.01" value={form.unitWeightKg} onChange={(e) => update('unitWeightKg', e.target.value)} placeholder="5.25" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Unit dimensions</label><input className={inputCls} value={form.unitDimensions} onChange={(e) => update('unitDimensions', e.target.value)} placeholder="18.5 x 11.5 x 29.5 cm" /></div>
          <div className="space-y-1.5"><label className={labelCls}>EAN / barcode</label><input className={inputCls} value={form.ean} onChange={(e) => update('ean', e.target.value)} placeholder="8421234567890" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Model</label><input className={inputCls} value={form.modelName} onChange={(e) => update('modelName', e.target.value)} placeholder="Rozil Max Power" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Reference</label><input className={inputCls} value={form.referenceNumber} onChange={(e) => update('referenceNumber', e.target.value)} placeholder="REF-001" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Country of origin</label><input className={inputCls} value={form.countryOfOrigin} onChange={(e) => update('countryOfOrigin', e.target.value)} placeholder="Spain" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Lead time</label><input className={inputCls} value={form.leadTime} onChange={(e) => update('leadTime', e.target.value)} placeholder="7–14 days" /></div>
        </div>

        {/* Box */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Box (carton)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="space-y-1.5"><label className={labelCls}>Units per box</label><input className={inputCls} type="number" min="1" value={form.unitsPerCarton} onChange={(e) => update('unitsPerCarton', e.target.value)} placeholder="4" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Box weight (kg)</label><input className={inputCls} type="number" step="0.01" value={form.cartonWeightKg} onChange={(e) => update('cartonWeightKg', e.target.value)} placeholder="22" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Box dimensions</label><input className={inputCls} value={form.cartonDimensions} onChange={(e) => update('cartonDimensions', e.target.value)} placeholder="40 x 28 x 29 cm" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Price per box ({form.currencyCode})</label><input className={inputCls} type="number" step="0.01" value={form.pricePerBox} onChange={(e) => update('pricePerBox', e.target.value)} placeholder="auto" /></div>
        </div>

        {/* Pallet */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Pallet</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="space-y-1.5"><label className={labelCls}>Boxes per pallet</label><input className={inputCls} type="number" min="1" value={form.cartonsPerPallet} onChange={(e) => update('cartonsPerPallet', e.target.value)} placeholder="105" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Pallet weight (kg)</label><input className={inputCls} type="number" step="0.01" value={form.palletWeightKg} onChange={(e) => update('palletWeightKg', e.target.value)} placeholder="1050" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Pallet dimensions</label><input className={inputCls} value={form.palletDimensions} onChange={(e) => update('palletDimensions', e.target.value)} placeholder="120 x 100 x 160 cm" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Price per pallet ({form.currencyCode})</label><input className={inputCls} type="number" step="0.01" value={form.pricePerPallet} onChange={(e) => update('pricePerPallet', e.target.value)} placeholder="auto" /></div>
        </div>

        {/* Truck */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Truck (full load)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5"><label className={labelCls}>Pallets per truck</label><input className={inputCls} type="number" min="1" value={form.palletsPerTruck} onChange={(e) => update('palletsPerTruck', e.target.value)} placeholder="33" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Truck capacity</label><input className={inputCls} value={form.truckCapacity} onChange={(e) => update('truckCapacity', e.target.value)} placeholder="13.6 m / 33 pallets" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Price per truck ({form.currencyCode})</label><input className={inputCls} type="number" step="0.01" value={form.pricePerTruck} onChange={(e) => update('pricePerTruck', e.target.value)} placeholder="auto" /></div>
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
