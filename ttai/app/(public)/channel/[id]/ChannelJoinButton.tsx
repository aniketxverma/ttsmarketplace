'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, BellOff, Loader, LogIn } from 'lucide-react'

function WaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

interface Props {
  channelId: string
  whatsapp:  string | null
  compact?:  boolean
}

export function ChannelJoinButton({ channelId, whatsapp, compact = false }: Props) {
  const [user,     setUser]     = useState<{ id: string } | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [busy,     setBusy]     = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await (supabase.from('channel_members') as any)
          .select('id')
          .eq('channel_id', channelId)
          .eq('user_id', user.id)
          .maybeSingle()
        setIsMember(!!data)
      }
      setLoading(false)
    }
    init()
  }, [channelId])

  const handleAction = async () => {
    if (!user) { router.push(`/login?next=/channel/${channelId}`); return }
    setBusy(true)
    if (isMember) {
      await fetch(`/api/channels/${channelId}/join`, { method: 'DELETE' })
      setIsMember(false)
    } else {
      await fetch(`/api/channels/${channelId}/join`, { method: 'POST' })
      setIsMember(true)
    }
    setBusy(false)
    router.refresh()
  }

  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hi! I subscribed to your TTAI canal.`
    : null

  if (loading) return (
    compact
      ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      : <div className="flex justify-center py-2"><div className="w-5 h-5 border-2 border-[#0B1F4D]/30 border-t-[#0B1F4D] rounded-full animate-spin" /></div>
  )

  /* ── Compact version — shown in the sticky header ── */
  if (compact) {
    return (
      <button onClick={handleAction} disabled={busy}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shadow-sm disabled:opacity-60 ${
          isMember
            ? 'bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/30'
            : 'bg-white text-[#0B1F4D] hover:bg-gray-100'
        }`}>
        {busy ? <Loader className="w-3 h-3 animate-spin" />
               : isMember ? <BellOff className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
        {busy ? '…' : isMember ? 'Following' : 'Follow'}
      </button>
    )
  }

  /* ── Full version — shown in the channel info card ── */
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleAction} disabled={busy}
          className={`flex items-center gap-2 px-7 py-2.5 rounded-full font-bold text-sm transition-all disabled:opacity-60 ${
            isMember
              ? 'bg-[#f0f2f5] text-[#3b4a54] hover:bg-red-50 hover:text-red-600'
              : 'bg-[#00a884] text-white hover:bg-[#06917a] shadow-sm'
          }`}>
          {busy ? <Loader className="w-4 h-4 animate-spin" />
                : isMember ? <BellOff className="w-4 h-4" /> : user ? <Bell className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {busy ? 'Please wait…'
                : isMember ? 'Following'
                : user ? 'Follow' : 'Login to Follow'}
        </button>

        {isMember && waHref && (
          <a href={waHref} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#25D366] hover:bg-[#1ebe5d] text-white transition-colors shadow-sm">
            <WaIcon className="w-4 h-4" />WhatsApp
          </a>
        )}
      </div>

      {isMember && (
        <p className="text-xs text-green-600 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          You&apos;re following this channel
        </p>
      )}
    </div>
  )
}
