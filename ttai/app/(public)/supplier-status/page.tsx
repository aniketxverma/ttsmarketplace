import Link from 'next/link'
import { SUPPLIER_STATES, SUPPLIER_STATUS_ORDER } from '@/lib/supplier-status'
import { ShieldCheck, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Supplier Status & Verification Levels · TTAI EMA',
  description: 'What each TTAIEMA supplier status means — Verified, Independent, TTAIEMA Protected, Under Review, Suspended and Premium Partner.',
}

export default function SupplierStatusPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0B1F4D] via-[#13306e] to-[#0a1733] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#F5A623] mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Trust &amp; Verification
          </span>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">Supplier status &amp; verification levels</h1>
          <p className="text-blue-100/85 mt-3 max-w-2xl text-sm sm:text-base">
            Every company on TTAIEMA shows a clear status so buyers understand the level of verification and the role
            TTAIEMA plays in each transaction. TTAIEMA is the platform &amp; website creator — the supplier is independently
            operated unless a transaction is marked <strong className="text-[#F5A623]">TTAIEMA Protected</strong>.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-4">
        {SUPPLIER_STATUS_ORDER.map((key) => {
          const s = SUPPLIER_STATES[key]
          return (
            <div key={key} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl">{s.emoji}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full font-bold text-sm px-3 py-1 ${s.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{s.description}</p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
                {s.details.map((d) => (
                  <div key={d} className="flex items-start gap-2 text-[13px] text-gray-500">
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.dot.replace('bg-', 'text-')}`} />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Brand disclaimer */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5 sm:p-6 mt-6">
          <p className="text-sm font-extrabold text-[#0B1F4D]">Hosted by TTAIEMA Marketplace · Website created by TTAIEMA</p>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            Each company website (e.g. <code className="text-[#0B1F4D]">ttai.es/rozil</code>) is created and hosted by TTAIEMA.
            The company is independently operated by the supplier and is responsible for its own products, stock, delivery
            and customer service — unless the transaction is marked <strong className="text-blue-600">TTAIEMA Protected</strong>,
            in which case TTAIEMA is officially involved in the process.
          </p>
          <Link href="/suppliers" className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1F4D] hover:underline mt-3">Browse verified suppliers →</Link>
        </div>
      </div>
    </div>
  )
}
