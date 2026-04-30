'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ChatProduct } from '@/app/api/chat/route'

interface Message {
  role: 'user' | 'assistant'
  content: string
  products?: ChatProduct[]
}

const SUGGESTED = [
  'Show me fresh produce',
  'Electronics under €200',
  'Building materials from Dubai',
  'Organic food suppliers',
]

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(cents / 100)
}

function ProductCard({ p }: { p: ChatProduct }) {
  return (
    <Link
      href={`/marketplace/${p.slug}`}
      className="flex-shrink-0 w-36 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="relative h-24 bg-gray-100">
        {p.image_url ? (
          <Image src={p.image_url} alt={p.name} fill className="object-cover" sizes="144px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-300">📦</div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{p.name}</p>
        <p className="text-xs font-bold text-[#0B1F4D] mt-1">{fmt(p.price_cents, p.currency_code)}</p>
        {p.category_name && (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{p.category_name}</p>
        )}
      </div>
    </Link>
  )
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm TTAI Assistant 👋 I can help you find products, compare prices, and explore our global marketplace. What are you looking for?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, messages])

  async function sendMessage(text?: string) {
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
        }),
      })

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content ?? 'Sorry, something went wrong.',
          products: data.products?.length > 0 ? data.products : undefined,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-4 sm:right-6 z-[200] w-[calc(100vw-2rem)] sm:w-[400px] rounded-2xl shadow-2xl border border-gray-100 bg-white flex flex-col overflow-hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ maxHeight: '540px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0B1F4D] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#0B1F4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">TTAI Assistant</p>
              <p className="text-white/50 text-[10px] mt-0.5">Powered by GPT-4o mini</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#0B1F4D] text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.products && msg.products.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 w-full max-w-[320px] sm:max-w-[360px]">
                    {msg.products.map((p) => (
                      <ProductCard key={p.id} p={p} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts — only shown when only greeting exists */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="flex-shrink-0 text-xs font-medium border border-gray-200 rounded-full px-3 py-1.5 hover:border-[#0B1F4D] hover:text-[#0B1F4D] transition-colors whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-[#0B1F4D] focus-within:ring-1 focus-within:ring-[#0B1F4D] transition-all">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about products…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-7 h-7 rounded-lg bg-[#0B1F4D] flex items-center justify-center disabled:opacity-40 hover:bg-[#162d6e] transition-colors flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`fixed bottom-6 right-4 sm:right-6 z-[200] w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-700 rotate-12 scale-90'
            : 'bg-[#0B1F4D] hover:bg-[#162d6e] hover:scale-110'
        }`}
        aria-label="Open AI assistant"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[#F5A623] opacity-30 animate-ping" />
            {/* Gold dot */}
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#F5A623] border-2 border-white" />
          </>
        )}
      </button>
    </>
  )
}
