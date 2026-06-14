'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Phone, Mail, Globe, MapPin, Share2, Copy, Check, Download, Crown,
  ShieldCheck, RotateCw, MessageCircle, Sparkles,
} from 'lucide-react'

export type CardData = {
  name: string; legal?: string | null; tagline?: string | null; logo?: string | null
  category?: string | null; country?: string | null; city?: string | null; flag?: string
  website?: string | null; phone?: string | null; whatsapp?: string | null; email?: string | null
  slug: string; tier?: string | null; verified?: boolean; url: string
}

type Tpl = { id: string; name: string; bg: string; text: string; sub: string; chip: string; accent: string }
const TEMPLATES: Tpl[] = [
  { id: 'navy',  name: 'Sapphire', bg: 'bg-gradient-to-br from-[#0B1F4D] via-[#13306e] to-[#1e3a8a]', text: 'text-white', sub: 'text-blue-200/80', chip: 'bg-white/10 border-white/20 text-white', accent: '#F5A623' },
  { id: 'gold',  name: 'Onyx',     bg: 'bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#0c0a09]', text: 'text-white', sub: 'text-amber-200/70', chip: 'bg-[#F5A623]/15 border-[#F5A623]/30 text-[#F5A623]', accent: '#F5A623' },
  { id: 'mint',  name: 'Emerald',  bg: 'bg-gradient-to-br from-[#075E54] via-[#0b7d6e] to-[#00a884]', text: 'text-white', sub: 'text-emerald-100/80', chip: 'bg-white/12 border-white/20 text-white', accent: '#ffffff' },
  { id: 'plat',  name: 'Platinum', bg: 'bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200', text: 'text-[#0B1F4D]', sub: 'text-gray-500', chip: 'bg-[#0B1F4D]/5 border-[#0B1F4D]/10 text-[#0B1F4D]', accent: '#7c3aed' },
]

