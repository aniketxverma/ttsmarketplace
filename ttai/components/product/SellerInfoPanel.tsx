import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { BrandLogo } from '@/components/BrandLogo'
import {
  ShieldCheck, Clock, Lock, MapPin, Building2, Phone, Mail, MessageCircle, ArrowRight,
  Check, Flame, Sparkles, Eye,
} from 'lucide-react'

/**
 * "Seller details" panel. Contact + identity are members-only. The locked state is a
 * conversion funnel (FOMO): tease the verified seller, then a two-step CTA —
 * logged-out → register free, free plan → upgrade — with benefit bullets + social proof.
 */
export async function SellerInfoPanel({
  supplier, locked, loggedIn,
}: {
  supplier: any
  locked: boolean
  loggedIn: boolean
}) {
  const name = supplier?.trade_name ?? supplier?.legal_name ?? 'Supplier'
  const tt = await localizeUI(['Seller details','This verified seller wants your order','Verified Supplier Co.','Free to join · then pick a plan to message sellers','See membership plans →'], getLocale())

  // ── UNLOCKED: real details ──────────────────────────────────────────────
  if (!locked) {
    const rows: { Icon: any; label: string; value: string }[] = [
      { Icon: MapPin,        label: 'Country',  value: supplier?.countries?.name ?? '—' },
      { Icon: Building2,     label: 'City',     value: supplier?.cities?.name ?? '—' },
      { Icon: Phone,         label: 'Phone',    value: supplier?.phone ?? '—' },
      { Icon: Mail,          label: 'Email',    value: supplier?.business_email ?? '—' },
      { Icon: MessageCircle, label: 'WhatsApp', value: supplier?.whatsapp ?? '—' },
    ]
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-extrabold text-[#0B1F4D] mb-3">{tt("Seller details")}</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-white">
            <BrandLogo src={supplier?.logo_url} name={name} size={48} textClass="text-lg" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#0B1F4D] truncate">{name}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 mt-0.5"><ShieldCheck className="w-3 h-3" /> Verified seller</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 ml-2"><Clock className="w-3 h-3" /> Responds quickly</span>
          </div>
        </div>
        <div className="space-y-1.5 border-t border-gray-50 pt-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-gray-400 inline-flex items-center gap-1.5"><r.Icon className="w-3 h-3" />{r.label}</span>
              <span className="font-semibold text-[#0B1F4D] truncate max-w-[150px] text-right">{r.value}</span>
            </div>
          ))}
        </div>
        <Link
          href={`/brand/${supplier?.brand_slug ?? supplier?.id}`}
          className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] py-2.5 text-sm font-extrabold hover:bg-[#0B1F4D] hover:text-white transition-colors"
        >
          View full profile <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  // ── LOCKED: FOMO conversion funnel ──────────────────────────────────────
  const teaseRows: { Icon: any; label: string }[] = [
    { Icon: MapPin,        label: 'Country & city' },
    { Icon: Phone,         label: 'Direct phone' },
    { Icon: Mail,          label: 'Email address' },
    { Icon: MessageCircle, label: 'WhatsApp' },
  ]
  const blur = 'blur-[6px] select-none'

  return (
    <div className="rounded-2xl border border-[#0B1F4D]/10 bg-white shadow-sm overflow-hidden">
      {/* Header band */}
      <div className="relative bg-gradient-to-br from-[#0B1F4D] to-[#1e3a8a] px-5 pt-5 pb-4 text-white">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-amber-300 mb-2">
          <Lock className="w-3.5 h-3.5" /> Members only
        </div>
        <p className="text-base font-extrabold leading-tight">{tt("This verified seller wants your order")}</p>
        <div className="flex items-center gap-3 mt-2.5">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className={`font-bold text-sm ${blur}`}>{tt("Verified Supplier Co.")}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-300"><ShieldCheck className="w-3 h-3" /> Verified</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-blue-200"><Clock className="w-3 h-3" /> Replies fast</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Teased (locked) contact rows */}
        <div className="space-y-2">
          {teaseRows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-gray-400 inline-flex items-center gap-1.5"><r.Icon className="w-3.5 h-3.5" />{r.label}</span>
              <span className={`font-semibold text-[#0B1F4D] ${blur}`}>+34 6•• ••• •••</span>
            </div>
          ))}
        </div>

        {/* What you get */}
        <div className="mt-4 rounded-xl bg-[#0B1F4D]/[0.03] border border-[#0B1F4D]/5 p-3">
          <p className="text-[11px] font-extrabold text-[#0B1F4D] uppercase tracking-wide mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#F5A623]" /> With a membership you unlock</p>
          <ul className="space-y-1.5">
            {['Direct phone, email & WhatsApp', 'Negotiate prices 1-on-1', 'Full verified catalogue & stock'].map((b) => (
              <li key={b} className="flex items-center gap-2 text-xs text-gray-700"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{b}</li>
            ))}
          </ul>
        </div>

        {/* CTA — register first, then plan */}
        {!loggedIn ? (
          <>
            <Link href="/register" className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] py-3 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors shadow-sm">
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[11px] text-gray-400 text-center mt-2">{tt("Free to join · then pick a plan to message sellers")}</p>
          </>
        ) : (
          <>
            <Link href="/pricing" className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] py-3 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors shadow-sm">
              <Lock className="w-4 h-4" /> Unlock with a plan <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="block text-center text-[11px] font-bold text-[#2563eb] hover:underline mt-2">{tt("See membership plans →")}</Link>
          </>
        )}

        {/* Social proof / FOMO */}
        <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-gray-400 border-t border-gray-50 pt-3">
          <span className="inline-flex items-center gap-1 text-orange-500 font-bold"><Flame className="w-3 h-3" /> In demand</span>
          <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Buyers contacting daily</span>
        </div>
      </div>
    </div>
  )
}
