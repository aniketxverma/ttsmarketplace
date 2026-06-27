import { notFound } from 'next/navigation'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

const POS_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  shop:         { label: 'Retail Shop',    color: 'bg-blue-100 text-blue-700' },
  warehouse:    { label: 'Warehouse',      color: 'bg-gray-100 text-gray-700' },
  distributor:  { label: 'Distributor',    color: 'bg-amber-100 text-amber-700' },
  pickup_point: { label: 'Pickup Point',   color: 'bg-green-100 text-green-700' },
  franchise:    { label: 'Franchise',      color: 'bg-purple-100 text-purple-700' },
  client_store: { label: 'Client Store',   color: 'bg-pink-100 text-pink-700' },
  agent_office: { label: 'Agent Office',   color: 'bg-indigo-100 text-indigo-700' },
  export_hub:   { label: 'Export Hub',     color: 'bg-teal-100 text-teal-700' },
}

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS: Record<string, string> = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday' }

function isOpenNow(hours: Record<string, any> | null): boolean {
  if (!hours) return false
  const now = new Date()
  const day = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1]
  const h = hours[day]
  if (!h || h.closed) return false
  const cur = now.getHours() * 60 + now.getMinutes()
  const [oh, om] = (h.open || '00:00').split(':').map(Number)
  const [ch, cm] = (h.close || '00:00').split(':').map(Number)
  return cur >= oh * 60 + om && cur <= ch * 60 + cm
}

export default async function PosPage({ params }: { params: { slug: string; posId: string } }) {
  
  const tt = await localizeUI(["Back to", "Contact", "Manager", "Opening Hours", "No hours listed", "Services", "Location", "Open in Google Maps"], getLocale())
  const supabase = createClient()

  const { data: supplier } = await (supabase.from('suppliers') as any)
    .select('id, trade_name, brand_slug, logo_url')
    .eq('brand_slug', params.slug)
    .eq('status', 'ACTIVE')
    .single() as { data: any }

  if (!supplier) notFound()

  const { data: pos } = await (supabase.from('supplier_pos' as any) as any)
    .select(`id, name, type, status, pos_locations(*), pos_details(*)`)
    .eq('id', params.posId)
    .eq('supplier_id', supplier.id)
    .eq('is_public', true)
    .single() as { data: any }

  if (!pos) notFound()

  const loc = pos.pos_locations as any
  const det = pos.pos_details as any
  const typeInfo = POS_TYPE_LABELS[pos.type] ?? { label: pos.type, color: 'bg-gray-100 text-gray-700' }
  const open = isOpenNow(det?.opening_hours)

  const mapsUrl = loc?.latitude && loc?.longitude
    ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
    : loc?.address_line1
    ? `https://www.google.com/maps/search/${encodeURIComponent([loc.address_line1, loc.city, loc.country].filter(Boolean).join(', '))}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-8 py-8 max-w-3xl">
        {/* Back link */}
        <Link href={`/brand/${params.slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0B1F4D] mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {tt("Back to")} {supplier.trade_name}
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-extrabold text-[#0B1F4D]">{pos.name}</h1>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {open ? '● Open Now' : '● Closed'}
                </span>
              </div>
              {(loc?.address_line1 || loc?.city) && (
                <p className="text-gray-500 text-sm">
                  {[loc.address_line1, loc.city, loc.country].filter(Boolean).join(', ')}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-0.5">{supplier.trade_name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-[#0B1F4D] mb-4">{tt("Contact")}</h2>
            <div className="space-y-3">
              {det?.manager_name && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div><p className="text-xs text-gray-400">{tt("Manager")}</p><p className="font-semibold text-gray-800">{det.manager_name}</p></div>
                </div>
              )}
              {det?.phone && (
                <a href={`tel:${det.phone}`} className="flex items-center gap-3 text-sm hover:text-[#0B1F4D] transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0B1F4D] transition-colors">
                    <svg className="w-4 h-4 text-blue-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <span className="font-medium text-gray-700">{det.phone}</span>
                </a>
              )}
              {det?.whatsapp && (
                <a href={`https://wa.me/${det.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm hover:text-green-600 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500 transition-colors">
                    <svg className="w-4 h-4 text-green-500 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <span className="font-medium text-gray-700">{det.whatsapp}</span>
                </a>
              )}
              {det?.email && (
                <a href={`mailto:${det.email}`} className="flex items-center gap-3 text-sm hover:text-[#0B1F4D] transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0B1F4D] transition-colors">
                    <svg className="w-4 h-4 text-purple-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="font-medium text-gray-700">{det.email}</span>
                </a>
              )}
            </div>
            {det?.accepts_walk_ins !== undefined && (
              <div className="flex flex-wrap gap-2 mt-4">
                {det.accepts_walk_ins && <span className="text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-full">✓ Walk-ins Welcome</span>}
                {det.accepts_orders  && <span className="text-xs bg-blue-50  text-blue-700  font-semibold px-2.5 py-1 rounded-full">✓ Accepts Orders</span>}
              </div>
            )}
          </div>

          {/* Hours */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-[#0B1F4D] mb-4">{tt("Opening Hours")}</h2>
            {det?.opening_hours ? (
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const h = det.opening_hours[day]
                  const isToday = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] === day
                  return (
                    <div key={day} className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg ${isToday ? 'bg-[#0B1F4D]/5 font-semibold' : ''}`}>
                      <span className="text-gray-600">{DAY_LABELS[day]}</span>
                      <span className={h?.closed ? 'text-gray-400 italic' : 'text-gray-800'}>
                        {h?.closed ? 'Closed' : `${h?.open} – ${h?.close}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">{tt("No hours listed")}</p>
            )}
          </div>

          {/* Services */}
          {det?.services_offered?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-[#0B1F4D] mb-3">{tt("Services")}</h2>
              <div className="flex flex-wrap gap-2">
                {det.services_offered.map((s: string) => (
                  <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {mapsUrl && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-[#0B1F4D] mb-3">{tt("Location")}</h2>
              {loc?.address_line1 && <p className="text-sm text-gray-600 mb-3">{[loc.address_line1, loc.city, loc.country].filter(Boolean).join(', ')}</p>}
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                {tt("Open in Google Maps")}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
