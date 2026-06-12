import Link from 'next/link'
import { Rocket, ArrowRight, Store } from 'lucide-react'

/** Shown on browse surfaces (marketplace, store) while the platform is in
 *  Pre-Opening. Homepage + Trade Hub + individual shop pages stay open. */
export function OpeningSoon({ title = 'Opening Soon' }: { title?: string }) {
  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-[#0a1733] to-[#0B1F4D] text-white flex items-center justify-center px-4 py-20">
      <div className="max-w-xl text-center">
        <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6">
          <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" /> {title}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
          The full marketplace opens soon
        </h1>
        <p className="text-blue-200/90 leading-relaxed">
          TTAI EMA is a global B2B trade marketplace currently in its pre-opening phase.
          Businesses can register now and build their shop ahead of launch — verification,
          full marketplace browsing, B2B access and promotions go live on opening day.
        </p>
        <p className="text-blue-200/70 text-sm mt-3">
          In the meantime, explore the <strong className="text-white">TTAI Trade Hub</strong> —
          our own verified wholesale catalogue — or reserve your shop.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors">
            <Rocket className="w-4 h-4" /> Reserve your shop
          </Link>
          <Link href="/b2b"
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold hover:bg-white/10 transition-colors">
            <Store className="w-4 h-4" /> Visit the Trade Hub <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <Link href="/" className="inline-block mt-6 text-xs text-blue-300/70 hover:text-white transition-colors">← Back to home</Link>
      </div>
    </div>
  )
}
