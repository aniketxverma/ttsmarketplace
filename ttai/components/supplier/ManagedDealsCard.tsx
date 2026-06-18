'use client'

import { useState } from 'react'
import { Handshake, Check, Loader2 } from 'lucide-react'

/** Supplier CTA to request the TTAIEMA-managed deal service. Opens a Control
 *  Center ticket (Marketplace team / Ane). Shows active state when enabled. */
export function ManagedDealsCard({ companyName, email, active }: { companyName: string; email: string; active: boolean }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')

  async function request() {
    setState('sending')
    try {
      await fetch('/api/ticket', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: 'marketplace', companyName, clientName: companyName, email,
          subject: 'Managed-deals service request', sourceForm: 'managed-deals',
          message: `${companyName} would like TTAIEMA to coordinate their B2B deals — manage buyer communication, confirm stock/price/delivery, and handle dropshipping/logistics when requested.`,
        }),
      })
    } catch { /* ignore */ }
    setState('done')
  }

  if (active) {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0"><Handshake className="w-5 h-5 text-indigo-600" /></span>
        <div>
          <p className="font-extrabold text-indigo-800 text-sm">🤝 TTAIEMA coordinates your deals</p>
          <p className="text-xs text-indigo-700">Purchase requests are managed by our Marketplace team — communication, stock/price confirmation, delivery &amp; logistics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#0B1F4D]/15 bg-gradient-to-br from-[#0B1F4D]/[0.03] to-indigo-100/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-[#0B1F4D]/5 flex items-center justify-center flex-shrink-0"><Handshake className="w-5 h-5 text-[#0B1F4D]" /></span>
        <div>
          <p className="font-extrabold text-[#0B1F4D]">Want TTAIEMA to handle your deals?</p>
          <p className="text-sm text-gray-500 mt-0.5">Let our Marketplace team <strong>coordinate buyer communication, confirm stock &amp; price, and arrange dropshipping/logistics</strong> on your behalf. (Optional service)</p>
        </div>
      </div>
      {state === 'done' ? (
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-100 text-green-700 px-4 py-2.5 text-sm font-bold flex-shrink-0"><Check className="w-4 h-4" /> Request sent</span>
      ) : (
        <button onClick={request} disabled={state === 'sending'}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-60 flex-shrink-0 whitespace-nowrap">
          {state === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />} Request managed service
        </button>
      )}
    </div>
  )
}
