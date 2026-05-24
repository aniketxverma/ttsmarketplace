'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Radio, Users, FileText, Send, Settings, Copy, Check,
  Megaphone, Tag, Package, Bell, ExternalLink, Trash2,
  Eye, EyeOff, ChevronRight, Loader, Plus,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Channel = {
  id: string; name: string; description: string | null; whatsapp: string | null
  invite_code: string; is_active: boolean; member_count: number; post_count: number
  created_at: string
}
type Post = {
  id: string; content: string; image_url: string | null; post_type: string; created_at: string
}

// ── Post type config ──────────────────────────────────────────────────────────
const POST_TYPES = {
  update:       { label: 'Update',       Icon: Bell,      badge: 'bg-blue-100 text-blue-700',   bg: 'bg-blue-50',   text: 'text-blue-600'   },
  offer:        { label: 'Offer',        Icon: Tag,       badge: 'bg-amber-100 text-amber-700', bg: 'bg-amber-50',  text: 'text-amber-600'  },
  product:      { label: 'Product',      Icon: Package,   badge: 'bg-purple-100 text-purple-700',bg: 'bg-purple-50',text: 'text-purple-600' },
  announcement: { label: 'Announcement', Icon: Megaphone, badge: 'bg-green-100 text-green-700', bg: 'bg-green-50',  text: 'text-green-600'  },
} as const

