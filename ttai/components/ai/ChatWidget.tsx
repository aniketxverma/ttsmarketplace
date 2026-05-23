'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ChatProduct, ChatAction } from '@/app/api/chat/route'

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Message {
  role: 'user' | 'assistant'
  content: string
  products?: ChatProduct[]
  action?: ChatAction | null
}

interface UserInfo {
  full_name: string | null
  role: string
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(cents / 100)
}

function getGreeting(name: string | null) {
  const h = new Date().getHours()
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return name ? `${time}, ${name.split(' ')[0]}! 👋` : `${time}! 👋`
}

function getSessionKey(): string {
  if (typeof window === 'undefined') return crypto.randomUUID()
  let key = localStorage.getItem('ttai_chat_session')
  if (!key) { key = crypto.randomUUID(); localStorage.setItem('ttai_chat_session', key) }
  return key
}

/* ── Category chip icons ───────────────────────────────────────────────────── */
function FoodIcon()        { return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> }
function ElectronicsIcon() { return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> }
function FashionIcon()     { return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7l-2 2m0 0l2 2m-2-2h12m0 0l2-2m-2 2l-2 2M9 3h6l2 4H7L9 3z" /></svg> }
function ConstructionIcon(){ return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> }
function BeautyIcon()      { return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> }
function HomeIcon()        { return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> }

/* ── Category chips ────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { icon: <FoodIcon />,         label: 'Food & Agriculture',  query: 'fresh food produce agriculture' },
  { icon: <ElectronicsIcon />,  label: 'Electronics',          query: 'electronics technology gadgets' },
  { icon: <FashionIcon />,      label: 'Fashion & Textiles',   query: 'clothing textiles fashion apparel' },
  { icon: <ConstructionIcon />, label: 'Construction',         query: 'construction building materials' },
  { icon: <BeautyIcon />,       label: 'Health & Beauty',      query: 'health beauty wellness cosmetics' },
  { icon: <HomeIcon />,         label: 'Home & Garden',        query: 'home garden furniture decor' },
]

/* ── Product card ──────────────────────────────────────────────────────────── */
function ProductCard({ p }: { p: ChatProduct }) {
  return (
    <Link
      href={`/marketplace/${p.slug}`}
      target="_blank"
      className="flex-shrink-0 w-40 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all duration-200 overflow-hidden group"
    >
      <div className="relative h-28 bg-gray-50">
        {p.image_url ? (
          <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="160px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2 min-h-[2rem]">{p.name}</p>
        <p className="text-xs font-extrabold text-[#0B1F4D] mt-1.5">{fmt(p.price_cents, p.currency_code)}</p>
        {p.category_name && (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{p.category_name}</p>
        )}
        <p className="text-[10px] font-semibold text-[#F5A623] mt-1.5 group-hover:underline">View product →</p>
      </div>
    </Link>
  )
}

/* ── Action card (message sent) ────────────────────────────────────────────── */
function ActionCard({ action }: { action: ChatAction }) {
  return (
    <Link
      href={action.conversation_url}
      className="flex items-center gap-3 rounded-2xl bg-green-50 border border-green-200 px-4 py-3 hover:bg-green-100 transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-green-800">Message sent to {action.supplier_name}</p>
        <p className="text-xs text-green-600 mt-0.5">Tap to view conversation →</p>
      </div>
    </Link>
  )
}

/* ── Typing indicator ──────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-gray-100 rounded-2xl rounded-tl-sm w-fit">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: '1s' }}
        />
      ))}
    </div>
  )
}

/* ── Main widget ───────────────────────────────────────────────────────────── */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionKey] = useState(() => getSessionKey())
  const [hasOpened, setHasOpened] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch user on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('full_name, role').eq('id', data.user.id).single().then(({ data: p }) => {
          if (p) setUser({ full_name: p.full_name, role: p.role as string })
        })
      }
    })
  }, [])

  // Build initial greeting message
  const buildGreeting = useCallback((userInfo: UserInfo | null) => {
    const greeting = getGreeting(userInfo?.full_name ?? null)
    const roleHint = userInfo?.role === 'supplier'
      ? "I can help you understand market trends and find competitive products."
      : userInfo?.role === 'buyer' || userInfo?.role === 'business_client'
      ? "I can help you find the best products and connect you directly with suppliers."
      : "I can help you discover products from verified suppliers worldwide."
    return `${greeting} I'm TTAI Assistant, your global trade guide. ${roleHint}\n\nWhat are you looking for today?`
  }, [])

  // Set greeting when opened for the first time
  useEffect(() => {
    if (isOpen && !hasOpened) {
      setHasOpened(true)
      setMessages([{ role: 'assistant', content: buildGreeting(user) }])
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, hasOpened, user, buildGreeting])

  // Update greeting if user loads after open
  useEffect(() => {
    if (hasOpened && messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: buildGreeting(user) }])
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isLoading) return

    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          sessionKey,
        }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.content ?? 'Sorry, something went wrong.',
        products: data.products?.length > 0 ? data.products : undefined,
        action: data.action ?? null,
      }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, isLoading, messages, sessionKey])

  const showCategoryChips = messages.length <= 1

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-[5.5rem] right-4 sm:right-6 z-[200] flex flex-col rounded-3xl shadow-2xl border border-gray-100 bg-white overflow-hidden transition-all duration-300 ease-out w-[calc(100vw-2rem)] sm:w-[420px] ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
        }`}
        style={{ maxHeight: '580px' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0B1F4D 0%, #1a3a7a 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-[#F5A623] flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-5 h-5 text-[#0B1F4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0B1F4D]" />
            </div>
            <div>
              <p className="text-white font-extrabold text-sm leading-none tracking-tight">TTAI Assistant</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <p className="text-white/60 text-[10px]">Online · Global trade guide</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 bg-gray-50/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {/* AI avatar */}
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[#0B1F4D] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-[#F5A623]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                </div>
              )}

              <div className={`max-w-[80%] space-y-2.5 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Bubble */}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-[#0B1F4D] text-white rounded-tr-sm shadow-sm'
                      : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Product cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-1 w-full max-w-[360px] scrollbar-hide">
                    {msg.products.map((p) => <ProductCard key={p.id} p={p} />)}
                  </div>
                )}

                {/* Action card */}
                {msg.action && <ActionCard action={msg.action} />}
              </div>

              {/* User avatar */}
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[#F5A623] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <span className="text-[#0B1F4D] font-extrabold text-xs">
                    {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                  </span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-[#0B1F4D] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <svg className="w-3.5 h-3.5 text-[#F5A623] animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
              <TypingDots />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Category chips — only when no conversation yet */}
        {showCategoryChips && (
          <div className="px-4 pt-3 pb-1 flex-shrink-0 bg-white border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Browse by category</p>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.label}
                  onClick={() => sendMessage(c.query)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2 text-left hover:border-[#0B1F4D] hover:bg-[#0B1F4D]/5 transition-colors disabled:opacity-50"
                >
                  <span className="text-[#0B1F4D]">{c.icon}</span>
                  <span className="text-[10px] font-semibold text-gray-700 leading-tight">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 focus-within:border-[#0B1F4D] focus-within:ring-2 focus-within:ring-[#0B1F4D]/10 transition-all">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={user ? `Ask me anything, ${user.full_name?.split(' ')[0] ?? 'there'}…` : 'Search products, ask anything…'}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 text-gray-800"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 rounded-xl bg-[#0B1F4D] flex items-center justify-center disabled:opacity-40 hover:bg-[#162d6e] active:scale-95 transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-[9px] text-gray-300 text-center mt-1.5">TTAI AI · Ask about products, suppliers, regions</p>
        </div>
      </div>

      {/* ── Floating trigger button ─────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`fixed bottom-6 right-4 sm:right-6 z-[200] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 rotate-90 scale-90 shadow-lg'
            : 'bg-[#0B1F4D] hover:bg-[#162d6e] hover:scale-110 hover:shadow-[0_0_30px_rgba(11,31,77,0.4)]'
        }`}
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="absolute inset-0 rounded-full bg-[#F5A623]/40 animate-ping" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F5A623] border-2 border-white flex items-center justify-center">
              <svg className="w-2 h-2 text-[#0B1F4D]" fill="currentColor" viewBox="0 0 8 8">
                <path d="M4 1L5.5 3H6.5L4 7L1.5 3H2.5L4 1Z"/>
              </svg>
            </span>
          </>
        )}
      </button>
    </>
  )
}
