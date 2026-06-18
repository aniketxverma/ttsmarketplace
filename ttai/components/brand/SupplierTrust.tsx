import { resolveSupplierStatus, type SupplierStatusInfo } from '@/lib/supplier-status'

type Sup = { status?: string | null; reliability_tier?: string | null; ttaiema_protected?: boolean | null }

/** The supplier's trust status pill (🟢 Verified / 🟡 Independent / 🔵 Protected / 🔴 Review). */
export function SupplierStatusBadge({ supplier, size = 'md', withDot = true }: { supplier: Sup; size?: 'sm' | 'md'; withDot?: boolean }) {
  const s: SupplierStatusInfo = resolveSupplierStatus(supplier)
  const pad = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold ${pad} ${s.cls}`} title={s.blurb}>
      {withDot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
      {s.label}
    </span>
  )
}

/**
 * Brand-protection disclaimer for the supplier's free company website. Makes
 * clear TTAIEMA hosts/built the site but the company is independently operated
 * (unless TTAIEMA Protected). Protects the TTAIEMA brand from supplier disputes.
 */
export function HostedByTTAIEMA({ companyName, supplier }: { companyName: string; supplier: Sup }) {
  const s = resolveSupplierStatus(supplier)
  const protectedSvc = s.key === 'protected'
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mt-10 mb-8">
      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-extrabold text-[#0B1F4D]">Hosted by TTAIEMA Marketplace</span>
            <SupplierStatusBadge supplier={supplier} />
          </div>
          <span className="text-[11px] text-gray-400">Website created by TTAIEMA</span>
        </div>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {protectedSvc ? (
            <>This is the official company website of <strong>{companyName}</strong>, created and hosted by TTAIEMA.
            This supplier is enrolled in the <strong>TTAIEMA Protected Service</strong> — TTAIEMA is officially involved
            in transactions through logistics, inspection, order management and broker protection.</>
          ) : (
            <>This is the official company website of <strong>{companyName}</strong>, created and hosted by TTAIEMA.
            The company is <strong>independently operated by {companyName}</strong> and is solely responsible for its
            own products, stock, deliveries and customer obligations. TTAIEMA is the platform &amp; website creator —
            not the owner of this business — unless TTAIEMA is officially managing the transaction
            (<span className="text-blue-600 font-semibold">TTAIEMA Protected Service</span>).</>
          )}
        </p>
      </div>
    </div>
  )
}
