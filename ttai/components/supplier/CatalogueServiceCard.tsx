'use client'

import { useState } from 'react'
import { FileSpreadsheet, Check, Loader2, Sparkles } from 'lucide-react'

/** Supplier CTA to request the paid "TTAIEMA builds my catalogue" service.
 *  Opens a Control Center ticket routed to the Marketplace team (Ane). */
export function CatalogueServiceCard({ companyName, email, active }: { companyName: string; email: string; active: boolean }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')

  async function request() {
    setState('sending')
    try {
      await fetch('/api/ticket', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: 'marketplace', companyName, clientName: companyName, email,
          subject: 'Catalogue service request', sourceForm: 'catalogue-service',
          message: `${companyName} would like TTAIEMA to build & maintain their professional online catalogue — Excel import, featured products, category banners and brand setup.`,
        }),
      })
    } catch { /* ignore */ }
    setState('done')
  }

  if (active) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50/60 p-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0"><FileSpreadsheet className="w-5 h-5 text-green-600" /></span>
        <div>
          <p className="font-extrabold text-green-800 text-sm">📊 TTAIEMA builds your catalogue</p>
          <p className="text-xs text-green-700">Our team manages your professional online catalogue. Send updated Excel files any time.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#0B1F4D]/15 bg-gradient-to-br from-[#0B1F4D]/[0.03] to-[#F5A623]/[0.04] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-[#0B1F4D]/5 flex items-center justify-center flex-shrink-0"><Sparkles className="w-5 h-5 text-[#0B1F4D]" /></span>
        <div>
          <p className="font-extrabold text-[#0B1F4D]">Don&rsquo;t want to upload everything yourself?</p>
          <p className="text-sm text-gray-500 mt-0.5">Let <strong>TTAIEMA build &amp; maintain your professional catalogue</strong> from your Excel files — featured products, category banners and brands. (Paid service)</p>
        </div>
      </div>
      {state === 'done' ? (
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-100 text-green-700 px-4 py-2.5 text-sm font-bold flex-shrink-0"><Check className="w-4 h-4" /> Request sent</span>
      ) : (
        <button onClick={request} disabled={state === 'sending'}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-60 flex-shrink-0 whitespace-nowrap">
          {state === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Request catalogue service
        </button>
      )}
    </div>
  )
}
