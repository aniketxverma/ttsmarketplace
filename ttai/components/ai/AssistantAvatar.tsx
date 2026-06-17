'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Bot, Sparkles } from 'lucide-react'
import { askAssistant } from './AssistantActions'

/**
 * Interactive AI mascot for the assistant hero. Animated glow ring + float +
 * live "online" pulse, a speech-bubble hint, and click-to-open the chat.
 */
export function AssistantAvatar({ url, size = 132 }: { url: string | null; size?: number }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={() => askAssistant()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative flex-shrink-0 group outline-none"
      aria-label="Open AI assistant"
    >
      {/* speech bubble hint */}
      <span className={`absolute -top-3 -left-24 z-20 whitespace-nowrap rounded-xl bg-white text-[#0B1F4D] text-xs font-bold px-3 py-1.5 shadow-lg transition-all duration-300 ${hover ? 'opacity-100 -translate-y-1' : 'opacity-0 translate-y-1 pointer-events-none'}`}>
        Ask me anything 💬
        <span className="absolute -bottom-1 right-4 w-2 h-2 bg-white rotate-45" />
      </span>

      {/* rotating glow ring */}
      <span className="absolute inset-0 rounded-full blur-2xl bg-[#F5A623]/30 group-hover:bg-[#F5A623]/50 transition-colors" />
      <span
        className="absolute -inset-2 rounded-full opacity-70 group-hover:opacity-100 transition-opacity animate-[spin_6s_linear_infinite]"
        style={{ background: 'conic-gradient(from 0deg, transparent, rgba(245,166,35,0.6), transparent 40%, rgba(96,165,250,0.6), transparent 75%)', WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))', mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))' }}
      />

      {/* avatar */}
      <span className="relative block animate-[mallFloat_5s_ease-in-out_infinite]" style={{ width: size, height: size }}>
        {url ? (
          <Image src={url} alt="TTAI Assistant" width={size} height={size} className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform" />
        ) : (
          <Bot className="w-full h-full text-white/85" strokeWidth={1.2} />
        )}
      </span>

      {/* online pulse */}
      <span className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-[#0B1F4D] border border-white/20 px-1.5 py-0.5">
        <span className="relative flex w-2 h-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-green-400" />
        </span>
      </span>

      {/* sparkle accent */}
      <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-[#F5A623] animate-pulse" />
    </button>
  )
}
