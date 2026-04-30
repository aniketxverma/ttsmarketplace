'use client'

import { useState } from 'react'
import Image from 'next/image'

interface SessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  products: any[]
  created_at: string
}

interface Session {
  key: string
  userId: string | null
  userName: string
  messageCount: number
  userCount: number
  firstQuery: string
  startedAt: string
  lastAt: string
  messages: SessionMessage[]
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString()
}

export function ChatSessionList({ sessions }: { sessions: Session[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div key={s.key} className="rounded-xl border bg-card overflow-hidden">
          {/* Session row */}
          <button
            onClick={() => setExpanded(expanded === s.key ? null : s.key)}
            className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
          >
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${s.userId ? 'bg-[#0B1F4D] text-white' : 'bg-gray-200 text-gray-500'}`}>
              {s.userId ? s.userName[0].toUpperCase() : '?'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm">{s.userName}</p>
                {!s.userId && (
                  <span className="text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Anonymous</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[300px]">"{s.firstQuery}"</p>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-right flex-shrink-0">
              <div>
                <p className="text-sm font-bold">{s.userCount}</p>
                <p className="text-[10px] text-muted-foreground">messages</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{timeAgo(s.lastAt)}</p>
              </div>
            </div>

            {/* Chevron */}
            <svg
              className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expanded === s.key ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Expanded conversation */}
          {expanded === s.key && (
            <div className="border-t bg-gray-50/50 px-5 py-4 space-y-3 max-h-[480px] overflow-y-auto">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Conversation · {new Date(s.startedAt).toLocaleString()}
              </p>
              {s.messages.map((m) => (
                <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-[#0B1F4D] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-[#F5A623]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                      </svg>
                    </div>
                  )}
                  <div className="max-w-[75%] space-y-2">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                        m.role === 'user'
                          ? 'bg-[#0B1F4D] text-white rounded-tr-sm'
                          : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100 shadow-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                    {m.products?.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {(m.products as any[]).slice(0, 4).map((p: any, pi: number) => (
                          <div key={pi} className="flex-shrink-0 w-28 rounded-xl border bg-white overflow-hidden">
                            {p.image_url && (
                              <div className="relative h-16">
                                <Image src={p.image_url} alt={p.name} fill className="object-cover" sizes="112px" />
                              </div>
                            )}
                            <div className="p-1.5">
                              <p className="text-[10px] font-semibold text-gray-700 line-clamp-1">{p.name}</p>
                              <p className="text-[10px] font-bold text-[#0B1F4D]">
                                {new Intl.NumberFormat('en-EU', { style: 'currency', currency: p.currency_code ?? 'EUR' }).format((p.price_cents ?? 0) / 100)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {m.products.length > 4 && (
                          <div className="flex-shrink-0 w-16 rounded-xl border bg-white flex items-center justify-center">
                            <p className="text-xs text-muted-foreground font-medium">+{m.products.length - 4}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground px-1">{timeAgo(m.created_at)}</p>
                  </div>
                  {m.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-[#F5A623] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-[#0B1F4D]">{s.userName[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
