'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { canSellUnit, requiredPlanLabel, SELL_PLAN_LABEL } from '@/lib/selling'
import type { PurchaseUnit } from '@/lib/packaging'
import { minRetailCents, addVatCents } from '@/lib/pricing-rules'

interface ProductFormProps {
  supplierId: string
  mode: 'create' | 'edit'
  productId?: string
  initialData?: Partial<FormState>
  /** Seller's plan tier — gates which units they can sell by. */
  sellerTier?: string
  /** Marketplace pricing rules (admin-configured). */
  minMarginPct?: number
  vatPct?: number
  vatEnabled?: boolean
}

interface FormState {
  name: string; slug: string; categoryId: string; marketplaceContext: 'wholesale' | 'retail' | 'both'
  productLine: string; isFamilyCover: boolean; brandName: string
  cityId: string; description: string; sku: string
  priceDisplay: string       // wholesale / B2B price, converted to cents on save
  retailPriceDisplay: string // online-shop (retail) per-piece price
  currencyCode: string; minOrderQty: string; stockQty: string; vatRate: string; weightGrams: string
  minBoxQty: string; minPalletQty: string; minTruckQty: string
  // Packaging & multi-unit purchasing
  modelName: string; referenceNumber: string; ean: string; countryOfOrigin: string; leadTime: string
  netContent: string; unitWeightKg: string; unitDimensions: string
  unitsPerCarton: string; cartonWeightKg: string; cartonNetWeightKg: string; cartonDimensions: string
  cartonsPerPallet: string; palletWeightKg: string; palletDimensions: string; palletHeightCm: string
  palletsPerTruck: string; truckCapacity: string
  exwPrice: string; pricePerBox: string; pricePerPallet: string; pricePerTruck: string
  boxDiscountPct: string; palletDiscountPct: string; truckDiscountPct: string
  hsCode: string; catalogueUrl: string; videoUrl: string
  sellPiece: boolean; sellBox: boolean; sellPallet: boolean; sellTruck: boolean
  priceNegotiable: boolean
  isPublished: boolean
}

const INITIAL: FormState = {
  name: '', slug: '', categoryId: '', marketplaceContext: 'wholesale',
  productLine: '', isFamilyCover: false, brandName: '',
  cityId: '', description: '', sku: '',
  priceDisplay: '', retailPriceDisplay: '', currencyCode: 'EUR',
  minOrderQty: '1', stockQty: '0', vatRate: '10', weightGrams: '',
  minBoxQty: '1', minPalletQty: '1', minTruckQty: '1',
  modelName: '', referenceNumber: '', ean: '', countryOfOrigin: '', leadTime: '',
  netContent: '', unitWeightKg: '', unitDimensions: '',
  unitsPerCarton: '', cartonWeightKg: '', cartonNetWeightKg: '', cartonDimensions: '',
  cartonsPerPallet: '', palletWeightKg: '', palletDimensions: '', palletHeightCm: '',
  palletsPerTruck: '', truckCapacity: '',
  exwPrice: '', pricePerBox: '', pricePerPallet: '', pricePerTruck: '',
  boxDiscountPct: '', palletDiscountPct: '', truckDiscountPct: '',
  hsCode: '', catalogueUrl: '', videoUrl: '',
  sellPiece: true, sellBox: false, sellPallet: false, sellTruck: false,
  priceNegotiable: false,
  isPublished: false,
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'AED', 'SAR', 'MAD']

