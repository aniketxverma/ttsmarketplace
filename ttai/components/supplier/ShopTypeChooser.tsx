'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, ShoppingBag, Check, Loader2, Lock } from 'lucide-react'

/**
 * Lets a supplier pick their FREE sales channel — B2B (wholesale) or Retail (online).
 * Selling on both requires a paid plan. Saves suppliers.marketplace_context via
 * /api/supplier/brand (admin-side update).
 */
export function ShopTypeChooser({ initial, paid }: { initial: 'wholesale' | 'retail' | 'both'; paid: boolean }) {
  const [value, setValue] = useState<'wholesale' | 'retail' | 'both'>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function choose(v: 'wholesale' | 'retail' | 'both') {
    if (v === 'both' && !paid) return
    setValue(v); setSaved(false); setSaving(true)
    const res = await fetch('/api/supplier/brand', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketplace_context: v }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    else alert('Could not save shop type')
  }

  const Card = ({ v, Icon, title, sub }: { v: 'wholesale' | 'retail'; Icon: any; title: string; sub: string }) => {
    const active = value === v || value === 'both'
    return (
      <button onClick={() => choose(v)} disabled={saving}
        className={`flex-1 text-left rounded-xl border-2 p-4 transition-all ${active ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.03]' : 'border-gray-200 hover:border-gray-300'}`}>
        <div className="flex items-center justify-between">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-500'}`}>
            <Icon className="w-5 h-5" />
          </div>
          {active && <Check className="w-5 h-5 text-[#0B1F4D]" />}
        </div>
        <p className="font-bold text-[#0B1F4D] mt-3">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </button>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4 max-w-2xl">
      <div>
        <h2 className="font-semibold">Shop type</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose the shop you sell on. One channel is included free — selling on <strong>both</strong> needs a paid plan.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Card v="wholesale" Icon={Building2} title="B2B / Wholesale" sub="Sell by box, pallet or truck to businesses." />
        <Card v="retail" Icon={ShoppingBag} title="Retail / Online" sub="Sell individual pieces to consumers." />
      </div>

      {/* Sell on both */}
      <button onClick={() => choose('both')} disabled={saving || !paid}
        className={`w-full rounded-xl border-2 p-3 flex items-center justify-between transition-all ${
          value === 'both' ? 'border-[#F5A623] bg-amber-50' : 'border-dashed border-gray-200'} ${!paid ? 'opacity-70 cursor-not-allowed' : 'hover:border-[#F5A623]'}`}>
        <span className="flex items-center gap-2 text-sm font-bold text-[#0B1F4D]">
          {!paid && <Lock className="w-4 h-4 text-[#F5A623]" />} Sell on both shops
        </span>
        {value === 'both' ? <Check className="w-5 h-5 text-[#F5A623]" />
          : !paid ? <Link href="/pricing" className="text-xs font-bold text-[#F5A623] underline">Upgrade</Link>
          : <span className="text-xs text-gray-400">Choose</span>}
      </button>

      <div className="h-5 text-sm">
        {saving ? <span className="text-gray-400 flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Saving…</span>
          : saved ? <span className="text-green-600 flex items-center gap-1.5"><Check className="w-4 h-4" /> Saved</span> : null}
      </div>
    </div>
  )
}
