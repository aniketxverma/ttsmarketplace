'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  body: string
  sender_id: string
  is_read: boolean
  created_at: string
}

interface Props {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
  otherPartyName: string
  backHref: string
  backLabel?: string
  orderHref?: string
}

export function ChatThread({
  conversationId,
  initialMessages,
  currentUserId,
  otherPartyName,
  backHref,
  backLabel = 'Messages',
  orderHref,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  // Instant scroll on first load, smooth on new messages
  useEffect(() => { scrollToBottom('instant') }, [])
  useEffect(() => {
    if (messages.length > initialMessages.length) scrollToBottom()
  }, [messages.length])

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' })

    const supabase = createClient()
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m])
          if (m.sender_id !== currentUserId) {
            fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId])

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  async function sendMessage() {
    const body = input.trim()
    if (!body || sending) return
    setInput('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
    setSending(true)

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      body,
      sender_id: currentUserId,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })

    if (res.ok) {
      const saved = await res.json()
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? saved : m))
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    }

    setSending(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // On desktop: Enter sends; Shift+Enter adds newline
    // On mobile: let the OS handle Enter naturally (use send button)
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    /*
     * Use flex column + calc height so the component fills exactly the
     * available viewport regardless of screen size.
     * 4rem  = sticky header height
     * We avoid 100vh because iOS Safari over-reports it (URL bar is included).
     * 100svh (small viewport height) gives the minimum guaranteed space.
     */
    <div
      className="flex flex-col bg-white overflow-hidden"
      style={{ height: 'calc(100svh - 4rem)' }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white flex-shrink-0 shadow-sm">
        <Link
          href={backHref}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0 -ml-1"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="w-9 h-9 rounded-full bg-[#0B1F4D] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {otherPartyName[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{otherPartyName}</p>
          <p className="text-[10px] text-gray-400">{backLabel}</p>
        </div>

        {orderHref && (
          <Link
            href={orderHref}
            className="flex-shrink-0 text-xs font-semibold text-[#0B1F4D] border border-[#0B1F4D]/20 rounded-lg px-3 py-1.5 hover:bg-[#0B1F4D]/5 transition-colors"
          >
            Order
          </Link>
        )}
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div
        ref={messagesRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50/60"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-600 text-sm">Start the conversation</p>
            <p className="text-xs text-gray-400 mt-1">Send your first message to {otherPartyName}</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.sender_id === currentUserId
          const prev = messages[i - 1]
          const showDate = i === 0 || new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString()
          const prevSame = prev && prev.sender_id === msg.sender_id
          const nextMsg = messages[i + 1]
          const nextSame = nextMsg && nextMsg.sender_id === msg.sender_id

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2">
                    {new Date(msg.created_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}

              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${prevSame && !showDate ? 'mt-0.5' : 'mt-2'}`}>
                {/* Avatar placeholder for spacing when not own */}
                {!isOwn && (
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 mr-2 mt-auto ${!nextSame ? 'bg-[#0B1F4D] flex items-center justify-center text-white text-[10px] font-bold' : ''}`}>
                    {!nextSame && otherPartyName[0]?.toUpperCase()}
                  </div>
                )}

                <div className={`flex flex-col gap-0.5 max-w-[78%] sm:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`
                    px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap
                    ${isOwn
                      ? 'bg-[#0B1F4D] text-white'
                      : 'bg-white text-gray-900 border border-gray-100 shadow-sm'
                    }
                    ${isOwn
                      ? (prevSame && !showDate ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tr-sm') + ' ' + (nextSame ? 'rounded-br-md' : 'rounded-br-sm')
                      : (prevSame && !showDate ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-tl-sm') + ' ' + (nextSame ? 'rounded-bl-md' : 'rounded-bl-sm')
                    }
                    ${msg.id.startsWith('opt-') ? 'opacity-60' : ''}
                  `}>
                    {msg.body}
                  </div>
                  {!nextSame && (
                    <span className="text-[10px] text-gray-400 px-1 mt-0.5">{formatTime(msg.created_at)}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ── Input bar ───────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 border-t bg-white px-3 py-3 flex items-end gap-2"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); autoResize() }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={`Message ${otherPartyName}…`}
          className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/30 focus:border-[#0B1F4D]/40 focus:bg-white transition-all overflow-hidden"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-11 h-11 rounded-2xl bg-[#0B1F4D] text-white flex items-center justify-center hover:bg-[#162d6e] active:scale-95 transition-all disabled:opacity-30 flex-shrink-0"
          aria-label="Send"
        >
          {sending ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