type PostType = keyof typeof POST_TYPES

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SupplierChannelPage() {
  const [channel, setChannel]           = useState<Channel | null>(null)
  const [posts,   setPosts]             = useState<Post[]>([])
  const [loading, setLoading]           = useState(true)
  const [creating, setCreating]         = useState(false)
  const [posting,  setPosting]          = useState(false)
  const [settings, setSettings]         = useState(false)
  const [copied,   setCopied]           = useState(false)
  const [error,    setError]            = useState('')

  // Create form
  const [cForm, setCForm] = useState({ name: '', description: '', whatsapp: '' })
  // Post form
  const [pForm, setPForm] = useState({ content: '', image_url: '', post_type: 'update' as PostType })
  // Settings form
  const [sForm, setSForm] = useState({ name: '', description: '', whatsapp: '' })

  // ── Fetch channel ────────────────────────────────────────────────────────
  const loadChannel = useCallback(async () => {
    const res = await fetch('/api/channels')
    if (!res.ok) { setLoading(false); return }
    const { channel } = await res.json()
    if (channel) {
      setChannel(channel)
      setSForm({ name: channel.name, description: channel.description ?? '', whatsapp: channel.whatsapp ?? '' })
      loadPosts(channel.id)
    }
    setLoading(false)
  }, [])

  const loadPosts = async (channelId: string) => {
    const res = await fetch(`/api/channels/${channelId}/posts?limit=20`)
    const { posts } = await res.json()
    setPosts(posts ?? [])
  }

  useEffect(() => { loadChannel() }, [loadChannel])

  // ── Create channel ───────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cForm.name.trim()) return
    setCreating(true); setError('')
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cForm),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setCreating(false); return }
    setChannel(data.channel)
    setSForm({ name: data.channel.name, description: data.channel.description ?? '', whatsapp: data.channel.whatsapp ?? '' })
    setCreating(false)
  }

  // ── Create post ──────────────────────────────────────────────────────────
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channel || !pForm.content.trim()) return
    setPosting(true)
    const res = await fetch(`/api/channels/${channel.id}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pForm),
    })
    const data = await res.json()
    if (res.ok) {
      setPosts(prev => [data.post, ...prev])
      setPForm({ content: '', image_url: '', post_type: 'update' })
      setChannel(prev => prev ? { ...prev, post_count: prev.post_count + 1 } : prev)
    }
    setPosting(false)
  }

  // ── Save settings ────────────────────────────────────────────────────────
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channel) return
    const res = await fetch(`/api/channels/${channel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sForm),
    })
    const data = await res.json()
    if (res.ok) { setChannel(data.channel); setSettings(false) }
  }

  // ── Toggle active ────────────────────────────────────────────────────────
  const handleToggle = async () => {
    if (!channel) return
    const res = await fetch(`/api/channels/${channel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !channel.is_active }),
    })
    const data = await res.json()
    if (res.ok) setChannel(data.channel)
  }

  // ── Delete post ──────────────────────────────────────────────────────────
  const handleDeletePost = async (postId: string) => {
    if (!channel) return
    await fetch(`/api/channels/${channel.id}/posts/${postId}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.id !== postId))
    setChannel(prev => prev ? { ...prev, post_count: Math.max(prev.post_count - 1, 0) } : prev)
  }

  // ── Copy channel link ────────────────────────────────────────────────────
  const copyLink = async () => {
    if (!channel) return
    await navigator.clipboard.writeText(`${window.location.origin}/channel/${channel.id}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#0B1F4D] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════
  // CREATE FORM — shown when supplier has no channel yet
  // ════════════════════════════════════════════════════════════════════════
  if (!channel) return (
    <div className="max-w-xl mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#0B1F4D] to-[#1D4ED8]" />
        <div className="p-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0B1F4D] flex items-center justify-center mb-5 shadow-md">
            <Radio className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0B1F4D] mb-1">Create Your Canal</h1>
          <p className="text-sm text-gray-400 mb-7 leading-relaxed">
            Broadcast product updates, exclusive offers and announcements directly to buyers who follow your brand.
            TTAI manages the platform — you manage your canal.
          </p>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-5 border border-red-100">{error}</div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Canal Name *</label>
              <input
                type="text"
                value={cForm.name}
                onChange={e => setCForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Rosil &amp; Gomis Official"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Description</label>
              <textarea
                value={cForm.description}
                onChange={e => setCForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What will you share in this canal?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                WhatsApp Number <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="tel"
                value={cForm.whatsapp}
                onChange={e => setCForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="+34 600 000 000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">Members can contact you directly through this number.</p>
            </div>

            <button
              type="submit"
              disabled={creating || !cForm.name.trim()}
              className="w-full py-3.5 bg-[#0B1F4D] hover:bg-[#162d6e] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {creating
                ? <Loader className="w-4 h-4 animate-spin" />
                : <Radio className="w-4 h-4" />}
              {creating ? 'Creating…' : 'Launch Canal'}
            </button>
          </form>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          { icon: Radio,  title: 'Broadcast',  desc: 'Post updates to all members at once' },
          { icon: Users,  title: 'Grow',        desc: 'Buyers follow from your brand page' },
          { icon: Tag,    title: 'Sell More',   desc: 'Share exclusive offers & new products' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="w-9 h-9 rounded-xl bg-[#0B1F4D]/8 flex items-center justify-center mx-auto mb-2">
              <Icon className="w-4.5 h-4.5 text-[#0B1F4D]" />
            </div>
            <p className="text-xs font-extrabold text-gray-800 mb-0.5">{title}</p>
            <p className="text-[11px] text-gray-400 leading-tight">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════
  // MANAGEMENT DASHBOARD — shown when channel exists
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Channel header card ──────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0B1F4D 0%, #1a3a7a 60%, #0d3060 100%)' }}>
        <div className="px-7 py-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <Radio className="w-5 h-5 text-[#F5A623] flex-shrink-0" />
                <h1 className="text-xl font-extrabold text-white truncate">{channel.name}</h1>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  channel.is_active ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'
                }`}>
                  {channel.is_active ? '● Active' : '● Paused'}
                </span>
              </div>
              {channel.description && (
                <p className="text-white/55 text-sm leading-relaxed">{channel.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={copyLink}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                  copied ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Share'}
              </button>
              <Link href={`/channel/${channel.id}`} target="_blank"
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />Preview
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-extrabold text-white">{channel.member_count.toLocaleString()}</p>
              <p className="text-xs text-white/45 mt-0.5 flex items-center gap-1"><Users className="w-3 h-3" />Members</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="text-2xl font-extrabold text-white">{channel.post_count.toLocaleString()}</p>
              <p className="text-xs text-white/45 mt-0.5 flex items-center gap-1"><FileText className="w-3 h-3" />Posts</p>
            </div>
            {channel.whatsapp && (
              <>
                <div className="w-px h-10 bg-white/15" />
                <div>
                  <p className="text-xs text-white/45 mb-0.5">WhatsApp</p>
                  <p className="text-sm font-bold text-white">{channel.whatsapp}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Post Composer ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-extrabold text-[#0B1F4D] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <Plus className="w-4 h-4" />New Post
        </h2>
        <form onSubmit={handlePost} className="space-y-3">
          {/* Type chips */}
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(POST_TYPES) as [PostType, typeof POST_TYPES[PostType]][]).map(([value, cfg]) => (
              <button key={value} type="button"
                onClick={() => setPForm(f => ({ ...f, post_type: value }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border-2 transition-all ${
                  pForm.post_type === value
                    ? `${cfg.badge} border-current shadow-sm scale-105`
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                }`}>
                <cfg.Icon className="w-3.5 h-3.5" />{cfg.label}
              </button>
            ))}
          </div>
          <textarea
            value={pForm.content}
            onChange={e => setPForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write your update, offer, or announcement for your members…"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] resize-none"
            required
          />
          <input
            type="url"
            value={pForm.image_url}
            onChange={e => setPForm(f => ({ ...f, image_url: e.target.value }))}
            placeholder="Image URL (optional)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]"
          />
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">{channel.member_count > 0 ? `Visible to ${channel.member_count} member${channel.member_count !== 1 ? 's' : ''}` : 'Visible to all members once they join'}</p>
            <button type="submit" disabled={posting || !pForm.content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0B1F4D] hover:bg-[#162d6e] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm">
              {posting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {posting ? 'Posting…' : 'Post to Canal'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Posts feed ───────────────────────────────────────────────────── */}
      {posts.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-extrabold text-[#0B1F4D] mb-4 flex items-center gap-2 uppercase tracking-wide">
            <FileText className="w-4 h-4" />Recent Posts
          </h2>
          <div className="space-y-3">
            {posts.map(post => {
              const cfg = POST_TYPES[post.post_type as PostType] ?? POST_TYPES.update
              return (
                <div key={post.id} className="flex gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <cfg.Icon className={`w-4 h-4 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[11px] text-gray-400">{fmtDate(post.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
                    {post.image_url && (
                      <img src={post.image_url} alt="" className="mt-2 rounded-lg max-h-36 object-cover" />
                    )}
                  </div>
                  <button onClick={() => handleDeletePost(post.id)}
                    title="Delete post"
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium text-sm">No posts yet — compose your first update above.</p>
        </div>
      )}

      {/* ── Channel Settings ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => setSettings(!settings)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
          <span className="flex items-center gap-2 font-extrabold text-[#0B1F4D] text-sm">
            <Settings className="w-4 h-4" />Canal Settings
          </span>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${settings ? 'rotate-90' : ''}`} />
        </button>
        {settings && (
          <form onSubmit={handleSaveSettings} className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Canal Name *</label>
              <input type="text" value={sForm.name} onChange={e => setSForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Description</label>
              <textarea value={sForm.description} onChange={e => setSForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">WhatsApp Number</label>
              <input type="tel" value={sForm.whatsapp} onChange={e => setSForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="+34 600 000 000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" className="px-5 py-2.5 bg-[#0B1F4D] text-white rounded-xl text-sm font-bold hover:bg-[#162d6e] transition-colors">
                Save Changes
              </button>
              <button type="button" onClick={() => setSettings(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Danger zone ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h3 className="text-sm font-extrabold text-red-600 mb-4 uppercase tracking-wide">Danger Zone</h3>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-gray-800">
              {channel.is_active ? 'Pause Canal' : 'Resume Canal'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {channel.is_active
                ? 'Temporarily hide your canal from buyers. Posts are preserved.'
                : 'Make your canal visible and joinable again.'}
            </p>
          </div>
          <button onClick={handleToggle}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              channel.is_active
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-green-200 text-green-700 hover:bg-green-50'
            }`}>
            {channel.is_active ? <><EyeOff className="w-4 h-4" />Pause</> : <><Eye className="w-4 h-4" />Resume</>}
          </button>
        </div>
      </div>

    </div>
  )
}