export function ProductForm({
  supplierId, mode, productId, initialData, sellerTier,
  minMarginPct = 30, vatPct = 21, vatEnabled = true,
}: ProductFormProps) {
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
  const [pendingRoles, setPendingRoles] = useState<string[]>([])  // '' both | 'retail' | 'b2b'
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

  // Cost basis for the protected retail price = BOX price per piece (else base price).
  function retailCostBasisCents(): number {
    const baseCents = Math.round((parseFloat(form.priceDisplay) || 0) * 100)
    const boxPieces = parseInt(form.unitsPerCarton) || 0
    if (boxPieces <= 0) return baseCents
    const disc = parseFloat(form.boxDiscountPct) || 0
    const boxTotal = form.pricePerBox && parseFloat(form.pricePerBox) > 0
      ? Math.round(parseFloat(form.pricePerBox) * 100)
      : Math.round(baseCents * boxPieces * (disc > 0 ? 1 - disc / 100 : 1))
    return boxTotal > 0 ? Math.round(boxTotal / boxPieces) : baseCents
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

    // ── Retail price protection: never below wholesale + minimum margin ──────
    const floorRetail = minRetailCents(retailCostBasisCents(), minMarginPct)
    const enteredRetail = form.retailPriceDisplay && parseFloat(form.retailPriceDisplay) > 0
      ? Math.round(parseFloat(form.retailPriceDisplay) * 100) : 0
    if (enteredRetail > 0 && enteredRetail < floorRetail) {
      const fmtCur = (c: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: form.currencyCode }).format(c / 100)
      setError(`End-user price ${fmtCur(enteredRetail)} is below the minimum ${fmtCur(floorRetail)} (box price + ${minMarginPct}%). Set it equal or higher.`)
      setLoading(false); return
    }
    // Empty / valid → store the protected price (auto-calculated to the floor when blank).
    const finalRetailCents = enteredRetail > 0 ? enteredRetail : floorRetail

    const payload = {
      category_id:         form.categoryId,
      marketplace_context: form.marketplaceContext,
      city_id:             form.cityId || null,
      name:                form.name.trim(),
      slug:                form.slug.trim(),
      product_line:        form.productLine.trim() || null,
      is_family_cover:     form.productLine.trim() ? form.isFamilyCover : false,
      brand_name:          form.brandName.trim() || null,
      description:         form.description.trim() || null,
      sku:                 form.sku.trim() || null,
      price_cents:         priceCents,
      retail_price_cents:  finalRetailCents > 0 ? finalRetailCents : null,
      currency_code:       form.currencyCode,
      min_order_qty:       parseInt(form.minOrderQty) || 1,
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
      carton_net_weight_kg: form.cartonNetWeightKg ? parseFloat(form.cartonNetWeightKg) : null,
      carton_dimensions:   form.cartonDimensions.trim() || null,
      cartons_per_pallet:  form.cartonsPerPallet ? parseInt(form.cartonsPerPallet) : null,
      pallet_weight_kg:    form.palletWeightKg ? parseFloat(form.palletWeightKg) : null,
      pallet_dimensions:   form.palletDimensions.trim() || null,
      pallet_height_cm:    form.palletHeightCm ? parseInt(form.palletHeightCm) : null,
      pallets_per_truck:   form.palletsPerTruck ? parseInt(form.palletsPerTruck) : null,
      truck_capacity:      form.truckCapacity.trim() || null,
      hs_code:             form.hsCode.trim() || null,
      catalogue_url:       form.catalogueUrl.trim() || null,
      video_url:           form.videoUrl.trim() || null,
      exw_price_cents:        form.exwPrice && parseFloat(form.exwPrice) > 0 ? Math.round(parseFloat(form.exwPrice) * 100) : null,
      price_per_box_cents:    form.pricePerBox && parseFloat(form.pricePerBox) > 0 ? Math.round(parseFloat(form.pricePerBox) * 100) : null,
      price_per_pallet_cents: form.pricePerPallet && parseFloat(form.pricePerPallet) > 0 ? Math.round(parseFloat(form.pricePerPallet) * 100) : null,
      price_per_truck_cents:  form.pricePerTruck && parseFloat(form.pricePerTruck) > 0 ? Math.round(parseFloat(form.pricePerTruck) * 100) : null,
      // Per-tier minimum order quantities (B2B volume tiers).
      min_box_qty:            Math.max(1, parseInt(form.minBoxQty)    || 1),
      min_pallet_qty:         Math.max(1, parseInt(form.minPalletQty) || 1),
      min_truck_qty:          Math.max(1, parseInt(form.minTruckQty)  || 1),
      // Per-tier volume discounts (% off base — used when no explicit price set).
      box_discount_pct:       form.boxDiscountPct    ? Math.min(100, Math.max(0, parseFloat(form.boxDiscountPct)    || 0)) : 0,
      pallet_discount_pct:    form.palletDiscountPct ? Math.min(100, Math.max(0, parseFloat(form.palletDiscountPct) || 0)) : 0,
      truck_discount_pct:     form.truckDiscountPct  ? Math.min(100, Math.max(0, parseFloat(form.truckDiscountPct)  || 0)) : 0,
      price_negotiable:    form.priceNegotiable,
      // Cap sell-by units to the seller's plan (locked units can't be enabled).
      sell_piece:          form.sellPiece  && canSellUnit(sellerTier, 'piece'),
      sell_box:            form.sellBox    && canSellUnit(sellerTier, 'box'),
      sell_pallet:         form.sellPallet && canSellUnit(sellerTier, 'pallet'),
      sell_truck:          form.sellTruck  && canSellUnit(sellerTier, 'truck'),
      is_published:        form.isPublished,
    }

    const supabase = createClient()

    // If a recently-added column (e.g. discount %) isn't migrated yet, drop those
    // keys and retry so saving still works.
    const OPTIONAL_KEYS = ['box_discount_pct', 'pallet_discount_pct', 'truck_discount_pct',
      'brand_name', 'source_type', 'original_supplier_id', 'current_owner_id', 'created_by']
    const stripOptional = (obj: any) => { const o = { ...obj }; OPTIONAL_KEYS.forEach(k => delete o[k]); return o }
    const isMissingColumn = (msg?: string | null) => !!msg && /column|does not exist|discount_pct/i.test(msg)

    // Only one product per line can be the family cover — clear the flag on siblings.
    async function dedupeCover(currentId: string | null) {
      const line = form.productLine.trim()
      if (!form.isFamilyCover || !line) return
      let q = (supabase.from('products') as any)
        .update({ is_family_cover: false })
        .eq('supplier_id', supplierId)
        .eq('product_line', line)
      if (currentId) q = q.neq('id', currentId)
      await q
    }

    if (mode === 'create') {
      // Provenance: this supplier is the origin + current owner (captured once).
      const { data: { user } } = await supabase.auth.getUser()
      const provenance = { original_supplier_id: supplierId, current_owner_id: supplierId, source_type: 'Supplier', created_by: user?.id ?? null }
      let ins = await supabase.from('products').insert({ ...payload, ...provenance, supplier_id: supplierId }).select('id').single()
      if (ins.error && isMissingColumn(ins.error.message)) {
        ins = await supabase.from('products').insert({ ...stripOptional(payload), supplier_id: supplierId }).select('id').single()
      }
      const newProduct = ins.data
      if (ins.error || !newProduct) { setError(ins.error?.message ?? 'Insert failed'); setLoading(false); return }
      await dedupeCover(newProduct.id)

      // Upload staged images via the server endpoint (admin → brand-assets bucket)
      for (let i = 0; i < pendingFiles.length; i++) {
        const fd = new FormData()
        fd.append('file', pendingFiles[i])
        fd.append('folder', 'products')
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upJson = await upRes.json().catch(() => ({}))
        if (!upRes.ok || !upJson.url) continue
        await (supabase.from('product_images') as any).insert({ product_id: newProduct.id, url: upJson.url, sort_order: i, image_role: pendingRoles[i] || null })
      }
    } else if (mode === 'edit' && productId) {
      let upd = await supabase.from('products').update(payload).eq('id', productId)
      if (upd.error && isMissingColumn(upd.error.message)) {
        upd = await supabase.from('products').update(stripOptional(payload)).eq('id', productId)
      }
      if (upd.error) { setError(upd.error.message); setLoading(false); return }
      await dedupeCover(productId)
    }

    setSuccess(true)
    setTimeout(() => router.push('/supplier/products'), 800)
  }

  async function uploadDoc(file: File, folder: 'docs' | 'video', field: 'catalogueUrl' | 'videoUrl') {
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json().catch(() => ({}))
    if (res.ok && json.url) update(field, json.url)
    else setError(json.error ?? 'Upload failed')
  }

  function handlePendingFiles(fileList: FileList) {
    const allowed = Array.from(fileList).filter(f => f.type.startsWith('image/')).slice(0, 10)
    const previews = allowed.map(f => URL.createObjectURL(f))
    setPendingFiles(prev => [...prev, ...allowed].slice(0, 10))
    setPendingPreviews(prev => [...prev, ...previews].slice(0, 10))
    setPendingRoles(prev => [...prev, ...allowed.map(() => '')].slice(0, 10))
  }

  function removePending(index: number) {
    URL.revokeObjectURL(pendingPreviews[index])
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
    setPendingPreviews(prev => prev.filter((_, i) => i !== index))
    setPendingRoles(prev => prev.filter((_, i) => i !== index))
  }

  function setPendingRole(index: number, role: string) {
    setPendingRoles(prev => prev.map((r, i) => i === index ? role : r))
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
            <label className={labelCls}>Brand</label>
            <input className={inputCls} value={form.brandName} onChange={(e) => update('brandName', e.target.value)} placeholder="e.g. Samsung, JBL, OEM" />
            <p className="text-xs text-gray-400">Brand, OEM or private label — used for filtering &amp; future sponsored positions.</p>
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
            {form.productLine.trim() && (
              <label className="mt-1 flex items-start gap-2.5 rounded-xl border border-gray-200 bg-amber-50/50 px-3.5 py-2.5 cursor-pointer hover:border-[#F5A623] transition-colors">
                <input type="checkbox" checked={form.isFamilyCover} onChange={(e) => update('isFamilyCover', e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#F5A623]" />
                <span className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-bold text-[#0B1F4D]">⭐ Use this product&apos;s image as the family cover</span><br />
                  This product&apos;s main image and name will represent the whole &ldquo;{form.productLine.trim()}&rdquo; family card in the marketplace grid. Only one product per line can be the cover.
                </span>
              </label>
            )}
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
            <label className={labelCls}>Base wholesale price / piece (B2B) *</label>
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
            <p className="text-xs text-gray-400">The base used to <strong>auto-calculate</strong> box/pallet/truck (× pieces, minus any discount). You can still type an exact price per tier below to override it.</p>
          </div>
          {(() => {
            const wholesaleCents = retailCostBasisCents()
            const floor = minRetailCents(wholesaleCents, minMarginPct)
            const entered = Math.round((parseFloat(form.retailPriceDisplay) || 0) * 100)
            const effective = entered > 0 ? Math.max(entered, floor) : floor
            const productVat = form.vatRate ? parseFloat(form.vatRate) : vatPct
            const withVat = vatEnabled ? addVatCents(effective, productVat) : effective
            const below = entered > 0 && entered < floor
            const fmtCur = (c: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: form.currencyCode }).format(c / 100)
            return (
              <div className="space-y-1.5">
                <label className={labelCls}>End-user price (retail, per piece)</label>
                <input
                  className={`${inputCls} ${below ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                  type="number" step="0.01" min="0.01"
                  value={form.retailPriceDisplay}
                  onChange={(e) => update('retailPriceDisplay', e.target.value)}
                  placeholder={floor > 0 ? (floor / 100).toFixed(2) : '0.00'}
                />
                {wholesaleCents > 0 ? (
                  <div className="text-xs space-y-0.5">
                    <p className={below ? 'text-red-600 font-bold' : 'text-gray-500'}>
                      Minimum retail: <span className="font-bold">{fmtCur(floor)}</span> (box price/piece <span className="font-semibold">{fmtCur(wholesaleCents)}</span> + {minMarginPct}%)
                      {below && ' — your price is below this and will be rejected.'}
                    </p>
                    <p className="text-gray-400">
                      Shown to end user{vatEnabled ? <> incl. {productVat}% VAT: <span className="font-bold text-[#0B1F4D]">{fmtCur(withVat)}</span></> : <>: <span className="font-bold text-[#0B1F4D]">{fmtCur(effective)}</span></>}
                      {entered === 0 && ' (auto-calculated — leave blank to use the minimum)'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Enter the wholesale price first to see the minimum protected retail price.</p>
                )}
              </div>
            )
          })()}
          <div className="space-y-1.5">
            <label className={labelCls}>VAT Rate %</label>
            <input className={inputCls} type="number" step="0.01" min="0" max="100" value={form.vatRate} onChange={(e) => update('vatRate', e.target.value)} placeholder="e.g. 21" />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>
              Min Order Qty
              {form.marketplaceContext === 'retail' && <span className="text-gray-400 normal-case font-normal"> (online shop)</span>}
              {form.marketplaceContext === 'both'   && <span className="text-gray-400 normal-case font-normal"> (min pieces)</span>}
            </label>
            <input className={inputCls} type="number" min="1" value={form.minOrderQty} onChange={(e) => update('minOrderQty', e.target.value)} />
            <p className="text-xs text-gray-400">Smallest quantity a buyer can order. Set 1 for no minimum.</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Stock Qty</label>
            <input className={inputCls} type="number" min="0" value={form.stockQty} onChange={(e) => update('stockQty', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Weight (grams)</label>
            <input className={inputCls} type="number" min="1" value={form.weightGrams} onChange={(e) => update('weightGrams', e.target.value)} placeholder="Optional" />
          </div>

          {/* Fixed vs Negotiable pricing */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelCls}>Price type</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => update('priceNegotiable', false)}
                className={`rounded-xl border p-3 text-left transition-all ${!form.priceNegotiable ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.04] ring-1 ring-[#0B1F4D]' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="text-sm font-extrabold text-[#0B1F4D]">🔒 Fixed price</p>
                <p className="text-[11px] text-gray-400 leading-tight">Final price — buyers purchase at the listed price.</p>
              </button>
              <button type="button" onClick={() => update('priceNegotiable', true)}
                className={`rounded-xl border p-3 text-left transition-all ${form.priceNegotiable ? 'border-[#F5A623] bg-[#F5A623]/[0.06] ring-1 ring-[#F5A623]' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="text-sm font-extrabold text-[#0B1F4D]">💬 Negotiable</p>
                <p className="text-[11px] text-gray-400 leading-tight">Buyers can request a better price / make an offer.</p>
              </button>
            </div>
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
                <div key={i} className="space-y-1">
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
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
                  {/* Which shop gallery this photo belongs to */}
                  <select value={pendingRoles[i] ?? ''} onChange={(e) => setPendingRole(i, e.target.value)}
                    className="w-full text-[10px] font-bold rounded-md border border-gray-200 px-1 py-1 bg-white cursor-pointer">
                    <option value="">Both shops</option>
                    <option value="retail">Online only (bottle)</option>
                    <option value="b2b">B2B / bulk (box·pallet)</option>
                  </select>
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
          <p className="text-xs text-gray-400 mt-2">
            First image is the primary photo. Tag each one: <strong>Online only</strong> = the bottle (retail shop), <strong>B2B / bulk</strong> = box / pallet / truck photos, <strong>Both</strong> = shown everywhere. Per-unit prices (box / pallet / truck) are set in “Packaging &amp; wholesale units” below.
          </p>
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
        <p className="text-xs text-gray-400 mt-2 mb-3">
          One product, sold by piece / box / pallet / truck. Never put specs inside images.
        </p>
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 mb-4 text-xs text-blue-800 space-y-1">
          <p className="font-bold">Two ways to price the wholesale tiers — choose per tier:</p>
          <p>① <strong>Fixed base price</strong> — set the base wholesale price/piece above and leave the tier prices blank. Box/Pallet/Truck are <strong>calculated automatically</strong> (base × pieces).</p>
          <p>② <strong>Discount %</strong> — leave the price blank and set a % off the base (e.g. Box 10%, Pallet 20%, Truck 30%).</p>
          <p>③ <strong>Exact price</strong> — type a specific price for that tier to override the calculation.</p>
          <p className="text-blue-600">A single piece always uses the retail (end-user) price.</p>
        </div>

        {/* Sell-in toggles — locked units stay visible with an upgrade CTA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-2">
          {([
            ['sellPiece', 'Piece', 'piece'], ['sellBox', 'Box', 'box'],
            ['sellPallet', 'Pallet', 'pallet'], ['sellTruck', 'Truck', 'truck'],
          ] as const).map(([key, label, unit]) => {
            const unlocked = canSellUnit(sellerTier, unit as PurchaseUnit)
            if (!unlocked) {
              return (
                <a key={key} href="/pricing"
                  className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5 text-left hover:bg-amber-50 transition-colors">
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-700">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Sell by {label}
                  </span>
                  <span className="block text-[10px] font-semibold text-amber-600 mt-0.5">Upgrade to {requiredPlanLabel(unit as PurchaseUnit)} →</span>
                </a>
              )
            }
            return (
              <button key={key} type="button" onClick={() => update(key, !form[key])}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-all ${
                  form[key] ? 'border-[#0B1F4D] bg-[#0B1F4D] text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                Sell by {label}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Your plan ({SELL_PLAN_LABEL[sellerTier ?? 'free'] ?? 'Starter'}) unlocks the units above. Locked units stay visible — upgrade to enable them.
        </p>

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
          <div className="space-y-1.5"><label className={labelCls}>EXW price ({form.currencyCode})</label><input className={inputCls} type="number" step="0.01" value={form.exwPrice} onChange={(e) => update('exwPrice', e.target.value)} placeholder="Ex Works unit price" /></div>
          <div className="space-y-1.5"><label className={labelCls}>HS code</label><input className={inputCls} value={form.hsCode} onChange={(e) => update('hsCode', e.target.value)} placeholder="3402.20" /></div>
        </div>

        {/* Marketing material */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 mt-5">Marketing material</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelCls}>Product catalogue (PDF)</label>
            {form.catalogueUrl ? (
              <div className="flex items-center gap-2 text-xs">
                <a href={form.catalogueUrl} target="_blank" rel="noopener noreferrer" className="text-[#0B1F4D] font-bold underline truncate">View catalogue</a>
                <button type="button" onClick={() => update('catalogueUrl', '')} className="text-red-400 hover:text-red-600">remove</button>
              </div>
            ) : (
              <input className="text-xs" type="file" accept="application/pdf"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f, 'docs', 'catalogueUrl') }} />
            )}
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Product video</label>
            {form.videoUrl ? (
              <div className="flex items-center gap-2 text-xs">
                <a href={form.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[#0B1F4D] font-bold underline truncate">View video</a>
                <button type="button" onClick={() => update('videoUrl', '')} className="text-red-400 hover:text-red-600">remove</button>
              </div>
            ) : (
              <input className="text-xs" type="file" accept="video/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f, 'video', 'videoUrl') }} />
            )}
          </div>
        </div>

        {/* Box */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Box (carton)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="space-y-1.5"><label className={labelCls}>Units per box</label><input className={inputCls} type="number" min="1" value={form.unitsPerCarton} onChange={(e) => update('unitsPerCarton', e.target.value)} placeholder="4" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Box gross weight (kg)</label><input className={inputCls} type="number" step="0.01" value={form.cartonWeightKg} onChange={(e) => update('cartonWeightKg', e.target.value)} placeholder="22" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Box net weight (kg)</label><input className={inputCls} type="number" step="0.01" value={form.cartonNetWeightKg} onChange={(e) => update('cartonNetWeightKg', e.target.value)} placeholder="21" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Box dimensions</label><input className={inputCls} value={form.cartonDimensions} onChange={(e) => update('cartonDimensions', e.target.value)} placeholder="40 x 28 x 29 cm" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Price per box ({form.currencyCode})</label>{canSellUnit(sellerTier, 'box')
            ? <input className={inputCls} type="number" step="0.01" value={form.pricePerBox} onChange={(e) => update('pricePerBox', e.target.value)} placeholder="auto" />
            : <a href="/pricing" className="flex items-center gap-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50">🔒 Upgrade to {requiredPlanLabel('box')} →</a>}
          </div>
          <div className="space-y-1.5"><label className={labelCls}>Min boxes / order</label><input className={inputCls} type="number" min="1" value={form.minBoxQty} onChange={(e) => update('minBoxQty', e.target.value)} placeholder="1" /></div>
          <div className="space-y-1.5"><label className={labelCls}>…or discount %</label><input className={inputCls} type="number" min="0" max="100" step="0.5" value={form.boxDiscountPct} onChange={(e) => update('boxDiscountPct', e.target.value)} placeholder="e.g. 10" disabled={!!form.pricePerBox} /></div>
        </div>

        {/* Pallet */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Pallet</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="space-y-1.5"><label className={labelCls}>Boxes per pallet</label><input className={inputCls} type="number" min="1" value={form.cartonsPerPallet} onChange={(e) => update('cartonsPerPallet', e.target.value)} placeholder="105" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Pallet weight (kg)</label><input className={inputCls} type="number" step="0.01" value={form.palletWeightKg} onChange={(e) => update('palletWeightKg', e.target.value)} placeholder="1050" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Pallet height (cm)</label><input className={inputCls} type="number" min="1" value={form.palletHeightCm} onChange={(e) => update('palletHeightCm', e.target.value)} placeholder="160" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Pallet dimensions</label><input className={inputCls} value={form.palletDimensions} onChange={(e) => update('palletDimensions', e.target.value)} placeholder="120 x 100 x 160 cm" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Price per pallet ({form.currencyCode})</label>{canSellUnit(sellerTier, 'pallet')
            ? <input className={inputCls} type="number" step="0.01" value={form.pricePerPallet} onChange={(e) => update('pricePerPallet', e.target.value)} placeholder="auto" />
            : <a href="/pricing" className="flex items-center gap-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50">🔒 Upgrade to {requiredPlanLabel('pallet')} →</a>}
          </div>
          <div className="space-y-1.5"><label className={labelCls}>Min pallets / order</label><input className={inputCls} type="number" min="1" value={form.minPalletQty} onChange={(e) => update('minPalletQty', e.target.value)} placeholder="1" /></div>
          <div className="space-y-1.5"><label className={labelCls}>…or discount %</label><input className={inputCls} type="number" min="0" max="100" step="0.5" value={form.palletDiscountPct} onChange={(e) => update('palletDiscountPct', e.target.value)} placeholder="e.g. 20" disabled={!!form.pricePerPallet} /></div>
        </div>

        {/* Truck */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Truck (full load)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5"><label className={labelCls}>Pallets per truck</label><input className={inputCls} type="number" min="1" value={form.palletsPerTruck} onChange={(e) => update('palletsPerTruck', e.target.value)} placeholder="33" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Truck capacity</label><input className={inputCls} value={form.truckCapacity} onChange={(e) => update('truckCapacity', e.target.value)} placeholder="13.6 m / 33 pallets" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Price per truck ({form.currencyCode})</label>{canSellUnit(sellerTier, 'truck')
            ? <input className={inputCls} type="number" step="0.01" value={form.pricePerTruck} onChange={(e) => update('pricePerTruck', e.target.value)} placeholder="auto" />
            : <a href="/pricing" className="flex items-center gap-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50">🔒 Upgrade to {requiredPlanLabel('truck')} →</a>}
          </div>
          <div className="space-y-1.5"><label className={labelCls}>Min trucks / order</label><input className={inputCls} type="number" min="1" value={form.minTruckQty} onChange={(e) => update('minTruckQty', e.target.value)} placeholder="1" /></div>
          <div className="space-y-1.5"><label className={labelCls}>…or discount %</label><input className={inputCls} type="number" min="0" max="100" step="0.5" value={form.truckDiscountPct} onChange={(e) => update('truckDiscountPct', e.target.value)} placeholder="e.g. 30" disabled={!!form.pricePerTruck} /></div>
        </div>
        <p className="text-xs text-gray-400 mt-3">For each volume tier: type an exact price, <strong>or</strong> leave it blank and set a discount % off the base wholesale price. Single pieces always use the retail price.</p>
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
