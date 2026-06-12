'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, ShoppingBag, Check, Loader2, X, Lock } from 'lucide-react'

/**
 * One-time dashboard popup so a supplier picks their Shop Type without going to
 * Settings. Free rule (per agreement): you sell on ONE channel free — selling on
 * the other / both requires a paid plan.
 */
export function ShopTypeModal() {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Respect a previous "decide later" dismissal on this device.
  useEffect(() => {
    try { if (localStorage.getItem('ttai_shop_type_set') === '1') setOpen(false) } catch {}
  }, [])

  if (!open) return null

  async function choose(value: 'wholesale' | 'retail') {
    setSaving(value)
    const res = await fetch('/api/supplier/brand', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketplace_context: value, shop_type_chosen: true }),
    })
    setSaving(null)
    if (res.ok) { try { localStorage.setItem('ttai_shop_type_set', '1') } catch {}; setOpen(false); router.refresh() }
    else alert('Could not save — please try again')
  }

  function dismiss() {
    try { localStorage.setItem('ttai_shop_type_set', '1') } catch {}
    setOpen(false)
  }

  const Card = ({ v, Icon, title, sub }: { v: 'wholesale' | 'retail'; Icon: any; title: string; sub: string }) => (
    <button onClick={() => choose(v)} disabled={!!saving}
      className="flex-1 text-left rounded-2xl border-2 border-gray-200 hover:border-[#0B1F4D] hover:shadow-md p-5 transition-all disabled:opacity-60">
      <div className="w-11 h-11 rounded-xl bg-[#0B1F4D]/5 flex items-center justify-center mb-3">
        {saving === v ? <Loader2 className="w-5 h-5 text-[#0B1F4D] animate-spin" /> : <Icon className="w-5 h-5 text-[#0B1F4D]" />}
      </div>
      <p className="font-extrabold text-[#0B1F4D]">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-green-600"><Check className="w-3.5 h-3.5" /> Free</span>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl p-6 sm:p-7">
        <button onClick={dismiss} className="absolute top-4 right-4 text-gray-300 hover:text-gray-600"><X className="w-5 h-5" /></button>

        <p className="text-[11px] font-bold uppercase tracking-widest text-[#F5A623]">Welcome to your shop</p>
        <h2 className="text-xl font-extrabold text-[#0B1F4D] mt-1">How do you sell?</h2>
        <p className="text-sm text-gray-500 mt-1">Choose your shop type. <strong>One channel is included free</strong> — selling on the other (or both) needs a paid plan.</p>

        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <Card v="wholesale" Icon={Building2} title="B2B / Wholesale" sub="Sell by box, pallet or truck to businesses." />
          <Card v="retail" Icon={ShoppingBag} title="Retail / Online" sub="Sell individual pieces to consumers." />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <Link href="/pricing" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F5A623] hover:underline">
            <Lock className="w-3.5 h-3.5" /> Want to sell on both? Upgrade
          </Link>
          <button onClick={dismiss} className="text-xs font-semibold text-gray-400 hover:text-gray-600">I&rsquo;ll decide later</button>
        </div>
        <p className="text-[11px] text-gray-400 mt-3">You can change this anytime in Settings.</p>
      </div>
    </div>
  )
}
