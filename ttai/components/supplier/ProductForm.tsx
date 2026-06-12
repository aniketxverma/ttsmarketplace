'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { canSellUnit, requiredPlanLabel, SELL_PLAN_LABEL } from '@/lib/selling'
import { tierRank } from '@/lib/business-chain'
import type { PurchaseUnit } from '@/lib/packaging'
import { minRetailCents, addVatCents } from '@/lib/pricing-rules'
import { CONDITIONS } from '@/lib/conditions'
import { useT } from '@/lib/i18n/client'

type TemplateField = { key: string; label: string; type?: 'text' | 'number' | 'select'; options?: string[] }

/** Inline preview for a product video — supports YouTube, Vimeo and direct files. */
function VideoPreview({ url }: { url: string }) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return <iframe className="w-full aspect-video rounded-xl border border-gray-200" src={`https://www.youtube.com/embed/${yt[1]}`} allowFullScreen title="Product video" />
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return <iframe className="w-full aspect-video rounded-xl border border-gray-200" src={`https://player.vimeo.com/video/${vimeo[1]}`} allowFullScreen title="Product video" />
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return <video src={url} controls className="w-full aspect-video rounded-xl border border-gray-200 bg-black" />
  return <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#0B1F4D] underline">Open video link ↗</a>
}

interface ProductFormProps {
  supplierId: string
  mode: 'create' | 'edit'
  productId?: string
  initialData?: Partial<FormState>
  initialSpecs?: Record<string, any>
  /** Seller's plan tier — gates which units they can sell by. */
  sellerTier?: string
  /** Seller's chosen free shop channel (from their Shop Type setting). */
  homeChannel?: 'wholesale' | 'retail'
  /** Marketplace pricing rules (admin-configured). */
  minMarginPct?: number
  vatPct?: number
  vatEnabled?: boolean
}

interface FormState {
  name: string; slug: string; categoryId: string; mainCategoryId: string; familyName: string; marketplaceContext: 'wholesale' | 'retail' | 'both'
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
  priceNegotiable: boolean; priceOnRequest: boolean
  condition: string; warranty: string; warehouseLocation: string; deliveryDays: string; shipping: string
  retailAvailable: boolean; deliveryScope: string
  isPublished: boolean
}

const INITIAL: FormState = {
  name: '', slug: '', categoryId: '', mainCategoryId: '', familyName: '', marketplaceContext: 'wholesale',
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
  priceNegotiable: false, priceOnRequest: false,
  condition: '', warranty: '', warehouseLocation: '', deliveryDays: '', shipping: '',
  retailAvailable: true, deliveryScope: 'city',
  isPublished: false,
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'AED', 'SAR', 'MAD']

