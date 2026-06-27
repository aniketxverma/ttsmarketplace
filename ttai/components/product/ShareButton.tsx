'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { Share2, Check, MessageCircle, Copy } from 'lucide-react'

/**
 * Share a product link. On mobile it opens the native share sheet (WhatsApp,
 * etc.) via the Web Share API — the link preview shows the product image thanks
 * to the OG/Twitter tags. On desktop it offers WhatsApp + copy-link.
 */
export function ShareButton({ title, label = 'Share' }: { title: string; label?: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const url = () => (typeof window !== 'undefined' ? window.location.href : '')

  async function share() {
    const shareData = { title, text: title, url: url() }
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try { await (navigator as any).share(shareData); return } catch { /* cancelled → fall through to menu */ }
    }
    setOpen((o) => !o)
  }

  async function copy() {
    try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ }
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url()}`)}`

  return (
    <div className="relative inline-block">
      <button type="button" onClick={share}
        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-600 hover:border-[#0B1F4D] hover:text-[#0B1F4D] transition-colors">
        <Share2 className="w-4 h-4" /> {label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-gray-100 bg-white shadow-xl p-1.5">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
              <MessageCircle className="w-4 h-4 text-green-600" /> {t("WhatsApp")}
            </a>
            <button type="button" onClick={() => { copy(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