export function BusinessCard({ data }: { data: CardData }) {
  const isGold = (data.tier ?? '').toUpperCase() === 'GOLD'
  const [tplId, setTplId] = useState(isGold ? 'gold' : 'navy')
  const [flipped, setFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  const t = TEMPLATES.find((x) => x.id === tplId)!
  const dark = t.id !== 'plat'

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(data.url)}`
  const loc = [data.city, data.country].filter(Boolean).join(', ')

  const share = async () => {
    const payload = { title: data.name, text: `${data.name} — on TTAI EMA`, url: data.url }
    if (typeof navigator !== 'undefined' && (navigator as any).share) { try { await (navigator as any).share(payload) } catch {} }
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${data.name} — on TTAI EMA\n${data.url}`)}`, '_blank')
  }
  const copy = () => { try { navigator.clipboard.writeText(data.url); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {} }
  const saveContact = () => {
    const v = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${data.name}`,
      data.legal ? `ORG:${data.legal}` : '', data.phone ? `TEL;TYPE=CELL:${data.phone}` : '',
      data.whatsapp ? `TEL;TYPE=WhatsApp:${data.whatsapp}` : '', data.email ? `EMAIL:${data.email}` : '',
      data.website ? `URL:${data.website}` : '', `URL:${data.url}`,
      loc ? `ADR;TYPE=WORK:;;${loc};;;;` : '', 'END:VCARD'].filter(Boolean).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([v], { type: 'text/vcard' }))
    a.download = `${data.name.replace(/[^\w]+/g, '-')}.vcf`; a.click(); URL.revokeObjectURL(a.href)
  }

  const TierIcon = isGold ? Crown : ShieldCheck

  return (
    <div className="w-full max-w-md mx-auto bc-enter">
      <style>{`
        @keyframes bcIn { from { opacity:0; transform: translateY(14px) scale(.97) } to { opacity:1; transform:none } }
        .bc-enter { animation: bcIn .6s cubic-bezier(.2,.7,.2,1) both }
        @keyframes bcShine { 0% { transform: translateX(-130%) skewX(-12deg) } 60%,100% { transform: translateX(230%) skewX(-12deg) } }
        .bc-shine::after { content:''; position:absolute; inset:0; background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.28) 50%,transparent 70%); animation: bcShine 4.5s ease-in-out infinite }
      `}</style>

      {/* Flip card */}
      <div style={{ perspective: '1400px' }}>
        <div className="relative w-full aspect-[1.62/1] transition-transform duration-700"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none' }}>

          {/* ── FRONT ── */}
          <div className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl p-5 sm:p-6 flex flex-col justify-between bc-shine ${t.bg} ${t.text}`}
            style={{ backfaceVisibility: 'hidden' }}>
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full" style={{ background: dark ? 'rgba(255,255,255,.06)' : 'rgba(124,58,237,.06)' }} />
            <div className="relative flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0 ring-1 ring-white/20">
                {data.logo ? <Image src={data.logo} alt="" width={48} height={48} className="object-cover w-full h-full" />
                  : <span className="font-black text-lg">{data.name[0]?.toUpperCase()}</span>}
              </div>
              {(data.verified || isGold) && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${t.chip}`}>
                  <TierIcon className="w-3 h-3" />{isGold ? 'Gold Verified' : 'Verified'}
                </span>
              )}
            </div>

            <div className="relative">
              <h3 className="text-xl sm:text-2xl font-black leading-tight tracking-tight">{data.name}</h3>
              {data.tagline && <p className={`text-xs sm:text-sm mt-1 line-clamp-2 ${t.sub}`}>{data.tagline}</p>}
              <div className={`flex items-center gap-3 mt-2.5 text-[11px] font-semibold ${t.sub}`}>
                {loc && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{data.flag} {loc}</span>}
                {data.category && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{data.category}</span>}
              </div>
            </div>

            <div className="relative flex items-center justify-between">
              <span className="text-[10px] font-extrabold tracking-widest uppercase" style={{ color: t.accent }}>TTAI EMA</span>
              {data.website && <span className={`text-[10px] ${t.sub} truncate max-w-[55%]`}>{data.website.replace(/^https?:\/\//, '')}</span>}
            </div>
          </div>

          {/* ── BACK ── */}
          <div className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl p-5 flex gap-4 ${t.bg} ${t.text}`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div className="flex flex-col justify-between min-w-0 flex-1">
              <div>
                <p className="font-extrabold text-base truncate">{data.name}</p>
                <p className={`text-[11px] ${t.sub} mb-2`}>Scan or tap to view the full profile</p>
              </div>
              <div className="space-y-1.5 text-[12px]">
                {data.whatsapp && <Row Icon={MessageCircle} text={data.whatsapp} sub={t.sub} />}
                {data.phone && data.phone !== data.whatsapp && <Row Icon={Phone} text={data.phone} sub={t.sub} />}
                {data.email && <Row Icon={Mail} text={data.email} sub={t.sub} />}
                {data.website && <Row Icon={Globe} text={data.website.replace(/^https?:\/\//, '')} sub={t.sub} />}
              </div>
              <span className="text-[10px] font-extrabold tracking-widest uppercase" style={{ color: t.accent }}>TTAI EMA</span>
            </div>
            <div className="flex-shrink-0 self-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR" className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template picker */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {TEMPLATES.map((x) => (
          <button key={x.id} onClick={() => setTplId(x.id)} title={x.name}
            className={`w-7 h-7 rounded-full ${x.bg} ring-2 transition-all ${tplId === x.id ? 'ring-[#0B1F4D] scale-110' : 'ring-transparent hover:scale-105'}`} />
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        <Action onClick={() => setFlipped((f) => !f)} Icon={RotateCw} label="Flip" />
        <Action onClick={share} Icon={Share2} label="Share" primary />
        <Action onClick={copy} Icon={copied ? Check : Copy} label={copied ? 'Copied' : 'Copy'} />
        <Action onClick={saveContact} Icon={Download} label="Save" />
      </div>
    </div>
  )
}

function Row({ Icon, text, sub }: { Icon: any; text: string; sub: string }) {
  return <p className="flex items-center gap-2 truncate"><Icon className="w-3.5 h-3.5 flex-shrink-0" /><span className={`truncate ${sub}`}>{text}</span></p>
}

function Action({ onClick, Icon, label, primary }: { onClick: () => void; Icon: any; label: string; primary?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold transition-colors ${
        primary ? 'bg-[#0B1F4D] text-white hover:bg-[#162d6e]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  )
}
