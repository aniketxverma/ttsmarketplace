'use client'

import { useState } from 'react'
import { Check, Loader2, CreditCard } from 'lucide-react'

const TPLS = [
  { id: 'navy', name: 'Sapphire',  bg: 'bg-gradient-to-br from-[#0B1F4D] via-[#13306e] to-[#1e3a8a]', light: false },
  { id: 'gold', name: 'Onyx',      bg: 'bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#0c0a09]', light: false },
  { id: 'mint', name: 'Emerald',   bg: 'bg-gradient-to-br from-[#075E54] via-[#0b7d6e] to-[#00a884]', light: false },
  { id: 'plat', name: 'Platinum',  bg: 'bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200', light: true },
]

export function CardTemplateEditor({ initial }: { initial: string | null }) {
  const [sel, setSel] = useState(initial && TPLS.some((t) => t.id === initial) ? initial : 'navy')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  async function choose(id: string) {
    setSel(id); setBusy(true); setSaved(false)
    const res = await fetch('/api/supplier/brand', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ card_template: id }),
    })
    setBusy(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-extrabold text-[#0B1F4D] flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#F5A623]" /> Business Card Style</h3>
        {busy ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              : saved && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" />Saved</span>}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Pick the default style for your <strong>digital business card</strong> on your public profile. Details fill in
        automatically from your profile — visitors can flip it, share it and save your contact.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TPLS.map((t) => (
          <button key={t.id} onClick={() => choose(t.id)}
            className={`relative rounded-xl ${t.bg} h-20 flex items-end p-2 ring-2 transition-all ${sel === t.id ? 'ring-[#0B1F4D] scale-[1.03]' : 'ring-transparent hover:ring-gray-300'}`}>
            <span className={`text-[11px] font-extrabold ${t.light ? 'text-[#0B1F4D]' : 'text-white'}`}>{t.name}</span>
            {sel === t.id && <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0B1F4D] text-white flex items-center justify-center"><Check className="w-3 h-3" /></span>}
          </button>
        ))}
      </div>
    </div>
  )
}
