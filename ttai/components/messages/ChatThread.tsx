'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
}

export function ChatThread({ conversationId, initialMessages, currentUserId, otherPartyName }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b bg-white">
        <div className="w-9 h-9 rounded-full bg-[#0B1F4D] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {otherPartyName[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{otherPartyName}</p>
          <p className="text-[10px] text-green-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-600 text-sm">Start the conversation</p>
            <p className="text-xs text-gray-400 mt-1">Send a message to {otherPartyName}</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.sender_id === currentUserId
          const showDate = i === 0 || new Date(messages[i - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString()

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}

              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col gap-0.5 max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
                    isOwn
                      ? 'bg-[#0B1F4D] text-white rounded-2xl rounded-br-sm'
                      : 'bg-white text-gray-900 rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm'
                  } ${msg.id.startsWith('opt-') ? 'opacity-60' : ''}`}>
                    {msg.body}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white px-4 py-3 flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); autoResize() }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={`Message ${otherPartyName}… (Enter to send, Shift+Enter for newline)`}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all overflow-hidden"
          style={{ height: 'auto', minHeight: '42px' }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-xl bg-[#0B1F4D] text-white flex items-center justify-center hover:bg-[#162d6e] transition-colors disabled:opacity-40 flex-shrink-0"
          title="Send message"
        >
          {sending ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
