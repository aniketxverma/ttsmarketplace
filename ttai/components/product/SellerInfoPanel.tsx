import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ShieldCheck, Clock, Lock, MapPin, Building2, Phone, Mail, MessageCircle, ArrowRight } from 'lucide-react'

/**
 * "Seller details" panel (Merkandi-style). Contact + identity are members-only:
 * for logged-out / free users the values are blurred behind a register/upgrade CTA.
 * Paid plans, admins and suppliers see the real data + a link to the full profile.
 */
export function SellerInfoPanel({
  supplier, locked, loggedIn,
}: {
  supplier: any
  locked: boolean
  loggedIn: boolean
}) {
  const name = supplier?.trade_name ?? supplier?.legal_name ?? 'Supplier'
  const rows: { Icon: any; label: string; value: string }[] = [
    { Icon: MapPin,        label: 'Country',  value: supplier?.countries?.name ?? '—' },
    { Icon: Building2,     label: 'City',     value: supplier?.cities?.name ?? '—' },
    { Icon: Phone,         label: 'Phone',    value: supplier?.phone ?? '—' },
    { Icon: Mail,          label: 'Email',    value: supplier?.business_email ?? '—' },
    { Icon: MessageCircle, label: 'WhatsApp', value: supplier?.whatsapp ?? '—' },
  ]
  const blur = 'blur-[5px] select-none'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-extrabold text-[#0B1F4D] mb-3">Seller details</h3>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-white">
          {locked
            ? <div className="w-full h-full bg-gradient-to-br from-[#0B1F4D] to-[#2563eb] flex items-center justify-center"><Lock className="w-5 h-5 text-white" /></div>
            : <BrandLogo src={supplier?.logo_url} name={name} size={48} textClass="text-lg" />}
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-[#0B1F4D] truncate ${locked ? blur : ''}`}>{locked ? 'Verified Supplier Co.' : name}</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 mt-0.5"><ShieldCheck className="w-3 h-3" /> Verified seller</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 ml-2"><Clock className="w-3 h-3" /> Responds quickly</span>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-gray-50 pt-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-gray-400 inline-flex items-center gap-1.5"><r.Icon className="w-3 h-3" />{r.label}</span>
            <span className={`font-semibold text-[#0B1F4D] truncate max-w-[150px] text-right ${locked ? blur : ''}`}>
              {locked ? 'XXXXXXXXXX' : r.value}
            </span>
          </div>
        ))}
      </div>

      {locked ? (
        <>
          <Link
            href={loggedIn ? '/pricing' : '/register'}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] py-3 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors"
          >
            <Lock className="w-4 h-4" /> {loggedIn ? 'Upgrade plan to view contact' : 'Register free to view contact'}
          </Link>
          <p className="text-[11px] text-gray-400 text-center mt-2">🔒 Seller name &amp; contact are members-only</p>
        </>
      ) : (
        <Link
          href={`/brand/${supplier?.brand_slug ?? supplier?.id}`}
          className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] py-2.5 text-sm font-extrabold hover:bg-[#0B1F4D] hover:text-white transition-colors"
        >
          View full profile <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}