export function ProductForm({
  supplierId, mode, productId, initialData, initialSpecs, sellerTier, homeChannel,
  minMarginPct = 30, vatPct = 21, vatEnabled = true,
}: ProductFormProps) {
  const router = useRouter()
  const t = useT()

  // Free sales channel: your chosen home channel is free; the other channel (or
  // both) needs a paid plan. Home channel comes from the supplier's Shop Type.
  const paidChannels = tierRank(sellerTier) >= 1
  const freeChannel = homeChannel === 'retail' ? 'retail' : 'wholesale'    // 'wholesale' | 'retail'
  const lockedChannel = freeChannel === 'wholesale' ? 'retail' : 'wholesale'

  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    // Default a free seller's product to their free channel.
    marketplaceContext: paidChannels ? INITIAL.marketplaceContext : freeChannel,
    ...initialData,
  })
  const [specs, setSpecs] = useState<Record<string, string>>(() => (initialSpecs ?? {}) as Record<string, string>)
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; parent_id: string | null; template_fields?: TemplateField[] }[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [videoBusy, setVideoBusy] = useState(false)
  // create-mode only: stage images before product exists
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([])
  const [pendingRoles, setPendingRoles] = useState<string[]>([])  // '' both | 'retail' | 'b2b'
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('categories').select('id, name, slug, parent_id, template_fields').order('name').then(({ data }) => setCategories((data as any) ?? []))
    supabase.from('cities').select('id, name').eq('retail_active', true).order('name').then(({ data }) => setCities(data ?? []))
  }, [])

  // Edit mode: split the stored category into Main Category + Family for the UI.
  useEffect(() => {
    if (!categories.length || !form.categoryId || form.mainCategoryId) return
    const cat = categories.find((c) => c.id === form.categoryId)
    if (!cat) return
    if (cat.parent_id) setForm((f) => ({ ...f, mainCategoryId: cat.parent_id as string, familyName: cat.name }))
    else setForm((f) => ({ ...f, mainCategoryId: cat.id }))
  }, [categories, form.categoryId, form.mainCategoryId])

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
    if (!form.mainCategoryId) { setError('Main category is required'); setLoading(false); return }
    if (!form.slug.trim()) { setError('Slug is required'); setLoading(false); return }

    // Resolve Main Category + Family → the product's category_id. A typed family
    // is created (or reused) under the main category via the server endpoint.
    let resolvedCategoryId = form.mainCategoryId
    if (form.familyName.trim()) {
      const existing = categories.find((c) => c.parent_id === form.mainCategoryId && c.name.toLowerCase() === form.familyName.trim().toLowerCase())
      if (existing) {
        resolvedCategoryId = existing.id
      } else {
        try {
          const res = await fetch('/api/supplier/family', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rootId: form.mainCategoryId, name: form.familyName.trim() }),
          })
          const json = await res.json()
          if (res.ok && json.category?.id) resolvedCategoryId = json.category.id
          else { setError(json.error || 'Could not create family'); setLoading(false); return }
        } catch { setError('Could not create family'); setLoading(false); return }
      }
    }

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
      category_id:         resolvedCategoryId,
      // Enforce the free-channel rule even if the field was tampered with.
      marketplace_context: !paidChannels && form.marketplaceContext !== freeChannel ? freeChannel : form.marketplaceContext,
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
      price_on_request:    form.priceOnRequest,
      condition:           form.condition || null,
      warranty:            form.warranty.trim() || null,
      warehouse_location:  form.warehouseLocation.trim() || null,
      delivery_days:       form.deliveryDays ? parseInt(form.deliveryDays) : null,
      shipping_cents:      form.shipping && parseFloat(form.shipping) >= 0 && form.shipping !== '' ? Math.round(parseFloat(form.shipping) * 100) : null,
      // Retail Shop local availability (Phase 6)
      retail_available:    form.retailAvailable,
      delivery_scope:      form.deliveryScope || 'city',
      specs:               specs,
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
      'brand_name', 'source_type', 'original_supplier_id', 'current_owner_id', 'created_by', 'price_on_request', 'specs',
      'condition', 'warranty', 'warehouse_location', 'delivery_days', 'shipping_cents',
      'retail_available', 'delivery_scope']
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
      // Index in the global master catalog (best effort).
      fetch('/api/supplier/master', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'link', productId: newProduct.id }) }).catch(() => {})

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

  async function handleVideoFile(f: File) {
    setVideoBusy(true)
    await uploadDoc(f, 'video', 'videoUrl')
    setVideoBusy(false)
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
        <p className="font-bold text-gray-900">{t('pform.saved')}</p>
        <p className="text-sm text-gray-500 mt-1">{t('pform.redirecting')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Basic Info */}
      <div>
        <h3 className="font-bold text-[#0B1F4D] text-sm mb-4 pb-2 border-b">{t('pform.basic_info')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelCls}>{t('pform.product_name')} *</label>
            <input className={inputCls} value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="e.g. Organic Extra Virgin Olive Oil 5L" />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.url_slug')} *</label>
            <input className={inputCls} value={form.slug} onChange={(e) => update('slug', e.target.value)} required pattern="[a-z0-9-]+" placeholder="auto-generated-from-name" />
            <p className="text-xs text-gray-400">{t('pform.slug_hint')}</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.sku')}</label>
            <input className={inputCls} value={form.sku} onChange={(e) => update('sku', e.target.value)} placeholder="e.g. EVOO-001" />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.brand')}</label>
            <input className={inputCls} value={form.brandName} onChange={(e) => update('brandName', e.target.value)} placeholder="e.g. Samsung, JBL, OEM" />
            <p className="text-xs text-gray-400">Brand, OEM or private label — used for filtering &amp; future sponsored positions.</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Main Category *</label>
            <select className={inputCls} value={form.mainCategoryId}
              onChange={(e) => { update('mainCategoryId', e.target.value); update('familyName', '') }} required>
              <option value="">{t('pform.select_category')}</option>
              {categories.filter((c) => !c.parent_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Family / Product Type</label>
            <input className={inputCls} list="family-options" value={form.familyName}
              onChange={(e) => update('familyName', e.target.value)}
              placeholder={form.mainCategoryId ? 'e.g. Juices — pick or type a new one' : 'Choose a main category first'}
              disabled={!form.mainCategoryId} />
            <datalist id="family-options">
              {categories.filter((c) => c.parent_id === form.mainCategoryId).map((c) => <option key={c.id} value={c.name} />)}
            </datalist>
            <p className="text-xs text-gray-400">Pick an existing family or type a new one — it’s created automatically and appears in your shop under the main category.</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelCls}>{t('pform.product_line')}</label>
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
            <label className={labelCls}>{t('pform.sell_shop')}</label>
            <select className={inputCls} value={form.marketplaceContext}
              onChange={(e) => {
                const v = e.target.value as FormState['marketplaceContext']
                // Block the locked channel / both for free sellers.
                if (!paidChannels && v !== freeChannel) return
                update('marketplaceContext', v)
              }}>
              <option value="wholesale" disabled={!paidChannels && lockedChannel === 'wholesale'}>
                {t('pform.shop_b2b')}{!paidChannels && lockedChannel === 'wholesale' ? ' 🔒' : ''}
              </option>
              <option value="retail" disabled={!paidChannels && lockedChannel === 'retail'}>
                {t('pform.shop_retail')}{!paidChannels && lockedChannel === 'retail' ? ' 🔒' : ''}
              </option>
              <option value="both" disabled={!paidChannels}>
                {t('pform.shop_both')}{!paidChannels ? ' 🔒' : ''}
              </option>
            </select>
            {paidChannels ? (
              <p className="text-[11px] text-gray-400">Controls where this product appears: your B2B (wholesale) shop, your Online (retail) shop, or both.</p>
            ) : (
              <p className="text-[11px] text-amber-600">
                Your plan sells on the <strong>{freeChannel === 'wholesale' ? 'B2B (wholesale)' : 'Online (retail)'}</strong> shop for free.{' '}
                <a href="/pricing" className="font-bold underline">Upgrade</a> to also sell on the {freeChannel === 'wholesale' ? 'Online (retail)' : 'B2B (wholesale)'} shop.
              </p>
            )}
          </div>
          {needsCity && (
            <div className="space-y-1.5">
              <label className={labelCls}>{t('pform.city')} *</label>
              <select className={inputCls} value={form.cityId} onChange={(e) => update('cityId', e.target.value)} required>
                <option value="">{t('pform.select_city')}</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelCls}>{t('pform.description')}</label>
            <textarea className={`${inputCls} h-28 resize-none`} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe your product — specifications, certifications, packaging..." />
          </div>
        </div>
      </div>

      {/* Product Video — paste a link OR upload a file */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <h3 className="font-bold text-[#0B1F4D] text-sm mb-1 pb-2 border-b">{t('pform.product_video')} <span className="text-gray-400 font-normal">({t('pform.optional')})</span></h3>
        <p className="text-xs text-gray-400 mb-3">Paste a YouTube, Vimeo or MP4 link — or upload a video file (up to 100 MB).</p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.video_link')}</label>
            <input className={inputCls} value={form.videoUrl} onChange={(e) => update('videoUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=…  or  https://…/clip.mp4" />
          </div>
          <label className={`flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors ${videoBusy ? 'border-gray-200 text-gray-400' : 'border-gray-300 text-[#0B1F4D] hover:border-[#0B1F4D]'}`}>
            {videoBusy ? 'Uploading…' : '⬆ Upload file'}
            <input type="file" accept="video/*" className="hidden" disabled={videoBusy}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFile(f) }} />
          </label>
        </div>
        {form.videoUrl && (
          <div className="mt-3 max-w-md">
            <VideoPreview url={form.videoUrl} />
            <button type="button" onClick={() => update('videoUrl', '')} className="mt-1.5 text-xs text-red-400 hover:text-red-600">{t('pform.remove_video')}</button>
          </div>
        )}
      </div>

      {/* Specifications — dynamic fields from the category template */}
      {(() => {
        const tmplCatId = (form.familyName.trim() && categories.find((c) => c.parent_id === form.mainCategoryId && c.name.toLowerCase() === form.familyName.trim().toLowerCase())?.id) || form.mainCategoryId
        const template = (categories.find((c) => c.id === tmplCatId)?.template_fields ?? []) as TemplateField[]
        if (!template.length) return null
        return (
          <div>
            <h3 className="font-bold text-[#0B1F4D] text-sm mb-1 pb-2 border-b">{t('pform.specifications')}</h3>
            <p className="text-xs text-gray-400 mt-2 mb-4">Standard fields for this category — they become part of the master product so everyone reuses the same specs.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {template.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className={labelCls}>{f.label}</label>
                  {f.type === 'select' && f.options ? (
                    <select className={inputCls} value={specs[f.key] ?? ''} onChange={(e) => setSpecs((s) => ({ ...s, [f.key]: e.target.value }))}>
                      <option value="">—</option>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className={inputCls} type={f.type === 'number' ? 'number' : 'text'} value={specs[f.key] ?? ''}
                      onChange={(e) => setSpecs((s) => ({ ...s, [f.key]: e.target.value }))} placeholder={f.label} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Pricing */}
      <div>
        <h3 className="font-bold text-[#0B1F4D] text-sm mb-4 pb-2 border-b">{t('pform.pricing_inventory')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.base_price')} *</label>
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
                <label className={labelCls}>{t('pform.retail_price')}</label>
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
            <label className={labelCls}>{t('pform.vat_rate')}</label>
            <input className={inputCls} type="number" step="0.01" min="0" max="100" value={form.vatRate} onChange={(e) => update('vatRate', e.target.value)} placeholder="e.g. 21" />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>
              {t('pform.min_order_qty')}
              {form.marketplaceContext === 'retail' && <span className="text-gray-400 normal-case font-normal"> (online shop)</span>}
              {form.marketplaceContext === 'both'   && <span className="text-gray-400 normal-case font-normal"> (min pieces)</span>}
            </label>
            <input className={inputCls} type="number" min="1" value={form.minOrderQty} onChange={(e) => update('minOrderQty', e.target.value)} />
            <p className="text-xs text-gray-400">Smallest quantity a buyer can order. Set 1 for no minimum.</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.stock_qty')}</label>
            <input className={inputCls} type="number" min="0" value={form.stockQty} onChange={(e) => update('stockQty', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.weight_g')}</label>
            <input className={inputCls} type="number" min="1" value={form.weightGrams} onChange={(e) => update('weightGrams', e.target.value)} placeholder={t('pform.optional')} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.condition')}</label>
            <select className={inputCls} value={form.condition} onChange={(e) => update('condition', e.target.value)}>
              <option value="">—</option>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.warranty')}</label>
            <input className={inputCls} value={form.warranty} onChange={(e) => update('warranty', e.target.value)} placeholder="e.g. 12 months" />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.warehouse')}</label>
            <input className={inputCls} value={form.warehouseLocation} onChange={(e) => update('warehouseLocation', e.target.value)} placeholder="e.g. Madrid · Aisle 4" />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.delivery_days')}</label>
            <input className={inputCls} type="number" min="0" value={form.deliveryDays} onChange={(e) => update('deliveryDays', e.target.value)} placeholder="e.g. 3" />
            <p className="text-xs text-gray-400">Used to rank your offer (fastest delivery wins ties).</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.shipping_cost')} (€)</label>
            <input className={inputCls} type="number" step="0.01" min="0" value={form.shipping} onChange={(e) => update('shipping', e.target.value)} placeholder="0 = free" />
            <p className="text-xs text-gray-400">Shown as Product + Shipping = Total in the seller comparison.</p>
          </div>

          {/* Price type: Fixed / Negotiable / On request */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelCls}>{t('pform.price_type')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button type="button" onClick={() => { update('priceNegotiable', false); update('priceOnRequest', false) }}
                className={`rounded-xl border p-3 text-left transition-all ${!form.priceNegotiable && !form.priceOnRequest ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.04] ring-1 ring-[#0B1F4D]' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="text-sm font-extrabold text-[#0B1F4D]">🔒 {t('pform.price_fixed')}</p>
                <p className="text-[11px] text-gray-400 leading-tight">Final price — buyers purchase at the listed price.</p>
              </button>
              <button type="button" onClick={() => { update('priceNegotiable', true); update('priceOnRequest', false) }}
                className={`rounded-xl border p-3 text-left transition-all ${form.priceNegotiable && !form.priceOnRequest ? 'border-[#F5A623] bg-[#F5A623]/[0.06] ring-1 ring-[#F5A623]' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="text-sm font-extrabold text-[#0B1F4D]">💬 {t('pform.price_negotiable')}</p>
                <p className="text-[11px] text-gray-400 leading-tight">Shows a price — buyers can make an offer.</p>
              </button>
              <button type="button" onClick={() => { update('priceOnRequest', true); update('priceNegotiable', false) }}
                className={`rounded-xl border p-3 text-left transition-all ${form.priceOnRequest ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="text-sm font-extrabold text-[#0B1F4D]">🙈 {t('pform.price_request')}</p>
                <p className="text-[11px] text-gray-400 leading-tight">No public price (B2B) — buyers request a quote.</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Images — create mode only (edit mode uses ProductImageManager on the page) */}
      {mode === 'create' && (
        <div>
          <h3 className="font-bold text-[#0B1F4D] text-sm mb-4 pb-2 border-b">{t('pform.product_images')}</h3>
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
                <p className="font-bold text-sm">{t('pform.add_images')}</p>
                <p className="text-xs mt-0.5">{t('pform.images_hint')}</p>
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
        <h3 className="font-bold text-[#0B1F4D] text-sm mb-1 pb-2 border-b">{t('pform.packaging_units')}</h3>
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
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('pform.unit_piece')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.net_content')}</label><input className={inputCls} value={form.netContent} onChange={(e) => update('netContent', e.target.value)} placeholder="5 L" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.unit_weight')}</label><input className={inputCls} type="number" step="0.01" value={form.unitWeightKg} onChange={(e) => update('unitWeightKg', e.target.value)} placeholder="5.25" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.unit_dims')}</label><input className={inputCls} value={form.unitDimensions} onChange={(e) => update('unitDimensions', e.target.value)} placeholder="18.5 x 11.5 x 29.5 cm" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.ean')}</label><input className={inputCls} value={form.ean} onChange={(e) => update('ean', e.target.value)} placeholder="8421234567890" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.model')}</label><input className={inputCls} value={form.modelName} onChange={(e) => update('modelName', e.target.value)} placeholder="Rozil Max Power" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.reference')}</label><input className={inputCls} value={form.referenceNumber} onChange={(e) => update('referenceNumber', e.target.value)} placeholder="REF-001" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.country_origin')}</label><input className={inputCls} value={form.countryOfOrigin} onChange={(e) => update('countryOfOrigin', e.target.value)} placeholder="Spain" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.lead_time')}</label><input className={inputCls} value={form.leadTime} onChange={(e) => update('leadTime', e.target.value)} placeholder="7–14 days" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.exw_price')} ({form.currencyCode})</label><input className={inputCls} type="number" step="0.01" value={form.exwPrice} onChange={(e) => update('exwPrice', e.target.value)} placeholder="Ex Works unit price" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.hs_code')}</label><input className={inputCls} value={form.hsCode} onChange={(e) => update('hsCode', e.target.value)} placeholder="3402.20" /></div>
        </div>

        {/* Marketing material */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 mt-5">{t('pform.marketing_material')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.catalogue_pdf')}</label>
            {form.catalogueUrl ? (
              <div className="flex items-center gap-2 text-xs">
                <a href={form.catalogueUrl} target="_blank" rel="noopener noreferrer" className="text-[#0B1F4D] font-bold underline truncate">{t('pform.view_catalogue')}</a>
                <button type="button" onClick={() => update('catalogueUrl', '')} className="text-red-400 hover:text-red-600">remove</button>
              </div>
            ) : (
              <input className="text-xs" type="file" accept="application/pdf"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f, 'docs', 'catalogueUrl') }} />
            )}
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('pform.product_video')}</label>
            <p className="text-xs text-gray-400">Set above in the <span className="font-semibold text-gray-500">Product Video</span> section.</p>
          </div>
        </div>

        {/* Box */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('pform.box_carton')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.units_per_box')}</label><input className={inputCls} type="number" min="1" value={form.unitsPerCarton} onChange={(e) => update('unitsPerCarton', e.target.value)} placeholder="4" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.box_gross_w')}</label><input className={inputCls} type="number" step="0.01" value={form.cartonWeightKg} onChange={(e) => update('cartonWeightKg', e.target.value)} placeholder="22" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.box_net_w')}</label><input className={inputCls} type="number" step="0.01" value={form.cartonNetWeightKg} onChange={(e) => update('cartonNetWeightKg', e.target.value)} placeholder="21" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.box_dims')}</label><input className={inputCls} value={form.cartonDimensions} onChange={(e) => update('cartonDimensions', e.target.value)} placeholder="40 x 28 x 29 cm" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Price per box ({form.currencyCode})</label>{canSellUnit(sellerTier, 'box')
            ? <input className={inputCls} type="number" step="0.01" value={form.pricePerBox} onChange={(e) => update('pricePerBox', e.target.value)} placeholder="auto" />
            : <a href="/pricing" className="flex items-center gap-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50">🔒 Upgrade to {requiredPlanLabel('box')} →</a>}
          </div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.min_boxes')}</label><input className={inputCls} type="number" min="1" value={form.minBoxQty} onChange={(e) => update('minBoxQty', e.target.value)} placeholder="1" /></div>
          <div className="space-y-1.5"><label className={labelCls}>…or discount %</label><input className={inputCls} type="number" min="0" max="100" step="0.5" value={form.boxDiscountPct} onChange={(e) => update('boxDiscountPct', e.target.value)} placeholder="e.g. 10" disabled={!!form.pricePerBox} /></div>
        </div>

        {/* Pallet */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('pform.pallet')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.boxes_per_pallet')}</label><input className={inputCls} type="number" min="1" value={form.cartonsPerPallet} onChange={(e) => update('cartonsPerPallet', e.target.value)} placeholder="105" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.pallet_weight')}</label><input className={inputCls} type="number" step="0.01" value={form.palletWeightKg} onChange={(e) => update('palletWeightKg', e.target.value)} placeholder="1050" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.pallet_height')}</label><input className={inputCls} type="number" min="1" value={form.palletHeightCm} onChange={(e) => update('palletHeightCm', e.target.value)} placeholder="160" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.pallet_dims')}</label><input className={inputCls} value={form.palletDimensions} onChange={(e) => update('palletDimensions', e.target.value)} placeholder="120 x 100 x 160 cm" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Price per pallet ({form.currencyCode})</label>{canSellUnit(sellerTier, 'pallet')
            ? <input className={inputCls} type="number" step="0.01" value={form.pricePerPallet} onChange={(e) => update('pricePerPallet', e.target.value)} placeholder="auto" />
            : <a href="/pricing" className="flex items-center gap-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50">🔒 Upgrade to {requiredPlanLabel('pallet')} →</a>}
          </div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.min_pallets')}</label><input className={inputCls} type="number" min="1" value={form.minPalletQty} onChange={(e) => update('minPalletQty', e.target.value)} placeholder="1" /></div>
          <div className="space-y-1.5"><label className={labelCls}>…or discount %</label><input className={inputCls} type="number" min="0" max="100" step="0.5" value={form.palletDiscountPct} onChange={(e) => update('palletDiscountPct', e.target.value)} placeholder="e.g. 20" disabled={!!form.pricePerPallet} /></div>
        </div>

        {/* Truck */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('pform.truck_full')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.pallets_per_truck')}</label><input className={inputCls} type="number" min="1" value={form.palletsPerTruck} onChange={(e) => update('palletsPerTruck', e.target.value)} placeholder="33" /></div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.truck_capacity')}</label><input className={inputCls} value={form.truckCapacity} onChange={(e) => update('truckCapacity', e.target.value)} placeholder="13.6 m / 33 pallets" /></div>
          <div className="space-y-1.5"><label className={labelCls}>Price per truck ({form.currencyCode})</label>{canSellUnit(sellerTier, 'truck')
            ? <input className={inputCls} type="number" step="0.01" value={form.pricePerTruck} onChange={(e) => update('pricePerTruck', e.target.value)} placeholder="auto" />
            : <a href="/pricing" className="flex items-center gap-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50">🔒 Upgrade to {requiredPlanLabel('truck')} →</a>}
          </div>
          <div className="space-y-1.5"><label className={labelCls}>{t('pform.min_trucks')}</label><input className={inputCls} type="number" min="1" value={form.minTruckQty} onChange={(e) => update('minTruckQty', e.target.value)} placeholder="1" /></div>
          <div className="space-y-1.5"><label className={labelCls}>…or discount %</label><input className={inputCls} type="number" min="0" max="100" step="0.5" value={form.truckDiscountPct} onChange={(e) => update('truckDiscountPct', e.target.value)} placeholder="e.g. 30" disabled={!!form.pricePerTruck} /></div>
        </div>
        <p className="text-xs text-gray-400 mt-3">For each volume tier: type an exact price, <strong>or</strong> leave it blank and set a discount % off the base wholesale price. Single pieces always use the retail price.</p>
      </div>

      {/* Retail Shop — local availability & delivery reach */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm text-gray-900">Available in the local Retail Shop</p>
            <p className="text-xs text-gray-500 mt-0.5">Show this product to nearby buyers in your area.</p>
          </div>
          <button type="button" onClick={() => update('retailAvailable', !form.retailAvailable)}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.retailAvailable ? 'bg-purple-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.retailAvailable ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        {form.retailAvailable && (
          <div className="space-y-1.5 max-w-xs">
            <label className={labelCls}>Delivery reach</label>
            <select className={inputCls} value={form.deliveryScope} onChange={(e) => update('deliveryScope', e.target.value)}>
              <option value="neighborhood">Neighborhood only</option>
              <option value="town">Town</option>
              <option value="city">City</option>
              <option value="province">Province</option>
              <option value="country">Whole country</option>
            </select>
            <p className="text-xs text-gray-400">How far you deliver this product from your location.</p>
          </div>
        )}
      </div>

      {/* Publish toggle */}
      <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm text-gray-900">
            {form.isPublished ? t('pform.published_label') : t('pform.draft_label')}
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
              {t('pform.saving')}
            </>
          ) : (
            mode === 'create' ? t('pform.create_product') : t('pform.save_changes')
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border-2 border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {t('pform.cancel')}
        </button>
      </div>
    </form>
  )
}
