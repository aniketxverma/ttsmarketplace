import Link from 'next/link'
import Image from 'next/image'
import { Store, MapPin, ShieldCheck, Package, FileSpreadsheet, FileText, PlayCircle, ArrowLeft } from 'lucide-react'

export type ShopSupplier = {
  id: string
  trade_name?: string | null
  legal_name?: string | null
  logo_url?: string | null
  brand_slug?: string | null
  tagline?: string | null
  description?: string | null
  reliability_tier?: string | null
  whatsapp?: string | null
  min_order_value_cents?: number | null
  catalogue_url?: string | null
  video_url?: string | null
  countries?: { name?: string | null; iso_code?: string | null } | null
  cities?: { name?: string | null } | null
}

function isoFlag(iso?: string | null) {
  return iso && iso.length === 2 ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : '🌍'
}
function money(cents: number) {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100)
}

// The Supplier Shop header — the buyer has been guided to ONE supplier and is
// encouraged to browse and order their whole catalogue here.
export function SupplierShopHeader({ s, productCount }: { s: ShopSupplier; productCount: number }) {
  const name = s.trade_name ?? s.legal_name ?? 'Supplier'
  const city = s.cities?.name ?? null
  const country = s.countries?.name ?? null
  const wa = s.whatsapp
    ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${name}, I'd like to order from your catalogue on TTAI EMA.`)}`
    : null

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      {/* Banner */}
      <div className="relative bg-gradient-to-br from-[#0B1F4D] via-[#1a3a7a] to-[#0d3060] px-5 sm:px-8 py-7">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-bold mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> All suppliers
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl border-2 border-white/30 overflow-hidden bg-white shadow-xl flex-shrink-0">
            {s.logo_url ? (
              <Image src={s.logo_url} alt={name} width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#0B1F4D]"><Store className="w-9 h-9 text-white/60" /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-widest">Official Supplier Shop</span>
              {s.reliability_tier && s.reliability_tier !== 'UNVERIFIED' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-300"><ShieldCheck className="w-3 h-3" /> Verified</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{name}</h1>
            {(s.tagline || s.description) && (
              <p className="text-white/65 text-sm mt-1 line-clamp-1">{s.tagline ?? s.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-white/70 font-semibold">
              {(country || city) && (
                <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{isoFlag(s.countries?.iso_code)} {[country, city].filter(Boolean).join(' · ')}</span>
              )}
              <span className="inline-flex items-center gap-1"><Package className="w-3.5 h-3.5" />{productCount} products</span>
              {s.min_order_value_cents ? <span>Min. order {money(s.min_order_value_cents)}</span> : null}
            </div>
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-400 text-white px-5 py-3 text-sm font-extrabold shadow-lg transition-colors">
              Order from {name}
            </a>
          )}
        </div>
      </div>

      {/* Action bar — catalogue downloads + brand link */}
      <div className="flex flex-wrap items-center gap-2 bg-white px-5 sm:px-8 py-3 border-t border-gray-100">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-1">Catalogue:</span>
        {s.catalogue_url && (
          <a href={s.catalogue_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-[#0B1F4D] hover:border-[#0B1F4D] transition-colors">
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel / PDF
          </a>
        )}
        {s.video_url && (
          <a href={s.video_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-[#0B1F4D] hover:border-[#0B1F4D] transition-colors">
            <PlayCircle className="w-4 h-4 text-red-500" /> Video
          </a>
        )}
        {s.brand_slug && (
          <Link href={`/brand/${s.brand_slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-[#0B1F4D] hover:border-[#0B1F4D] transition-colors">
            <FileText className="w-4 h-4 text-[#0B1F4D]" /> Company profile
          </Link>
        )}
        {!s.catalogue_url && !s.video_url && (
          <span className="text-xs text-gray-400">Browse the full catalogue below — order everything from {name} in one place.</span>
        )}
      </div>
    </div>
  )
}
