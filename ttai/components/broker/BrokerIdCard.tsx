'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { Copy, Check, BadgeCheck } from 'lucide-react'

/** Displays the broker's permanent Broker ID with copy-to-clipboard. */
export function BrokerIdCard({ code }: { code: string }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })
  }
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0B1F4D] to-[#13306e] text-white p-5 relative overflow-hidden">
      <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-[#F5A623]/15 blur-2xl" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" /> {t("Your Broker ID")}</p>
      <p className="text-2xl font-black tracking-wider mt-1.5">{code}</p>
      <p className="text-[11px] text-white/60 mt-1">{t("Every company you register stays linked to this ID — permanently.")}</p>
      <button onClick={copy} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/20 transition-colors">
        {copied ? <><Check className="w-3.5 h-3.5" /> {t("Copied")}</> : <><Copy className="w-3.5 h-3.5" /> {t("Copy ID")}</>}
      </button>
    </div>
  )
}
